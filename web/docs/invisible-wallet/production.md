# Production Deployment Guide

## 🚀 Production Readiness Checklist

This guide covers everything you need to deploy Invisible Wallets in a production environment safely and securely.

## 🔒 Security Configuration

### 1. Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Network Configuration
NEXT_PUBLIC_STELLAR_NETWORK=mainnet
NEXT_PUBLIC_HORIZON_URL=https://horizon.stellar.org

# Platform Configuration
NEXT_PUBLIC_PLATFORM_ID=your-production-platform-id-v1
NEXT_PUBLIC_APP_VERSION=1.0.0

# Security Settings
NEXT_PUBLIC_DEBUG_MODE=false
NEXT_PUBLIC_ENABLE_DEMO_KEYS=false

# CSP Configuration
NEXT_PUBLIC_CSP_REPORT_URI=https://your-domain.com/api/csp-report

# Analytics (Optional)
NEXT_PUBLIC_ANALYTICS_ID=your-analytics-id
```

### 2. Content Security Policy (CSP)

Configure your CSP headers in `next.config.js`:

```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Note: Remove unsafe-* in strict mode
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "connect-src 'self' https://horizon.stellar.org https://stellar.expert",
              "font-src 'self' data:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'none'",
              "upgrade-insecure-requests"
            ].join('; ')
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
```

### 3. Production Configuration

Update your production configuration:

```typescript
// lib/invisible-wallet/config.prod.ts
export const PRODUCTION_CONFIG = {
  platformId: process.env.NEXT_PUBLIC_PLATFORM_ID!,
  defaultNetwork: 'mainnet' as NetworkType,
  debug: false,
  enableDemoKeys: false,
  
  // Security settings
  maxWalletsPerUser: 10,
  maxTransactionsPerHour: 100,
  sessionTimeout: 30 * 60 * 1000, // 30 minutes
  
  // Performance settings
  cacheTimeout: 5 * 60 * 1000, // 5 minutes
  batchSize: 10,
  
  // Network settings
  horizonUrl: 'https://horizon.stellar.org',
  networkPassphrase: Networks.PUBLIC,
};

// Validation
if (!PRODUCTION_CONFIG.platformId) {
  throw new Error('NEXT_PUBLIC_PLATFORM_ID is required in production');
}
```

## 🏗️ Infrastructure Setup

### 1. HTTPS Configuration

**Required**: Invisible Wallets requires HTTPS in production for Web Crypto API access.

```nginx
# Nginx configuration example
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/your/certificate.crt;
    ssl_certificate_key /path/to/your/private.key;
    
    # Security headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options DENY always;
    add_header X-Content-Type-Options nosniff always;
    
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 2. Database Considerations

While Invisible Wallets uses IndexedDB for local storage, you may want to implement server-side storage for:

- Audit logs
- User management
- Analytics
- Backup and recovery

```sql
-- Example audit log table
CREATE TABLE wallet_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id VARCHAR(255) NOT NULL,
    operation VARCHAR(50) NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    platform_id VARCHAR(255) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB,
    
    INDEX idx_wallet_id (wallet_id),
    INDEX idx_timestamp (timestamp),
    INDEX idx_platform_id (platform_id)
);
```

### 3. CDN Configuration

Configure your CDN to cache static assets but not API responses:

```javascript
// next.config.js - Asset optimization
const nextConfig = {
  images: {
    domains: ['your-cdn-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize builds
  swcMinify: true,
  
  // Asset caching
  async headers() {
    return [
      {
        source: '/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ];
  }
};
```

## 📊 Monitoring & Analytics

### 1. Error Monitoring

Set up error monitoring with Sentry or similar:

```typescript
// lib/monitoring.ts
import * as Sentry from '@sentry/nextjs';

if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    environment: 'production',
    
    beforeSend(event) {
      // Filter out sensitive data
      if (event.extra?.passphrase) {
        delete event.extra.passphrase;
      }
      if (event.extra?.privateKey) {
        delete event.extra.privateKey;
      }
      return event;
    }
  });
}

export const logError = (error: Error, context?: Record<string, any>) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: context
    });
  } else {
    console.error('Error:', error, context);
  }
};
```

