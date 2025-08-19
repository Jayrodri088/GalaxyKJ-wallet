import { useEffect, useCallback } from 'react';
import { useWalletStore } from '@/store/wallet-store';

export interface UseWalletSyncOptions {
  autoSync?: boolean;
  syncInterval?: number; // in milliseconds
  onSyncSuccess?: () => void;
  onSyncError?: (error: string) => void;
}

export function useWalletSync(options: UseWalletSyncOptions = {}) {
  const {
    autoSync = true,
    syncInterval = 30000, // 30 seconds default
    onSyncSuccess,
    onSyncError,
  } = options;

  const {
    publicKey,
    connectionStatus,
    isInitialized,
    syncWallet,
    initialize,
  } = useWalletStore();

  // Manual sync function
  const manualSync = useCallback(async () => {
    if (!publicKey || connectionStatus.isLoading) {
      return;
    }

    try {
      await syncWallet();
      onSyncSuccess?.();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sync failed';
      onSyncError?.(errorMessage);
    }
  }, [publicKey, connectionStatus.isLoading, syncWallet, onSyncSuccess, onSyncError]);

  // Initialize wallet store on mount
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Auto-sync effect
  useEffect(() => {
    if (!autoSync || !publicKey || !isInitialized) {
      return;
    }

    // Initial sync
    manualSync();

    // Set up interval for periodic sync
    const interval = setInterval(() => {
      if (!connectionStatus.isLoading) {
        manualSync();
      }
    }, syncInterval);

    return () => clearInterval(interval);
  }, [autoSync, publicKey, isInitialized, syncInterval, manualSync, connectionStatus.isLoading]);

  // Sync when network reconnects
  useEffect(() => {
    const handleOnline = () => {
      if (publicKey && !connectionStatus.isLoading) {
        manualSync();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [publicKey, connectionStatus.isLoading, manualSync]);

  return {
    sync: manualSync,
    isLoading: connectionStatus.isLoading,
    isConnected: connectionStatus.isConnected,
    lastSyncTime: connectionStatus.lastSyncTime,
    error: connectionStatus.error,
  };
}