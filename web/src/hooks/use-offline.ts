import { useState, useEffect, useCallback } from 'react';
import { offlineManager } from '../lib/offline/offline-manager';

export interface OfflineStats {
  pendingTransactions: number;
  cachedItems: number;
  lastSync: number | null;
}

export interface UseOfflineReturn {
  isOnline: boolean;
  isOffline: boolean;
  stats: OfflineStats;
  queueTransaction: (transactionData: any) => Promise<string>;
  getPendingTransactions: () => Promise<any[]>;
  cacheData: (key: string, data: any, ttl?: number) => Promise<void>;
  getCachedData: (key: string) => Promise<any | null>;
  syncData: () => Promise<void>;
  clearCache: () => Promise<void>;
  refreshStats: () => Promise<void>;
}

export function useOffline(): UseOfflineReturn {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [stats, setStats] = useState<OfflineStats>({
    pendingTransactions: 0,
    cachedItems: 0,
    lastSync: null
  });

  // Actualizar estado de conexión
  useEffect(() => {
    const unsubscribe = offlineManager.onConnectionChange((online: boolean) => {
      setIsOnline(online);
    });

    return unsubscribe;
  }, []);

  // Cargar estadísticas iniciales
  useEffect(() => {
    refreshStats();
  }, []);

  // Actualizar estadísticas cuando cambia el estado online
  useEffect(() => {
    if (isOnline) {
      refreshStats();
    }
  }, [isOnline]);

  // Refrescar estadísticas
  const refreshStats = useCallback(async () => {
    try {
      const offlineStats = await offlineManager.getOfflineStats();
      setStats(offlineStats);
    } catch (error) {
      console.error('useOffline: Failed to refresh stats', error);
    }
  }, []);

  // Agregar transacción a la cola
  const queueTransaction = useCallback(async (transactionData: any): Promise<string> => {
    try {
      const transactionId = await offlineManager.queueTransaction(transactionData);
      await refreshStats(); // Actualizar estadísticas después de agregar
      return transactionId;
    } catch (error) {
      console.error('useOffline: Failed to queue transaction', error);
      throw error;
    }
  }, [refreshStats]);

  // Obtener transacciones pendientes
  const getPendingTransactions = useCallback(async (): Promise<any[]> => {
    try {
      return await offlineManager.getPendingTransactions();
    } catch (error) {
      console.error('useOffline: Failed to get pending transactions', error);
      return [];
    }
  }, []);

  // Cachear datos
  const cacheData = useCallback(async (key: string, data: any, ttl?: number): Promise<void> => {
    try {
      await offlineManager.cacheData(key, data, ttl);
      await refreshStats(); // Actualizar estadísticas después de cachear
    } catch (error) {
      console.error('useOffline: Failed to cache data', error);
      throw error;
    }
  }, [refreshStats]);

  // Obtener datos cacheados
  const getCachedData = useCallback(async (key: string): Promise<any | null> => {
    try {
      return await offlineManager.getCachedData(key);
    } catch (error) {
      console.error('useOffline: Failed to get cached data', error);
      return null;
    }
  }, []);

  // Sincronizar datos
  const syncData = useCallback(async (): Promise<void> => {
    try {
      await offlineManager.syncWithServiceWorker();
      await refreshStats(); // Actualizar estadísticas después de sincronizar
    } catch (error) {
      console.error('useOffline: Failed to sync data', error);
      throw error;
    }
  }, [refreshStats]);

  // Limpiar cache
  const clearCache = useCallback(async (): Promise<void> => {
    try {
      await offlineManager.cleanExpiredCache();
      await refreshStats(); // Actualizar estadísticas después de limpiar
    } catch (error) {
      console.error('useOffline: Failed to clear cache', error);
      throw error;
    }
  }, [refreshStats]);

  return {
    isOnline,
    isOffline: !isOnline,
    stats,
    queueTransaction,
    getPendingTransactions,
    cacheData,
    getCachedData,
    syncData,
    clearCache,
    refreshStats
  };
}

// Hook especializado para transacciones offline
export function useOfflineTransactions() {
  const { isOnline, queueTransaction, getPendingTransactions, stats } = useOffline();

  const sendTransactionOffline = useCallback(async (transactionData: any) => {
    if (isOnline) {
      // Si estamos online, intentar enviar directamente
      try {
        // Aquí podrías hacer la llamada a la API real
        const response = await fetch('/api/transactions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(transactionData)
        });

        if (!response.ok) {
          throw new Error('Transaction failed');
        }

        return { success: true, data: await response.json() };
      } catch (error) {
        console.log('Online transaction failed, falling back to offline queue');
        // Si falla, agregar a la cola offline
        const transactionId = await queueTransaction(transactionData);
        return { success: false, queued: true, transactionId };
      }
    } else {
      // Si estamos offline, agregar directamente a la cola
      const transactionId = await queueTransaction(transactionData);
      return { success: false, queued: true, transactionId };
    }
  }, [isOnline, queueTransaction]);

  return {
    isOnline,
    pendingTransactions: stats.pendingTransactions,
    sendTransactionOffline,
    getPendingTransactions
  };
}

// Hook especializado para cacheo de datos
export function useOfflineCache<T = any>(key: string, ttl?: number) {
  const { cacheData, getCachedData, isOnline } = useOffline();
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);

  const loadCachedData = useCallback(async () => {
    setLoading(true);
    try {
      const cachedData = await getCachedData(key);
      setData(cachedData);
    } catch (error) {
      console.error('useOfflineCache: Failed to load cached data', error);
    } finally {
      setLoading(false);
    }
  }, [key, getCachedData]);

  const saveData = useCallback(async (newData: T) => {
    try {
      await cacheData(key, newData, ttl);
      setData(newData);
    } catch (error) {
      console.error('useOfflineCache: Failed to save data', error);
      throw error;
    }
  }, [key, ttl, cacheData]);

  // Cargar datos cacheados al montar el componente
  useEffect(() => {
    loadCachedData();
  }, [loadCachedData]);

  return {
    data,
    loading,
    saveData,
    loadCachedData,
    isOnline
  };
}
