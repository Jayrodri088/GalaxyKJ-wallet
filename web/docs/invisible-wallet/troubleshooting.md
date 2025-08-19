# Troubleshooting Guide

## 🔧 Common Issues & Solutions

This guide helps you diagnose and fix common issues when working with the Invisible Wallets system.

## 🚨 Error Categories

### 1. Wallet Creation Issues

#### Error: "WALLET_ALREADY_EXISTS"

**Symptoms:**
- Cannot create wallet with existing email/platform combination
- Error occurs on second wallet creation attempt

**Causes:**
- Wallet already exists for this email/platform/network combination
- Previous creation attempt succeeded but UI didn't update

**Solutions:**
```typescript
// Option 1: Try recovering instead of creating
try {
  const wallet = await createWallet(email, passphrase);
} catch (error) {
  if (error.message.includes('WALLET_ALREADY_EXISTS')) {
    // Try recovery instead
    const recoveredWallet = await recoverWallet(email, passphrase);
    return recoveredWallet;
  }
  throw error;
}

// Option 2: Check if wallet exists first
const existingWallet = await getWallet(email, { network: 'testnet' });
if (existingWallet) {
  console.log('Wallet already exists, using existing wallet');
  return existingWallet;
}
```

#### Error: "WEAK_PASSPHRASE"

**Symptoms:**
- Wallet creation fails with passphrase validation error
- Error message about passphrase requirements

**Solutions:**
```typescript
// Implement client-side validation
const validatePassphrase = (passphrase: string) => {
  const errors: string[] = [];
  
  if (passphrase.length < 12) {
    errors.push('Must be at least 12 characters long');
  }
  if (!/[A-Z]/.test(passphrase)) {
    errors.push('Must contain uppercase letter');
  }
  if (!/[a-z]/.test(passphrase)) {
    errors.push('Must contain lowercase letter');
  }
  if (!/[0-9]/.test(passphrase)) {
    errors.push('Must contain number');
  }
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
    errors.push('Must contain special character');
  }
  
  return { isValid: errors.length === 0, errors };
};

// Use in your form
const validation = validatePassphrase(userPassphrase);
if (!validation.isValid) {
  setErrors(validation.errors);
  return;
}
```

#### Error: "ENCRYPTION_FAILED" or "KEY_DERIVATION_FAILED"

**Symptoms:**
- Wallet creation fails during cryptographic operations
- Browser compatibility issues

**Causes:**
- Unsupported browser (missing Web Crypto API)
- HTTP instead of HTTPS in production
- Browser extensions interfering

**Solutions:**
```typescript
// Check browser compatibility
function checkBrowserSupport() {
  const issues: string[] = [];
  
  if (!window.crypto || !window.crypto.subtle) {
    issues.push('Web Crypto API not supported');
  }
  
  if (!window.indexedDB) {
    issues.push('IndexedDB not supported');
  }
  
  if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
    issues.push('HTTPS required for Web Crypto API');
  }
  
  return { supported: issues.length === 0, issues };
}

// Use in your component
useEffect(() => {
  const support = checkBrowserSupport();
  if (!support.supported) {
    setError(`Browser not supported: ${support.issues.join(', ')}`);
  }
}, []);
```

### 2. Wallet Recovery Issues

#### Error: "WALLET_NOT_FOUND"

**Symptoms:**
- Cannot recover wallet with correct credentials
- Wallet seems to have disappeared

**Causes:**
- Wrong network selected (testnet vs mainnet)
- Wrong platform ID
- IndexedDB data cleared/corrupted
- Typo in email or passphrase

**Solutions:**
```typescript
// Debug wallet recovery
const debugWalletRecovery = async (email: string, passphrase: string) => {
  console.log('Debugging wallet recovery...');
  
  // Check both networks
  for (const network of ['testnet', 'mainnet']) {
    try {
      const wallet = await getWallet(email, { network });
      if (wallet) {
        console.log(`Found wallet on ${network}:`, wallet.id);
        return wallet;
      }
    } catch (error) {
      console.log(`No wallet found on ${network}`);
    }
  }
  
  // Check IndexedDB directly
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('InvisibleWalletsDB');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction(['wallets'], 'readonly');
  const store = transaction.objectStore('wallets');
  const allWallets = await new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  console.log('All wallets in IndexedDB:', allWallets);
};
```

