'use client';

import React, { useState } from 'react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { runAllOfflineTests } from '../tests/offline-test';
import { useOffline } from '../hooks/use-offline';

export function OfflineTestPanel() {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const { isOnline, stats } = useOffline();

  const runTests = async () => {
    setIsRunning(true);
    setTestResults([]);
    
    try {
      // Capture console logs
      const originalLog = console.log;
      const logs: string[] = [];
      
      console.log = (...args) => {
        logs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      await runAllOfflineTests();
      
      // Parse results from logs
      const results = logs
        .filter(log => log.includes('✅') || log.includes('❌') || log.includes('⚠️'))
        .map(log => ({
          message: log,
          type: log.includes('✅') ? 'success' : log.includes('❌') ? 'error' : 'warning'
        }));
      
      setTestResults(results);
    } catch (error) {
      console.error('Test execution failed:', error);
    } finally {
      setIsRunning(false);
    }
  };

  const simulateOffline = () => {
    // This is a manual test - user needs to use DevTools
    alert('To test offline mode:\n1. Open DevTools (F12)\n2. Go to Network tab\n3. Check &quot;Offline&quot; checkbox\n4. Refresh the page');
  };

  return (
    <Card className="p-6 max-w-2xl mx-auto">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">🧪 Offline Functionality Tests</h2>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <h3 className="font-medium">Connection Status</h3>
            <div className="text-sm space-y-1">
              <div>Status: {isOnline ? '🟢 Online' : '🔴 Offline'}</div>
              <div>Pending Transactions: {stats.pendingTransactions}</div>
              <div>Cached Items: {stats.cachedItems}</div>
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="font-medium">Test Actions</h3>
            <div className="space-y-2">
              <Button 
                onClick={runTests} 
                disabled={isRunning}
                className="w-full"
              >
                {isRunning ? 'Running Tests...' : 'Run All Tests'}
              </Button>
              
              <Button 
                onClick={simulateOffline} 
                variant="outline"
                className="w-full"
              >
                Simulate Offline Mode
              </Button>
            </div>
          </div>
        </div>

        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-medium">Test Results</h3>
            <div className="space-y-1 max-h-60 overflow-y-auto">
              {testResults.map((result, index) => (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded ${
                    result.type === 'success' 
                      ? 'bg-green-50 text-green-800' 
                      : result.type === 'error'
                      ? 'bg-red-50 text-red-800'
                      : 'bg-yellow-50 text-yellow-800'
                  }`}
                >
                  {result.message}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p><strong>Manual Test Instructions:</strong></p>
          <ol className="list-decimal list-inside space-y-1">
            <li>Open DevTools (F12)</li>
            <li>Go to Network tab</li>
            <li>Check &quot;Offline&quot; checkbox</li>
            <li>Refresh the page</li>
            <li>Look for offline banner and indicators</li>
            <li>Uncheck &quot;Offline&quot; to test reconnection</li>
          </ol>
        </div>
      </div>
    </Card>
  );
}