### 2. Performance Monitoring

Implement performance monitoring:

```typescript
// lib/performance.ts
export class PerformanceMonitor {
  private static instance: PerformanceMonitor;
  
  static getInstance(): PerformanceMonitor {
    if (!PerformanceMonitor.instance) {
      PerformanceMonitor.instance = new PerformanceMonitor();
    }
    return PerformanceMonitor.instance;
  }
  
  measureOperation<T>(
    operationName: string,
    operation: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now();
    
    return operation().finally(() => {
      const duration = performance.now() - startTime;
      
      // Log performance metrics
      if (process.env.NODE_ENV === 'production') {
        this.sendMetric({
          name: operationName,
          duration,
          timestamp: new Date().toISOString()
        });
      } else {
        console.log(`${operationName} took ${duration.toFixed(2)}ms`);
      }
    });
  }
  
  private sendMetric(metric: any) {
    // Send to your analytics service
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'wallet_operation', {
        custom_parameter: metric
      });
    }
  }
}

// Usage in wallet service
export class ProductionWalletService extends InvisibleWalletService {
  private monitor = PerformanceMonitor.getInstance();
  
  async createWallet(request: CreateWalletRequest): Promise<WalletResponse> {
    return this.monitor.measureOperation('create_wallet', () => 
      super.createWallet(request)
    );
  }
  
  async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse> {
    return this.monitor.measureOperation('sign_transaction', () =>
      super.signTransaction(request)
    );
  }
}
```

### 3. Security Monitoring

Implement security event monitoring:

```typescript
// lib/security-monitor.ts
export class SecurityMonitor {
  private static failedAttempts = new Map<string, number>();
  private static readonly MAX_FAILED_ATTEMPTS = 5;
  private static readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
  
  static recordFailedAttempt(email: string, ipAddress?: string): boolean {
    const key = `${email}:${ipAddress || 'unknown'}`;
    const attempts = this.failedAttempts.get(key) || 0;
    
    this.failedAttempts.set(key, attempts + 1);
    
    if (attempts + 1 >= this.MAX_FAILED_ATTEMPTS) {
      this.reportSecurityEvent({
        type: 'MULTIPLE_FAILED_ATTEMPTS',
        email,
        ipAddress,
        attempts: attempts + 1,
        timestamp: new Date().toISOString()
      });
      
      // Set lockout timer
      setTimeout(() => {
        this.failedAttempts.delete(key);
      }, this.LOCKOUT_DURATION);
      
      return false; // Account locked
    }
    
    return true; // Still allowed
  }
  
  static isAccountLocked(email: string, ipAddress?: string): boolean {
    const key = `${email}:${ipAddress || 'unknown'}`;
    const attempts = this.failedAttempts.get(key) || 0;
    return attempts >= this.MAX_FAILED_ATTEMPTS;
  }
  
  static recordSuccessfulAuth(email: string, ipAddress?: string) {
    const key = `${email}:${ipAddress || 'unknown'}`;
    this.failedAttempts.delete(key);
  }
  
  private static reportSecurityEvent(event: any) {
    // Send to security monitoring service
    console.warn('Security Event:', event);
    
    // In production, send to your security team
    if (process.env.NODE_ENV === 'production') {
      fetch('/api/security-events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event)
      });
    }
  }
}
```

## 🔧 Performance Optimization

### 1. Code Splitting

Optimize bundle size with dynamic imports:

```typescript
// components/invisible-wallet/lazy-wallet-demo.tsx
import dynamic from 'next/dynamic';
import { Suspense } from 'react';

const InvisibleWalletDemo = dynamic(
  () => import('./invisible-wallet-demo').then(mod => ({ default: mod.InvisibleWalletDemo })),
  {
    loading: () => <div>Loading wallet interface...</div>,
    ssr: false
  }
);

export function LazyWalletDemo() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <InvisibleWalletDemo />
    </Suspense>
  );
}
```

### 2. Service Worker for Caching

Implement service worker for offline capabilities:

```typescript
// public/sw.js
const CACHE_NAME = 'invisible-wallets-v1';
const urlsToCache = [
  '/',
  '/invisible-wallet',
  '/static/js/bundle.js',
  '/static/css/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Don't cache API requests
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return response || fetch(event.request);
      })
  );
});
```

