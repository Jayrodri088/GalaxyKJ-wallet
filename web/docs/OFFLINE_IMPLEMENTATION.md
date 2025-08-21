# Implementación de Soporte Offline - Galaxy Smart Wallet

## 📋 Resumen

Esta implementación agrega soporte completo offline al Galaxy Smart Wallet, permitiendo que los usuarios continúen usando la aplicación incluso sin conexión a internet. La solución incluye cacheo de datos, cola de transacciones, sincronización automática y indicadores de estado.

## 🏗️ Arquitectura

### Componentes Principales

1. **Service Worker** (`/public/sw.js`)
   - Maneja cacheo de assets estáticos
   - Intercepta requests de API
   - Gestiona cola de transacciones offline
   - Proporciona fallbacks offline

2. **Offline Manager** (`/src/lib/offline/offline-manager.ts`)
   - Base de datos IndexedDB para almacenamiento local
   - Gestión de estado de conexión
   - Cola de sincronización
   - Cacheo con TTL

3. **Hooks Offline** (`/src/hooks/use-offline.ts`)
   - `useOffline()` - Hook principal para estado offline
   - `useOfflineTransactions()` - Hook especializado para transacciones
   - `useOfflineCache()` - Hook para cacheo de datos

4. **Componentes UI** (`/src/components/ui/offline-indicator.tsx`)
   - Indicadores de estado de conexión
   - Notificaciones toast
   - Banner de modo offline

## 🚀 Características Implementadas

### ✅ Service Worker
- [x] Cacheo de assets estáticos
- [x] Interceptación de requests de API
- [x] Estrategia Network First para APIs
- [x] Estrategia Cache First para assets
- [x] Cola de transacciones offline
- [x] Sincronización en background
- [x] Manejo de actualizaciones

### ✅ Base de Datos Offline
- [x] IndexedDB con TypeScript
- [x] Store para datos del wallet
- [x] Store para transacciones pendientes
- [x] Store para cache con TTL
- [x] Índices para consultas eficientes

### ✅ Gestión de Estado
- [x] Detección automática de conexión
- [x] Notificaciones de cambios de estado
- [x] Estadísticas de uso offline
- [x] Cola de sincronización

### ✅ UI/UX
- [x] Indicadores de estado de conexión
- [x] Banner de modo offline
- [x] Notificaciones toast
- [x] Página offline dedicada
- [x] Componentes reutilizables

### ✅ Transacciones Offline
- [x] Cola de transacciones pendientes
- [x] Sincronización automática al reconectar
- [x] Manejo de errores y reintentos
- [x] IDs únicos para tracking

## 📁 Estructura de Archivos

```
web/
├── public/
│   └── sw.js                          # Service Worker
├── src/
│   ├── app/
│   │   ├── offline/
│   │   │   └── page.tsx               # Página offline
│   │   └── layout.tsx                 # Layout con registro SW
│   ├── components/
│   │   ├── ui/
│   │   │   └── offline-indicator.tsx  # Indicadores offline
│   │   └── offline-transaction-handler.tsx
│   ├── hooks/
│   │   └── use-offline.ts             # Hooks offline
│   ├── lib/
│   │   ├── offline/
│   │   │   └── offline-manager.ts     # Gestor offline
│   │   └── register-sw.ts             # Registro SW
│   └── docs/
│       └── OFFLINE_IMPLEMENTATION.md  # Esta documentación
└── next.config.ts                     # Configuración Next.js
```

## 🔧 Configuración

### 1. Dependencias

El proyecto ya incluye las dependencias necesarias:
- `idb` - Para IndexedDB
- `@types/qrcode` - Para TypeScript

### 2. Next.js Config

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, must-revalidate',
          },
        ],
      },
    ];
  },
  // ... otras configuraciones
};
```

### 3. Registro del Service Worker

```typescript
// src/app/layout.tsx
import { registerServiceWorker } from "@/lib/register-sw";

export default function RootLayout({ children }) {
  if (typeof window !== 'undefined') {
    registerServiceWorker();
  }
  // ...
}
```

## 🎯 Uso

### Hook Principal

```typescript
import { useOffline } from '@/hooks/use-offline';

function MyComponent() {
  const { 
    isOnline, 
    isOffline, 
    stats, 
    queueTransaction, 
    syncData 
  } = useOffline();

  // Usar el estado offline
  return (
    <div>
      {isOffline && <p>Modo offline activo</p>}
      <p>Transacciones pendientes: {stats.pendingTransactions}</p>
    </div>
  );
}
```

### Hook de Transacciones

```typescript
import { useOfflineTransactions } from '@/hooks/use-offline';