#### Error: "INVALID_CREDENTIALS" or "DECRYPTION_FAILED"

**Symptoms:**
- Wallet found but decryption fails
- Wrong passphrase error

**Solutions:**
```typescript
// Implement passphrase hints (without storing the actual passphrase)
const createPassphraseHint = (passphrase: string): string => {
  // Create a hint without storing the actual passphrase
  return `${passphrase.length} chars, starts with '${passphrase[0]}', ends with '${passphrase[passphrase.length - 1]}'`;
};

// Store hint with wallet metadata
const walletWithHint = await createWallet(email, passphrase, {
  metadata: {
    passphraseHint: createPassphraseHint(passphrase),
    createdAt: new Date().toISOString()
  }
});
```

### 3. Transaction Signing Issues

#### Error: "INVALID_TRANSACTION_XDR"

**Symptoms:**
- Transaction signing fails with XDR validation error
- Malformed transaction data

**Solutions:**
```typescript
// Validate XDR before signing
import { TransactionBuilder } from '@stellar/stellar-sdk';

const validateTransactionXDR = (xdr: string, network: NetworkType) => {
  try {
    const networkPassphrase = network === 'testnet' 
      ? Networks.TESTNET 
      : Networks.PUBLIC;
      
    const transaction = TransactionBuilder.fromXDR(xdr, networkPassphrase);
    
    // Additional validation
    if (transaction.operations.length === 0) {
      throw new Error('Transaction has no operations');
    }
    
    return { valid: true, transaction };
  } catch (error) {
    return { valid: false, error: error.message };
  }
};

// Use before signing
const validation = validateTransactionXDR(transactionXDR, 'testnet');
if (!validation.valid) {
  throw new Error(`Invalid transaction: ${validation.error}`);
}
```

#### Error: "SEQUENCE_NUMBER_MISMATCH"

**Symptoms:**
- Transaction fails with sequence number error
- Multiple transactions sent simultaneously

**Solutions:**
```typescript
// Fetch current sequence number before building transaction
const buildTransactionWithCorrectSequence = async (
  publicKey: string,
  operations: Operation[],
  network: NetworkType
) => {
  const server = new Horizon.Server(
    network === 'testnet' 
      ? 'https://horizon-testnet.stellar.org'
      : 'https://horizon.stellar.org'
  );
  
  // Fetch current account data
  const account = await server.loadAccount(publicKey);
  
  // Build transaction with correct sequence
  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: network === 'testnet' ? Networks.TESTNET : Networks.PUBLIC,
  });
  
  operations.forEach(op => transaction.addOperation(op));
  
  return transaction.setTimeout(300).build();
};
```

### 4. Network & Connection Issues

#### Error: "NETWORK_ERROR" or "HORIZON_TIMEOUT"

**Symptoms:**
- Cannot connect to Stellar network
- Timeout errors when fetching balances

**Solutions:**
```typescript
// Implement retry logic with exponential backoff
const retryWithBackoff = async <T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      
      const delay = baseDelay * Math.pow(2, attempt - 1);
      console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw new Error('Max retries exceeded');
};

// Use with network operations
const getWalletBalance = async (publicKey: string) => {
  return retryWithBackoff(async () => {
    const server = new Horizon.Server('https://horizon-testnet.stellar.org');
    const account = await server.loadAccount(publicKey);
    return account.balances;
  });
};
```

#### Error: "FUNDING_FAILED" (Testnet)

**Symptoms:**
- New testnet accounts not getting funded
- Friendbot service unavailable

