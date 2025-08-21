'use client';

import React, { useState } from 'react';
import { useOffline } from '../../hooks/use-offline';
import { Button } from './button';
import { Badge } from './badge';
import { Card } from './card';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';

interface OfflineIndicatorProps {
  showStats?: boolean;
  showSyncButton?: boolean;
  className?: string;
  variant?: 'minimal' | 'detailed' | 'banner';
}

export function OfflineIndicator({ 
  showStats = true, 
  showSyncButton = true, 
  className = '',
  variant = 'minimal'
}: OfflineIndicatorProps) {
  const { isOnline, isOffline, stats, syncData, refreshStats } = useOffline();
  const [syncing, setSyncing] = useState(false);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await syncData();
      await refreshStats();
    } catch (error) {
      console.error('Failed to sync:', error);
    } finally {
      setSyncing(false);
    }
  };

  // Minimal variant - icon and status only
  if (variant === 'minimal') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isOnline ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className={`text-sm font-medium ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    );
  }

  // Banner variant - to show at the top
  if (variant === 'banner') {
    if (isOnline) return null; // Don't show banner if online

    return (
      <div className={`bg-yellow-50 border-l-4 border-yellow-400 p-4 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-400" />
            <div>
              <p className="text-sm font-medium text-yellow-800">
                Offline Mode
              </p>
              <p className="text-sm text-yellow-700">
                {stats.pendingTransactions > 0 
                  ? `${stats.pendingTransactions} pending transactions`
                  : 'Working without connection'
                }
              </p>
            </div>
          </div>
          {showSyncButton && (
            <Button
              size="sm"
              variant="outline"
              onClick={handleSync}
              disabled={syncing}
              className="text-yellow-700 border-yellow-400 hover:bg-yellow-100"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Detailed variant - complete information
  return (
    <Card className={`p-4 ${className}`}>
      <div className="space-y-4">
        {/* Connection Status */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {isOnline ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <div>
              <h3 className="font-medium">
                Connection Status
              </h3>
              <p className={`text-sm ${isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {isOnline ? 'Connected to Internet' : 'No Internet connection'}
              </p>
            </div>
          </div>
          <Badge variant={isOnline ? 'default' : 'destructive'}>
            {isOnline ? 'Online' : 'Offline'}
          </Badge>
        </div>

        {/* Offline Statistics */}
        {showStats && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-700">Offline Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-500" />
                <div>
                  <p className="text-xs text-gray-500">Pending Transactions</p>
                  <p className="text-sm font-medium">{stats.pendingTransactions}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Database className="h-4 w-4 text-purple-500" />
                <div>
                  <p className="text-xs text-gray-500">Cached Items</p>
                  <p className="text-sm font-medium">{stats.cachedItems}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        {showSyncButton && (
          <div className="flex gap-2">
            <Button
              onClick={handleSync}
              disabled={syncing || isOffline}
              className="flex-1"
              size="sm"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Syncing...' : 'Sync'}
            </Button>
            <Button
              onClick={refreshStats}
              variant="outline"
              size="sm"
            >
              Refresh
            </Button>
          </div>
        )}

        {/* Informational Message */}
        {isOffline && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-800">
              <strong>Offline Mode:</strong> Transactions will be saved locally 
              and synchronized when you reconnect.
            </p>
          </div>
        )}
      </div>
    </Card>
  );
}

// Toast notification component for status changes
export function OfflineStatusToast() {
  const { isOnline, isOffline } = useOffline();
  const [showToast, setShowToast] = useState(false);
  const [lastStatus, setLastStatus] = useState(isOnline);

  React.useEffect(() => {
    if (lastStatus !== isOnline) {
      setShowToast(true);
      setLastStatus(isOnline);
      
      // Hide toast after 3 seconds
      const timer = setTimeout(() => setShowToast(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, lastStatus]);

  if (!showToast) return null;

  return (
    <div className="fixed top-4 right-4 z-50">
      <div className={`flex items-center gap-3 p-4 rounded-lg shadow-lg ${
        isOnline 
          ? 'bg-green-50 border border-green-200 text-green-800' 
          : 'bg-red-50 border border-red-200 text-red-800'
      }`}>
        {isOnline ? (
          <CheckCircle className="h-5 w-5 text-green-500" />
        ) : (
          <XCircle className="h-5 w-5 text-red-500" />
        )}
        <div>
          <p className="font-medium">
            {isOnline ? 'Connection Restored' : 'Connection Lost'}
          </p>
          <p className="text-sm">
            {isOnline 
              ? 'You can now perform online transactions' 
              : 'Working in offline mode'
            }
          </p>
        </div>
        <button
          onClick={() => setShowToast(false)}
          className="ml-2 text-gray-400 hover:text-gray-600"
        >
          <XCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// Pending transactions indicator component
export function PendingTransactionsIndicator() {
  const { stats, isOnline } = useOffline();

  if (stats.pendingTransactions === 0) return null;

  return (
    <div className="flex items-center gap-2">
      <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
        <Clock className="h-3 w-3 mr-1" />
        {stats.pendingTransactions}
      </Badge>
      <span className="text-sm text-gray-600">
        {isOnline ? 'Syncing...' : 'Pending'}
      </span>
    </div>
  );
}