function TransactionComponent() {
  const { 
    isOnline, 
    pendingTransactions, 
    sendTransactionOffline 
  } = useOfflineTransactions();

  const handleTransaction = async (data) => {
    const result = await sendTransactionOffline(data);
    if (result.queued) {
      console.log('Transacción en cola:', result.transactionId);
    }
  };
}
```

### Componentes UI

```typescript
import { OfflineIndicator, OfflineStatusToast } from '@/components/ui/offline-indicator';

// Indicador minimal
<OfflineIndicator variant="minimal" />

// Banner de modo offline
<OfflineIndicator variant="banner" />

// Indicador detallado
<OfflineIndicator variant="detailed" showStats={true} />

// Toast de notificaciones
<OfflineStatusToast />
```

## 🧪 Testing

### Testing Manual

1. **Probar modo offline:**
   - Abrir DevTools → Network
   - Marcar "Offline"
   - Verificar que aparezca el banner offline
   - Intentar realizar una transacción
   - Verificar que se agregue a la cola

2. **Probar sincronización:**
   - Realizar transacciones offline
   - Volver a marcar "Online"
   - Verificar que las transacciones se procesen

3. **Probar cacheo:**
   - Navegar por la aplicación
   - Ir offline
   - Verificar que las páginas se carguen desde cache

### Testing Automatizado

```typescript
// Ejemplo de test para el hook offline
import { renderHook, act } from '@testing-library/react';
import { useOffline } from '@/hooks/use-offline';

test('should detect offline state', () => {
  const { result } = renderHook(() => useOffline());
  
  act(() => {
    // Simular estado offline
    Object.defineProperty(navigator, 'onLine', {
      value: false,
      writable: true
    });
    window.dispatchEvent(new Event('offline'));
  });
  
  expect(result.current.isOffline).toBe(true);
});
```

## 🔒 Seguridad

### Consideraciones de Seguridad

1. **Datos Sensibles:**
   - Las claves privadas NO se almacenan en IndexedDB
   - Solo se cachean datos públicos y transacciones pendientes
   - Los datos se limpian automáticamente con TTL

2. **Validación:**
   - Todas las transacciones se validan antes de procesar
   - Se implementan límites de tamaño para la cola
   - Se previene almacenamiento excesivo

3. **Privacidad:**
   - Los datos se almacenan localmente en el dispositivo
   - No se envían datos sensibles al servidor
   - Se respeta la configuración de privacidad del usuario

## 📊 Métricas y Monitoreo

### Estadísticas Disponibles

```typescript
interface OfflineStats {
  pendingTransactions: number;  // Transacciones en cola
  cachedItems: number;         // Elementos cacheados
  lastSync: number | null;     // Última sincronización
}
```

### Logs del Service Worker

Los logs del service worker están disponibles en:
- DevTools → Application → Service Workers
- DevTools → Console (filtrado por "Service Worker")

## 🚀 Despliegue

### 1. Build de Producción

```bash
npm run build
```

### 2. Verificar Service Worker

```bash
# Verificar que el SW se incluya en el build
ls -la .next/static/
```

### 3. Testing de Producción

- Probar en diferentes navegadores
- Verificar funcionamiento en dispositivos móviles
- Comprobar límites de almacenamiento

## 🔄 Mantenimiento

### Actualizaciones del Service Worker

1. **Cambiar versión del cache:**
   ```javascript
   const CACHE_NAME = 'galaxy-wallet-v2'; // Incrementar versión
   ```

2. **Limpiar caches antiguos:**
   ```javascript
   // En el evento 'activate'
   cacheNames.forEach(cacheName => {
     if (cacheName !== CACHE_NAME) {
       caches.delete(cacheName);
     }
   });
   ```

### Monitoreo de Errores

```typescript
// Agregar error boundaries
window.addEventListener('error', (event) => {
  if (event.filename?.includes('sw.js')) {
    // Log error del service worker
    console.error('SW Error:', event.error);
  }
});
```

## 📚 Recursos Adicionales

- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [MDN - IndexedDB](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Next.js PWA](https://nextjs.org/docs/app/building-your-application/optimizing/progressive-web-apps)
- [Workbox](https://developers.google.com/web/tools/workbox)

## 🤝 Contribución

Para contribuir a la funcionalidad offline:

1. Crear una rama feature: `git checkout -b feature/offline-enhancement`
2. Implementar cambios
3. Agregar tests
4. Actualizar documentación
5. Crear Pull Request

## 📝 Changelog

### v1.0.0 - Implementación Inicial
- ✅ Service Worker básico
- ✅ Gestor offline con IndexedDB
- ✅ Hooks para estado offline
- ✅ Componentes UI para indicadores
- ✅ Página offline dedicada
- ✅ Integración con Next.js
- ✅ Documentación completa