**Solutions:**
```typescript
// Alternative funding methods for testnet
const fundTestnetAccount = async (publicKey: string) => {
  const fundingMethods = [
    // Method 1: Official Friendbot
    () => fetch(`https://friendbot.stellar.org?addr=${publicKey}`),
    
    // Method 2: Alternative Friendbot
    () => fetch(`https://horizon-testnet.stellar.org/friendbot?addr=${publicKey}`),
    
    // Method 3: Manual funding (if you have a funded account)
    () => manuallyFundAccount(publicKey)
  ];
  
  for (const [index, method] of fundingMethods.entries()) {
    try {
      console.log(`Trying funding method ${index + 1}...`);
      await method();
      
      // Verify funding worked
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait for ledger
      const server = new Horizon.Server('https://horizon-testnet.stellar.org');
      const account = await server.loadAccount(publicKey);
      
      if (parseFloat(account.balances[0].balance) > 0) {
        console.log('Funding successful!');
        return;
      }
    } catch (error) {
      console.log(`Funding method ${index + 1} failed:`, error.message);
    }
  }
  
  throw new Error('All funding methods failed');
};
```

### 5. Browser & Storage Issues

#### Error: "STORAGE_QUOTA_EXCEEDED"

**Symptoms:**
- Cannot save new wallets
- IndexedDB storage full

**Solutions:**
```typescript
// Monitor storage usage
const checkStorageQuota = async () => {
  if ('storage' in navigator && 'estimate' in navigator.storage) {
    const estimate = await navigator.storage.estimate();
    const usedMB = (estimate.usage || 0) / (1024 * 1024);
    const quotaMB = (estimate.quota || 0) / (1024 * 1024);
    
    console.log(`Storage used: ${usedMB.toFixed(2)}MB / ${quotaMB.toFixed(2)}MB`);
    
    if (estimate.usage && estimate.quota) {
      const usagePercent = (estimate.usage / estimate.quota) * 100;
      if (usagePercent > 80) {
        console.warn('Storage usage is high:', usagePercent.toFixed(1) + '%');
        return { warning: true, usage: usagePercent };
      }
    }
  }
  
  return { warning: false, usage: 0 };
};