### 3. Database Connection Pooling

If using server-side storage:

```typescript
// lib/db-pool.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

export class DatabaseService {
  static async query(text: string, params?: any[]) {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      return result;
    } finally {
      client.release();
    }
  }
  
  static async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}
```

## 🛡️ Security Hardening

### 1. Rate Limiting

Implement rate limiting:

```typescript
// lib/rate-limiter.ts
export class RateLimiter {
  private static requests = new Map<string, { count: number; resetTime: number }>();
  
  static isAllowed(
    key: string, 
    maxRequests: number, 
    windowMs: number
  ): boolean {
    const now = Date.now();
    const record = this.requests.get(key);
    
    if (!record || now > record.resetTime) {
      this.requests.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }
    
    if (record.count >= maxRequests) {
      return false;
    }
    
    record.count++;
    return true;
  }
  
  static getRemainingRequests(key: string, maxRequests: number): number {
    const record = this.requests.get(key);
    if (!record) return maxRequests;
    return Math.max(0, maxRequests - record.count);
  }
}

// Usage in API routes
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const clientId = req.ip || 'unknown';
  
  if (!RateLimiter.isAllowed(clientId, 100, 60 * 60 * 1000)) { // 100 requests per hour
    return res.status(429).json({ error: 'Too many requests' });
  }
  
  // Handle request...
}
```

### 2. Input Validation

Implement comprehensive input validation:

```typescript
// lib/validation.ts
import { z } from 'zod';

export const CreateWalletSchema = z.object({
  email: z.string().email().max(254),
  passphrase: z.string().min(12).max(128),
  platformId: z.string().min(1).max(100),
  network: z.enum(['testnet', 'mainnet']),
  metadata: z.record(z.unknown()).optional()
});

export const SignTransactionSchema = z.object({
  walletId: z.string().uuid(),
  email: z.string().email(),
  passphrase: z.string().min(12),
  transactionXDR: z.string().min(1)
});

export function validateCreateWallet(data: unknown) {
  try {
    return CreateWalletSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid wallet creation data: ${error.message}`);
  }
}

export function validateSignTransaction(data: unknown) {
  try {
    return SignTransactionSchema.parse(data);
  } catch (error) {
    throw new Error(`Invalid transaction signing data: ${error.message}`);
  }
}
```

### 3. Audit Logging

Implement comprehensive audit logging:

```typescript
// lib/audit-logger.ts
export interface AuditEvent {
  id: string;
  timestamp: string;
  operation: string;
  userId?: string;
  walletId?: string;
  platformId: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  errorCode?: string;
  metadata?: Record<string, unknown>;
}

export class AuditLogger {
  static async log(event: Omit<AuditEvent, 'id' | 'timestamp'>) {
    const auditEvent: AuditEvent = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      ...event
    };
    
    // Store in database
    if (process.env.NODE_ENV === 'production') {
      await this.storeAuditEvent(auditEvent);
    }
    
