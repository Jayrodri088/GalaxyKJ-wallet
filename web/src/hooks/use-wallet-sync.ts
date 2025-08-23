import { useEffect, useCallback, useRef, useState } from 'react';
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

  // Local state to track sync operations
  const [isSyncing, setIsSyncing] = useState(false);
  
  // Use refs to store the latest callbacks
  const onSyncSuccessRef = useRef(onSyncSuccess);
  const onSyncErrorRef = useRef(onSyncError);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastSyncRef = useRef<number>(0);
  const syncInProgressRef = useRef(false);
  
  // Update refs when callbacks change
  useEffect(() => {
    onSyncSuccessRef.current = onSyncSuccess;
    onSyncErrorRef.current = onSyncError;
  }, [onSyncSuccess, onSyncError]);

  // Manual sync function - stable reference with protection against simultaneous calls
  const manualSync = useCallback(async () => {
    if (syncInProgressRef.current) {
      return;
    }

    const now = Date.now();
    if (now - lastSyncRef.current < 2000) {
      return;
    }

    syncInProgressRef.current = true;
    lastSyncRef.current = now;

    try {
      await syncWallet();
    } catch (error) {
      console.error('Wallet sync failed:', error);
    } finally {
      syncInProgressRef.current = false;
    }
  }, [syncWallet]);

  // Initialize wallet store on mount - only once
  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initialize]);

  // Auto-sync effect - runs every 30 seconds
  useEffect(() => {
    if (!publicKey || !isInitialized) return;

    const interval = setInterval(() => {
      manualSync();
    }, 30000);

    return () => clearInterval(interval);
  }, [publicKey, isInitialized, manualSync]);

  // Initial sync on mount
  useEffect(() => {
    if (publicKey && isInitialized) {
      manualSync();
    }
  }, [publicKey, isInitialized, manualSync]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    isSyncing: syncInProgressRef.current,
    connectionStatus,
    sync: manualSync,
    onSyncSuccess,
    onSyncError
  };
}