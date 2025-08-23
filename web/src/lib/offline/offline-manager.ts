import { openDB, DBSchema, IDBPDatabase } from 'idb';

// Types for offline database
interface OfflineDB extends DBSchema {
  walletData: {
    key: string;
    value: any;
  };
  transactions: {
    key: string;
    value: {
      id: string;
      data: any;
      timestamp: number;
      status: 'pending' | 'processing' | 'completed' | 'failed';
    };
  };
  cache: {
    key: string;
    value: {
      data: any;
      timestamp: number;
      ttl: number;
    };
  };
}

// Database configuration
const DB_NAME = 'GalaxyWalletOffline';
const DB_VERSION = 1;

export class OfflineManager {
  private db: IDBPDatabase<OfflineDB> | null = null;
  private isOnline: boolean = navigator.onLine;
  private syncQueue: Array<() => Promise<void>> = [];
  private listeners: Array<(online: boolean) => void> = [];

  constructor() {
    this.init();
    this.setupEventListeners();
  }

  // Initialize the database
  private async init() {
    try {
      this.db = await openDB<OfflineDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          // Store for wallet data
          if (!db.objectStoreNames.contains('walletData')) {
            db.createObjectStore('walletData');
          }
          
          // Store for pending transactions
          if (!db.objectStoreNames.contains('transactions')) {
            db.createObjectStore('transactions', { keyPath: 'id' });
          }
          
          // Store for cache
          if (!db.objectStoreNames.contains('cache')) {
            db.createObjectStore('cache');
          }
        },
      });
      console.log('OfflineManager: Database initialized successfully');
    } catch (error) {
      console.error('OfflineManager: Failed to initialize database', error);
    }
  }

  // Configurar event listeners
  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.notifyListeners(true);
      this.processSyncQueue();
    });

    window.addEventListener('offline', () => {
      this.isOnline = false;
      this.notifyListeners(false);
    });

    // Registrar service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('OfflineManager: Service Worker registered', registration);
        })
        .catch((error) => {
          console.error('OfflineManager: Service Worker registration failed', error);
        });
    }
  }

  // Verificar estado de conexión
  public getConnectionStatus(): boolean {
    return this.isOnline;
  }

  // Suscribirse a cambios de conexión
  public onConnectionChange(callback: (online: boolean) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  // Notificar a los listeners
  private notifyListeners(online: boolean) {
    this.listeners.forEach(listener => listener(online));
  }

  // Guardar datos del wallet offline
  public async saveWalletData(key: string, data: any): Promise<void> {
    if (!this.db) return;

    try {
      await this.db.put('walletData', data, key);
      console.log('OfflineManager: Wallet data saved', key);
    } catch (error) {
      console.error('OfflineManager: Failed to save wallet data', error);
    }
  }

  // Obtener datos del wallet offline
  public async getWalletData(key: string): Promise<any | null> {
    if (!this.db) return null;

    try {
      return await this.db.get('walletData', key);
    } catch (error) {
      console.error('OfflineManager: Failed to get wallet data', error);
      return null;
    }
  }

  // Agregar transacción a la cola offline
  public async queueTransaction(transactionData: any): Promise<string> {
    if (!this.db) throw new Error('Database not initialized');

    const id = this.generateTransactionId();
    const transaction = {
      id,
      data: transactionData,
      timestamp: Date.now(),
      status: 'pending' as const
    };

    try {
      await this.db.add('transactions', transaction);
      console.log('OfflineManager: Transaction queued', id);
      
      // Intentar procesar inmediatamente si estamos online
      if (this.isOnline) {
        this.processSyncQueue();
      }
      
      return id;
    } catch (error) {
      console.error('OfflineManager: Failed to queue transaction', error);
      throw error;
    }
  }

  // Obtener transacciones pendientes
  public async getPendingTransactions(): Promise<any[]> {
    if (!this.db) return [];

    try {
      const transactions = await this.db.getAll('transactions');
      return transactions.filter(t => t.status === 'pending');
    } catch (error) {
      console.error('OfflineManager: Failed to get pending transactions', error);
      return [];
    }
  }

  // Actualizar estado de transacción
  public async updateTransactionStatus(id: string, status: 'pending' | 'processing' | 'completed' | 'failed'): Promise<void> {
    if (!this.db) return;

    try {
      const transaction = await this.db.get('transactions', id);
      if (transaction) {
        transaction.status = status;
        await this.db.put('transactions', transaction);
      }
    } catch (error) {
      console.error('OfflineManager: Failed to update transaction status', error);
    }
  }

  // Cachear datos con TTL
  public async cacheData(key: string, data: any, ttl: number = 3600000): Promise<void> {
    if (!this.db) return;

    try {
      const cacheEntry = {
        data,
        timestamp: Date.now(),
        ttl
      };
      await this.db.put('cache', cacheEntry, key);
    } catch (error) {
      console.error('OfflineManager: Failed to cache data', error);
    }
  }

  // Obtener datos cacheados
  public async getCachedData(key: string): Promise<any | null> {
    if (!this.db) return null;

    try {
      const cacheEntry = await this.db.get('cache', key);
      if (!cacheEntry) return null;

      const isExpired = Date.now() - cacheEntry.timestamp > cacheEntry.ttl;
      if (isExpired) {
        await this.db.delete('cache', key);
        return null;
      }

      return cacheEntry.data;
    } catch (error) {
      console.error('OfflineManager: Failed to get cached data', error);
      return null;
    }
  }

  // Limpiar cache expirado
  public async cleanExpiredCache(): Promise<void> {
    if (!this.db) return;

    try {
      const cacheEntries = await this.db.getAll('cache');
      const now = Date.now();

      for (const [key, cacheEntry] of Object.entries(cacheEntries)) {
        if (now - cacheEntry.timestamp > cacheEntry.ttl) {
          await this.db.delete('cache', key);
        }
      }
    } catch (error) {
      console.error('OfflineManager: Failed to clean expired cache', error);
    }
  }

  // Agregar función a la cola de sincronización
  public addToSyncQueue(syncFunction: () => Promise<void>): void {
    this.syncQueue.push(syncFunction);
    
    if (this.isOnline) {
      this.processSyncQueue();
    }
  }

  // Procesar cola de sincronización
  private async processSyncQueue(): Promise<void> {
    if (!this.isOnline || this.syncQueue.length === 0) return;

    console.log('OfflineManager: Processing sync queue', this.syncQueue.length);

    while (this.syncQueue.length > 0) {
      const syncFunction = this.syncQueue.shift();
      if (syncFunction) {
        try {
          await syncFunction();
        } catch (error) {
          console.error('OfflineManager: Sync function failed', error);
          // Re-agregar a la cola si falla
          this.syncQueue.unshift(syncFunction);
          break;
        }
      }
    }
  }

  // Generar ID único para transacciones
  private generateTransactionId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  // Sincronizar con el service worker
  public async syncWithServiceWorker(): Promise<void> {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      try {
        await navigator.serviceWorker.ready;
        const registration = await navigator.serviceWorker.getRegistration();
        
        if (registration && 'sync' in registration) {
          await (registration as any).sync.register('background-sync');
          console.log('OfflineManager: Background sync registered');
        }
      } catch (error) {
        console.error('OfflineManager: Failed to register background sync', error);
      }
    }
  }

  // Obtener estadísticas de uso offline
  public async getOfflineStats(): Promise<{
    pendingTransactions: number;
    cachedItems: number;
    lastSync: number | null;
  }> {
    if (!this.db) {
      return { pendingTransactions: 0, cachedItems: 0, lastSync: null };
    }

    try {
      const pendingTransactions = await this.getPendingTransactions();
      const transaction = this.db.transaction('cache', 'readonly');
      const cacheStore = transaction.objectStore('cache');
      const cachedItems = await cacheStore.count();

      return {
        pendingTransactions: pendingTransactions.length,
        cachedItems,
        lastSync: null // TODO: Implementar tracking de última sincronización
      };
    } catch (error) {
      console.error('OfflineManager: Failed to get offline stats', error);
      return { pendingTransactions: 0, cachedItems: 0, lastSync: null };
    }
  }
}

// Instancia singleton
export const offlineManager = new OfflineManager();