// Cleanup old data
const cleanupOldWallets = async () => {
  const db = await new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open('InvisibleWalletsDB');
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  const transaction = db.transaction(['wallets'], 'readwrite');
  const store = transaction.objectStore('wallets');
  
  // Get all wallets
  const allWallets = await new Promise<any[]>((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
  
  // Remove wallets older than 6 months with no recent access
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  for (const wallet of allWallets) {
    const lastAccessed = new Date(wallet.lastAccessedAt || wallet.createdAt);
    if (lastAccessed < sixMonthsAgo) {
      await new Promise<void>((resolve, reject) => {
        const deleteRequest = store.delete(wallet.id);
        deleteRequest.onsuccess = () => resolve();
        deleteRequest.onerror = () => reject(deleteRequest.error);
      });
      console.log('Cleaned up old wallet:', wallet.id);
    }
  }
};
```

#### Error: Browser Compatibility Issues

**Symptoms:**
- Features not working in certain browsers
- Missing Web APIs

**Solutions:**
```typescript
// Comprehensive browser support check
const getBrowserCompatibility = () => {
  const checks = {
    webCrypto: !!(window.crypto && window.crypto.subtle),
    indexedDB: !!window.indexedDB,
    fetch: !!window.fetch,
    promises: typeof Promise !== 'undefined',
    es6: (() => {
      try {
        eval('const test = () => {};');
        return true;
      } catch {
        return false;
      }
    })(),
    localStorage: (() => {
      try {
        localStorage.setItem('test', 'test');
        localStorage.removeItem('test');
        return true;
      } catch {
        return false;
      }
    })(),
  };
  
  const unsupported = Object.entries(checks)
    .filter(([_, supported]) => !supported)
    .map(([feature]) => feature);
  
  return {
    supported: unsupported.length === 0,
    unsupported,
    checks
  };
};

// Display compatibility warning
const CompatibilityWarning = () => {
  const [compatibility, setCompatibility] = useState(null);
  
  useEffect(() => {
    setCompatibility(getBrowserCompatibility());
  }, []);
  
  if (!compatibility || compatibility.supported) {
    return null;
  }
  
  return (
    <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
      <h3 className="text-red-800 font-semibold">Browser Compatibility Issues</h3>
      <p className="text-red-700 text-sm mt-1">
        Your browser doesn't support the following required features:
      </p>
      <ul className="text-red-700 text-sm mt-2 list-disc list-inside">
        {compatibility.unsupported.map(feature => (
          <li key={feature}>{feature}</li>
        ))}
      </ul>
      <p className="text-red-700 text-sm mt-2">
        Please update your browser or use a modern browser like Chrome, Firefox, or Safari.
      </p>
    </div>
  );
};
```

## 🔍 Debugging Tools

### 1. Debug Component

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';

export function WalletDebugger() {
  const { sdk } = useInvisibleWallet({
    platformId: 'debug-tool-v1',
    defaultNetwork: 'testnet',
    debug: true,
  });
  
  const [debugInfo, setDebugInfo] = useState({
    browserSupport: null,
    storageInfo: null,
    networkStatus: null,
    walletCount: 0,
  });
  
  useEffect(() => {
    const gatherDebugInfo = async () => {
      // Browser support
      const browserSupport = getBrowserCompatibility();
      
      // Storage info
      const storageInfo = await checkStorageQuota();
      
      // Network status
      const networkStatus = await checkNetworkConnectivity();
      
      // Wallet count
      const walletCount = await getWalletCount();
      
      setDebugInfo({
        browserSupport,
        storageInfo,
        networkStatus,
        walletCount,
      });
    };
    
    gatherDebugInfo();
  }, []);
  
  const exportDebugData = () => {
    const debugData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...debugInfo,
    };
    
    const blob = new Blob([JSON.stringify(debugData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Wallet Debugger</h1>
        <button
          onClick={exportDebugData}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
        >
          Export Debug Data
        </button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Browser Support */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Browser Support</h2>
          {debugInfo.browserSupport && (
            <div className="space-y-2">
              {Object.entries(debugInfo.browserSupport.checks).map(([feature, supported]) => (
                <div key={feature} className="flex justify-between items-center">
                  <span className="capitalize">{feature.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={`px-2 py-1 rounded text-sm ${
                    supported ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {supported ? '✓' : '✗'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Storage Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Storage Information</h2>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Wallet Count</span>
              <span>{debugInfo.walletCount}</span>
            </div>
            {debugInfo.storageInfo && (
              <div className="flex justify-between">
                <span>Storage Usage</span>
                <span>{debugInfo.storageInfo.usage.toFixed(1)}%</span>
              </div>
            )}
          </div>
        </div>
        
        {/* Network Status */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">Network Status</h2>
          {debugInfo.networkStatus && (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Testnet</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  debugInfo.networkStatus.testnet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.networkStatus.testnet ? 'Online' : 'Offline'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mainnet</span>
                <span className={`px-2 py-1 rounded text-sm ${
                  debugInfo.networkStatus.mainnet ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {debugInfo.networkStatus.mainnet ? 'Online' : 'Offline'}
                </span>
              </div>
            </div>
          )}
        </div>
        
        {/* System Info */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold mb-4">System Information</h2>
          <div className="space-y-2 text-sm">
            <div>
              <strong>User Agent:</strong>
              <div className="text-xs mt-1 p-2 bg-gray-100 rounded font-mono">
                {navigator.userAgent}
              </div>
            </div>
            <div>
              <strong>Platform:</strong> {navigator.platform}
            </div>
            <div>
              <strong>Language:</strong> {navigator.language}
            </div>
            <div>
              <strong>Online:</strong> {navigator.onLine ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Helper functions
async function checkNetworkConnectivity() {
  const testUrls = {
    testnet: 'https://horizon-testnet.stellar.org',
    mainnet: 'https://horizon.stellar.org',
  };
  
  const results = {};
  
  for (const [network, url] of Object.entries(testUrls)) {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      results[network] = response.ok;
    } catch {
      results[network] = false;
    }
  }
  
  return results;
}

async function getWalletCount() {
  try {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('InvisibleWalletsDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const transaction = db.transaction(['wallets'], 'readonly');
    const store = transaction.objectStore('wallets');
    
    return new Promise<number>((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return 0;
  }
}
```

### 2. Console Debugging Commands

Add these to your browser console for debugging:

```javascript
// Global debugging functions (add to window in development)
window.walletDebug = {
  // List all wallets in IndexedDB
  async listWallets() {
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('InvisibleWalletsDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const transaction = db.transaction(['wallets'], 'readonly');
    const store = transaction.objectStore('wallets');
    
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => {
        console.table(request.result);
        resolve(request.result);
      };
      request.onerror = () => reject(request.error);
    });
  },
  
  // Clear all wallet data
  async clearAllWallets() {
    const confirmed = confirm('Are you sure you want to delete ALL wallet data?');
    if (!confirmed) return;
    
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open('InvisibleWalletsDB');
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    
    const transaction = db.transaction(['wallets', 'auditLogs'], 'readwrite');
    
    await Promise.all([
      new Promise((resolve, reject) => {
        const request = transaction.objectStore('wallets').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      }),
      new Promise((resolve, reject) => {
        const request = transaction.objectStore('auditLogs').clear();
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      })
    ]);
    
    console.log('All wallet data cleared');
  },
  
  // Test network connectivity
  async testNetworks() {
    const networks = {
      testnet: 'https://horizon-testnet.stellar.org',
      mainnet: 'https://horizon.stellar.org'
    };
    
    for (const [name, url] of Object.entries(networks)) {
      try {
        const start = Date.now();
        const response = await fetch(url);
        const duration = Date.now() - start;
        
        console.log(`${name}: ${response.ok ? '✓' : '✗'} (${duration}ms)`);
      } catch (error) {
        console.log(`${name}: ✗ (${error.message})`);
      }
    }
  }
};

// Usage:
// walletDebug.listWallets()
// walletDebug.testNetworks()
// walletDebug.clearAllWallets()
```

## 📞 Getting Help

### 1. Error Reporting Template

When reporting issues, please include:

```
**Issue Description:**
Brief description of what went wrong

**Steps to Reproduce:**
1. Step one
2. Step two
3. Step three

**Expected Behavior:**
What should have happened

**Actual Behavior:**
What actually happened

**Environment:**
- Browser: Chrome 120.0.0.0
- OS: macOS 14.1
- Network: testnet/mainnet
- Platform ID: your-platform-id

**Error Messages:**
```
Exact error message here
```

**Console Logs:**
```
Any relevant console output
```

**Debug Data:**
(Attach debug data export from debugger tool)
```

### 2. Self-Diagnosis Checklist

Before reporting an issue, please check:

- [ ] Browser is supported (Chrome 90+, Firefox 88+, Safari 14+)
- [ ] Using HTTPS (required for Web Crypto API)
- [ ] No browser extensions interfering
- [ ] Network connectivity is working
- [ ] Correct network selected (testnet vs mainnet)
- [ ] Passphrase meets requirements
- [ ] Platform ID is correct
- [ ] No typos in email address
- [ ] IndexedDB storage not full
- [ ] Console shows no unrelated errors

### 3. Common Solutions Summary

| Issue | Quick Fix |
|-------|-----------|
| Wallet creation fails | Check passphrase requirements |
| Wallet not found | Verify network and platform ID |
| Decryption failed | Double-check passphrase |
| Network errors | Check internet connection |
| Browser not supported | Update browser or use Chrome/Firefox |
| Storage full | Clear old wallets or use cleanup tools |
| Transaction fails | Validate XDR and check sequence number |
| Performance issues | Clear browser cache and restart |

Remember: The Invisible Wallets system is designed to be secure and user-friendly. Most issues can be resolved by following the troubleshooting steps above. If you continue to experience problems, the debug tools and error reporting template will help identify the root cause.
