const CACHE_NAME = 'galaxy-wallet-v3';
const OFFLINE_CACHE = 'galaxy-wallet-offline-v3';
const TRANSACTION_QUEUE_KEY = 'transaction-queue';

// Files to cache for offline functionality
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/send-receive',
  '/transactions',
  '/settings',
  '/offline',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/galaxy-smart-wallet-logo.png',
  '/galaxy-text-logo.png'
];

// Service Worker Installation
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets');
        return cache.addAll(STATIC_ASSETS);
      })
      .then(() => {
        console.log('Service Worker: Installed successfully');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('Service Worker: Installation failed', error);
      })
  );
});

// Service Worker Activation
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && cacheName !== OFFLINE_CACHE) {
            console.log('Service Worker: Deleting old cache', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('Service Worker: Activated successfully');
      return self.clients.claim();
    })
  );
});

// Request Interception
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Strategy: Network First for API calls, Cache First for static assets
  if (url.pathname.startsWith('/api/') || url.pathname.includes('stellar')) {
    event.respondWith(handleApiRequest(request));
  } else if (request.method === 'GET') {
    event.respondWith(handleStaticRequest(request));
  } else if (request.method === 'POST' && url.hostname.includes('stellar') && url.pathname.includes('transaction')) {
    event.respondWith(handleTransactionRequest(request));
  }
});

// API Request Handling
async function handleApiRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache successful response
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache', error);
  }

  // Fallback to cache
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  // Fallback to offline page
  return caches.match('/offline');
}

// Static Request Handling
async function handleStaticRequest(request) {
  const cachedResponse = await caches.match(request);
  
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    console.log('Service Worker: Static asset fetch failed', error);
    return new Response('Offline - Cannot access this resource', {
      status: 503,
      statusText: 'Service Unavailable'
    });
  }
}

// Offline Transaction Handling
async function handleTransactionRequest(request) {
  // Clone the request BEFORE using it, to avoid "Request body is already used" error
  const requestClone = request.clone();
  
  try {
    // Try to send the transaction
    const response = await fetch(request);
    
    if (response.ok) {
      // Process pending transaction queue
      await processTransactionQueue();
      return response;
    }
  } catch (error) {
    console.log('Service Worker: Transaction failed, queuing for later', error);
  }

  // If it fails, add to queue using the cloned request
  let transactionData;
  try {
    // Try to get the request body as text first (for Stellar transactions)
    const bodyText = await requestClone.text();
    
    // If it looks like JSON, parse it as JSON
    if (bodyText.trim().startsWith('{') || bodyText.trim().startsWith('[')) {
      transactionData = JSON.parse(bodyText);
    } else {
      // For Stellar transactions (form data like "tx=AAAAAgAA...")
      transactionData = {
        url: requestClone.url,
        method: requestClone.method,
        headers: Object.fromEntries(requestClone.headers),
        body: bodyText,
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    console.log('Service Worker: Failed to parse transaction data, storing raw request info');
    transactionData = {
      url: requestClone.url,
      method: requestClone.method,
      timestamp: new Date().toISOString(),
      error: 'Failed to parse body'
    };
  }
  
  await addToTransactionQueue(transactionData);

  return new Response(JSON.stringify({
    success: false,
    message: 'Transaction queued for offline processing',
    queued: true
  }), {
    status: 202,
    headers: { 'Content-Type': 'application/json' }
  });
}

// Add transaction to queue
async function addToTransactionQueue(transactionData) {
  try {
    const queue = await getTransactionQueue();
    queue.push({
      ...transactionData,
      timestamp: Date.now(),
      id: generateTransactionId()
    });
    
    await setTransactionQueue(queue);
    console.log('Service Worker: Transaction queued', transactionData);
  } catch (error) {
    console.error('Service Worker: Failed to queue transaction', error);
  }
}

// Process transaction queue
async function processTransactionQueue() {
  try {
    const queue = await getTransactionQueue();
    if (queue.length === 0) return;

    console.log('Service Worker: Processing transaction queue', queue.length);

    for (const transaction of queue) {
      try {
        // Try to process each transaction
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transaction)
        });

        if (response.ok) {
          // Remove from queue if successful
          const updatedQueue = queue.filter(t => t.id !== transaction.id);
          await setTransactionQueue(updatedQueue);
          console.log('Service Worker: Queued transaction processed successfully', transaction.id);
        }
      } catch (error) {
        console.error('Service Worker: Failed to process queued transaction', error);
      }
    }
  } catch (error) {
    console.error('Service Worker: Failed to process transaction queue', error);
  }
}

// Get transaction queue
async function getTransactionQueue() {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const response = await cache.match(TRANSACTION_QUEUE_KEY);
    return response ? await response.json() : [];
  } catch (error) {
    console.error('Service Worker: Failed to get transaction queue', error);
    return [];
  }
}

// Save transaction queue
async function setTransactionQueue(queue) {
  try {
    const cache = await caches.open(OFFLINE_CACHE);
    const response = new Response(JSON.stringify(queue), {
      headers: { 'Content-Type': 'application/json' }
    });
    await cache.put(TRANSACTION_QUEUE_KEY, response);
  } catch (error) {
    console.error('Service Worker: Failed to set transaction queue', error);
  }
}

// Generate unique ID for transactions
function generateTransactionId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Background synchronization
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    console.log('Service Worker: Background sync triggered');
    event.waitUntil(processTransactionQueue());
  }
});

// Client message handling
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'GET_OFFLINE_STATUS') {
    event.ports[0].postMessage({
      type: 'OFFLINE_STATUS',
      isOnline: navigator.onLine
    });
  }
});
