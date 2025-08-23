'use client';

import React, { useState } from 'react';
import { useOffline } from '../../hooks/use-offline';
// import { OfflineIndicator } from '../../components/ui/offline-indicator';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { 
  WifiOff, 
  RefreshCw, 
  Home, 
  Clock, 
  Database,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import Link from 'next/link';

export default function OfflinePage() {
  const { isOnline, stats, syncData, refreshStats } = useOffline();
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

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo y título */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 bg-white/10 rounded-full flex items-center justify-center">
            <WifiOff className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Sin Conexión
          </h1>
          <p className="text-gray-300">
            No se puede acceder a Galaxy Smart Wallet
          </p>
        </div>

        {/* Estado de conexión */}
        <Card className="p-6 mb-6 bg-white/10 backdrop-blur-sm border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">
              Estado de Conexión
            </h2>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
              isOnline 
                ? 'bg-green-500/20 text-green-300 border border-green-500/30' 
                : 'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {isOnline ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <AlertTriangle className="w-4 h-4" />
              )}
              {isOnline ? 'Online' : 'Offline'}
            </div>
          </div>

          {/* Estadísticas offline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-300" />
                <span className="text-gray-300">Transacciones Pendientes</span>
              </div>
              <span className="text-white font-semibold">
                {stats.pendingTransactions}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-purple-300" />
                <span className="text-gray-300">Elementos Cacheados</span>
              </div>
              <span className="text-white font-semibold">
                {stats.cachedItems}
              </span>
            </div>
          </div>
        </Card>

        {/* Acciones */}
        <div className="space-y-3">
          <Button
            onClick={handleSync}
            disabled={syncing || !isOnline}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            size="lg"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Sincronizar Datos'}
          </Button>

          <Button
            onClick={handleRetry}
            variant="outline"
            className="w-full border-white/20 text-white hover:bg-white/10"
            size="lg"
          >
            Reintentar Conexión
          </Button>

          <Link href="/" className="block">
            <Button
              variant="ghost"
              className="w-full text-gray-300 hover:text-white hover:bg-white/5"
              size="lg"
            >
              <Home className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </Link>
        </div>

        {/* Información adicional */}
        <div className="mt-8 text-center">
          <p className="text-sm text-gray-400 mb-2">
            ¿Problemas de conexión?
          </p>
          <div className="text-xs text-gray-500 space-y-1">
            <p>• Verifica tu conexión a Internet</p>
            <p>• Intenta recargar la página</p>
            <p>• Contacta soporte si el problema persiste</p>
          </div>
        </div>
      </div>
    </div>
  );
}
