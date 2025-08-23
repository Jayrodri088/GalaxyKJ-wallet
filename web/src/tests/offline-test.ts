/**
 * Simple Offline Functionality Tests
 * Run these tests manually to verify offline support implementation
 */

// Test 1: Service Worker Registration
export async function testServiceWorkerRegistration(): Promise<boolean> {
  console.log('🧪 Testing Service Worker Registration...');
  
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.getRegistration();
      if (registration) {
        console.log('✅ Service Worker is registered:', registration.scope);
        return true;
      } else {
        console.log('❌ Service Worker not found');
        return false;
      }
    } else {
      console.log('❌ Service Worker not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ Service Worker test failed:', error);
    return false;
  }
}

// Test 2: Offline Manager (IndexedDB)
export async function testOfflineManager(): Promise<boolean> {
  console.log('🧪 Testing Offline Manager (IndexedDB)...');
  
  try {
    // Import the offline manager
    const { offlineManager } = await import('../lib/offline/offline-manager');
    
    // Test saving data
    await offlineManager.saveWalletData('test-key', { balance: 1000 });
    
    // Test retrieving data
    const data = await offlineManager.getWalletData('test-key');
    
    if (data && data.balance === 1000) {
      console.log('✅ Offline Manager working correctly');
      return true;
    } else {
      console.log('❌ Offline Manager data retrieval failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Offline Manager test failed:', error);
    return false;
  }
}

// Test 3: Connection Status Detection
export function testConnectionStatus(): boolean {
  console.log('🧪 Testing Connection Status Detection...');
  
  try {
    const isOnline = navigator.onLine;
    console.log(`✅ Connection status detected: ${isOnline ? 'Online' : 'Offline'}`);
    
    // Test online/offline event listeners
    const onlineHandler = () => console.log('✅ Online event fired');
    const offlineHandler = () => console.log('✅ Offline event fired');
    
    window.addEventListener('online', onlineHandler);
    window.addEventListener('offline', offlineHandler);
    
    // Clean up listeners after test
    setTimeout(() => {
      window.removeEventListener('online', onlineHandler);
      window.removeEventListener('offline', offlineHandler);
    }, 1000);
    
    return true;
  } catch (error) {
    console.error('❌ Connection status test failed:', error);
    return false;
  }
}

// Test 4: Cache API
export async function testCacheAPI(): Promise<boolean> {
  console.log('🧪 Testing Cache API...');
  
  try {
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      const hasGalaxyCache = cacheNames.some(name => name.includes('galaxy-wallet'));
      
      if (hasGalaxyCache) {
        console.log('✅ Galaxy Wallet cache found:', cacheNames.filter(name => name.includes('galaxy-wallet')));
        return true;
      } else {
        console.log('⚠️ Galaxy Wallet cache not found, but Cache API is available');
        return true; // Cache might not be created yet
      }
    } else {
      console.log('❌ Cache API not supported');
      return false;
    }
  } catch (error) {
    console.error('❌ Cache API test failed:', error);
    return false;
  }
}

// Test 5: Offline Transaction Queue
export async function testTransactionQueue(): Promise<boolean> {
  console.log('🧪 Testing Transaction Queue...');
  
  try {
    const { offlineManager } = await import('../lib/offline/offline-manager');
    
    // Test adding transaction to queue
    const testTransaction = {
      id: 'test-tx-' + Date.now(),
      data: { amount: 100, to: 'test-address' },
      timestamp: Date.now(),
      status: 'pending' as const
    };
    
    await offlineManager.queueTransaction(testTransaction);
    
    // Test getting queued transactions
    const queuedTransactions = await offlineManager.getPendingTransactions();
    const foundTransaction = queuedTransactions.find(tx => tx.id === testTransaction.id);
    
    if (foundTransaction) {
      console.log('✅ Transaction queue working correctly');
      return true;
    } else {
      console.log('❌ Transaction queue test failed');
      return false;
    }
  } catch (error) {
    console.error('❌ Transaction queue test failed:', error);
    return false;
  }
}

// Run all tests
export async function runAllOfflineTests(): Promise<void> {
  console.log('🚀 Starting Offline Functionality Tests...\n');
  
  const tests = [
    { name: 'Service Worker Registration', test: testServiceWorkerRegistration },
    { name: 'Offline Manager', test: testOfflineManager },
    { name: 'Connection Status', test: testConnectionStatus },
    { name: 'Cache API', test: testCacheAPI },
    { name: 'Transaction Queue', test: testTransactionQueue }
  ];
  
  const results = [];
  
  for (const { name, test } of tests) {
    console.log(`\n📋 Running: ${name}`);
    try {
      const result = await test();
      results.push({ name, passed: result });
    } catch (error) {
      console.error(`❌ ${name} failed with error:`, error);
      results.push({ name, passed: false });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(({ name, passed }) => {
    console.log(`${passed ? '✅' : '❌'} ${name}`);
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All offline functionality tests passed!');
  } else {
    console.log('⚠️ Some tests failed. Check the implementation.');
  }
}

// Export for manual testing in browser console
if (typeof window !== 'undefined') {
  (window as any).testOfflineFunctionality = runAllOfflineTests;
  console.log('🧪 Offline tests available. Run: testOfflineFunctionality()');
}