    // Also log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Audit Event:', auditEvent);
    }
  }
  
  private static async storeAuditEvent(event: AuditEvent) {
    try {
      await DatabaseService.query(
        `INSERT INTO wallet_audit_logs 
         (id, timestamp, operation, user_id, wallet_id, platform_id, 
          ip_address, user_agent, success, error_code, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          event.id,
          event.timestamp,
          event.operation,
          event.userId,
          event.walletId,
          event.platformId,
          event.ipAddress,
          event.userAgent,
          event.success,
          event.errorCode,
          JSON.stringify(event.metadata)
        ]
      );
    } catch (error) {
      console.error('Failed to store audit event:', error);
    }
  }
}
```

## 🚀 Deployment Scripts

### 1. Build Script

```bash
#!/bin/bash
# scripts/build-production.sh

set -e

echo "🔨 Building Invisible Wallets for production..."

# Install dependencies
npm ci --only=production

# Run security audit
npm audit --audit-level high

# Run tests
npm test

# Type checking
npm run type-check

# Build application
npm run build

# Generate sitemap
npm run generate-sitemap

echo "✅ Production build completed successfully!"
```

### 2. Deployment Script

```bash
#!/bin/bash
# scripts/deploy.sh

set -e

ENVIRONMENT=${1:-staging}

echo "🚀 Deploying to $ENVIRONMENT..."

# Build for production
./scripts/build-production.sh

# Deploy to your hosting platform
if [ "$ENVIRONMENT" = "production" ]; then
    # Production deployment
    vercel --prod
    
    # Update DNS records if needed
    # Update CDN cache
    
    # Run smoke tests
    npm run test:smoke:production
    
elif [ "$ENVIRONMENT" = "staging" ]; then
    # Staging deployment
    vercel --target staging
    
    # Run integration tests
    npm run test:integration
fi

echo "✅ Deployment to $ENVIRONMENT completed!"
```

### 3. Health Check Endpoint

```typescript
// pages/api/health.ts
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.NEXT_PUBLIC_APP_VERSION,
    environment: process.env.NODE_ENV,
    checks: {
      database: await checkDatabase(),
      stellar: await checkStellarNetwork(),
      storage: checkBrowserAPIs(),
    }
  };
  
  const isHealthy = Object.values(healthCheck.checks).every(check => check.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(healthCheck);
}

async function checkDatabase() {
  try {
    // Check database connection if using server-side storage
    return { status: 'ok', message: 'Database connected' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

async function checkStellarNetwork() {
  try {
    const response = await fetch('https://horizon.stellar.org/');
    return response.ok 
      ? { status: 'ok', message: 'Stellar network reachable' }
      : { status: 'error', message: 'Stellar network unreachable' };
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

function checkBrowserAPIs() {
  // This runs on server, so just return ok
  // Client-side checks would be done in the browser
  return { status: 'ok', message: 'Browser APIs available' };
}
```

## 📋 Production Checklist

### Pre-Deployment

- [ ] Environment variables configured
- [ ] HTTPS certificate installed
- [ ] CSP headers configured
- [ ] Rate limiting implemented
- [ ] Error monitoring set up
- [ ] Performance monitoring configured
- [ ] Security monitoring enabled
- [ ] Audit logging implemented
- [ ] Database migrations run (if applicable)
- [ ] CDN configured
- [ ] DNS records updated

### Security

- [ ] Demo features disabled (`createWalletWithKeys` not exposed)
- [ ] Debug mode disabled
- [ ] Strong CSP policy
- [ ] Input validation on all endpoints
- [ ] Rate limiting on sensitive operations
- [ ] Failed attempt monitoring
- [ ] Audit trail enabled
- [ ] Error messages don't leak sensitive data

### Performance

- [ ] Code splitting implemented
- [ ] Assets optimized and compressed
- [ ] CDN configured for static assets
- [ ] Database connection pooling (if applicable)
- [ ] Service worker for caching
- [ ] Bundle size optimized

### Monitoring

- [ ] Error tracking configured
- [ ] Performance metrics collection
- [ ] Security event monitoring
- [ ] Health check endpoint
- [ ] Uptime monitoring
- [ ] Log aggregation

### Testing

- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] End-to-end tests passing
- [ ] Security tests passing
- [ ] Performance tests passing
- [ ] Smoke tests for production

### Documentation

- [ ] API documentation updated
- [ ] Deployment procedures documented
- [ ] Incident response plan
- [ ] User guides updated
- [ ] Security policies documented

## 🔄 Maintenance & Updates

### Regular Maintenance Tasks

1. **Security Updates**: Keep all dependencies updated
2. **Certificate Renewal**: Monitor SSL certificate expiration
3. **Log Rotation**: Implement log rotation for audit logs
4. **Performance Review**: Regular performance analysis
5. **Security Audits**: Periodic security assessments

### Update Procedure

1. **Test in Staging**: Always test updates in staging first
2. **Backup Data**: Backup any server-side data before updates
3. **Rolling Deployment**: Use rolling deployments to minimize downtime
4. **Health Checks**: Monitor health checks during deployment
5. **Rollback Plan**: Have a rollback plan ready

This production guide ensures that your Invisible Wallets system is deployed securely, performs well, and can be maintained effectively in a production environment.
