#!/usr/bin/env node

/**
 * Simple Offline Functionality Test Script
 * Run with: node test-offline.js
 */

const fs = require('fs');
const path = require('path');

console.log('🧪 Testing Offline Implementation Files...\n');

const tests = [
  {
    name: 'Service Worker',
    file: 'public/sw.js',
    checks: [
      'CACHE_NAME',
      'STATIC_ASSETS',
      'install',
      'activate',
      'fetch',
      'transaction'
    ]
  },
  {
    name: 'Offline Manager',
    file: 'src/lib/offline/offline-manager.ts',
    checks: [
      'OfflineDB',
      'IndexedDB',
      'saveWalletData',
      'getWalletData',
      'queueTransaction'
    ]
  },
  {
    name: 'React Hooks',
    file: 'src/hooks/use-offline.ts',
    checks: [
      'useOffline',
      'useOfflineTransactions',
      'useOfflineCache',
      'navigator.onLine'
    ]
  },
  {
    name: 'UI Components',
    file: 'src/components/ui/offline-indicator.tsx',
    checks: [
      'OfflineIndicator',
      'OfflineStatusToast',
      'PendingTransactionsIndicator',
      'variant'
    ]
  },
  {
    name: 'Service Worker Registration',
    file: 'src/lib/register-sw.ts',
    checks: [
      'registerServiceWorker',
      'updateServiceWorker',
      'checkServiceWorkerStatus'
    ]
  },
  {
    name: 'Offline Page',
    file: 'src/app/offline/page.tsx',
    checks: [
      'OfflinePage',
      'useOffline',
      'connection status',
      'pending transactions'
    ]
  },
  {
    name: 'Next.js Config',
    file: 'next.config.ts',
    checks: [
      'headers',
      'rewrites',
      'sw.js',
      'offline'
    ]
  }
];

let passedTests = 0;
let totalTests = 0;

tests.forEach(test => {
  console.log(`📋 Testing: ${test.name}`);
  
  const filePath = path.join(__dirname, test.file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ File not found: ${test.file}`);
    totalTests++;
    return;
  }
  
  const content = fs.readFileSync(filePath, 'utf8');
  let filePassed = 0;
  
  test.checks.forEach(check => {
    if (content.includes(check)) {
      console.log(`  ✅ ${check}`);
      filePassed++;
    } else {
      console.log(`  ❌ ${check} - Not found`);
    }
    totalTests++;
  });
  
  const percentage = Math.round((filePassed / test.checks.length) * 100);
  console.log(`  📊 ${filePassed}/${test.checks.length} checks passed (${percentage}%)\n`);
  
  if (filePassed === test.checks.length) {
    passedTests++;
  }
});

// Summary
console.log('📊 Test Results Summary:');
console.log('========================');
console.log(`✅ Files with all checks passed: ${passedTests}/${tests.length}`);
console.log(`✅ Individual checks passed: ${passedTests}/${totalTests}`);

if (passedTests === tests.length) {
  console.log('\n🎉 All offline implementation files are properly configured!');
} else {
  console.log('\n⚠️ Some files need attention. Check the implementation.');
}

console.log('\n🚀 To test the actual functionality:');
console.log('1. Start the development server: npm run dev');
console.log('2. Open http://localhost:3000/test-offline');
console.log('3. Click "Run All Tests" button');
console.log('4. Or open browser console and run: testOfflineFunctionality()');
