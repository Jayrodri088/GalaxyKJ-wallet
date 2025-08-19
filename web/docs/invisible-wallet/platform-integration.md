# Platform Integration Guide

## 🚀 How to Consume Galaxy Wallet for Invisible Wallets

This guide explains how external applications and platforms can integrate with **Galaxy Wallet** to provide **Invisible Wallets** functionality to their users.

## 🎯 Integration Models

### 1. **SDK Integration (Recommended)**
Direct integration using Galaxy Wallet's JavaScript/TypeScript SDK

### 2. **API Integration** 
Server-to-server integration using REST APIs (future)

### 3. **Widget Embedding**
Embed Galaxy Wallet components in your application

### 4. **White-label Solution**
Complete wallet solution branded for your platform

## 📦 SDK Integration

### Installation & Setup

#### Step 1: Install Galaxy Wallet SDK

```bash
# Option 1: NPM Package (when published)
npm install @galaxy-wallet/invisible-wallets

# Option 2: Direct Integration (current)
# Copy the SDK files to your project:
# - lib/invisible-wallet/
# - types/invisible-wallet.ts
# - hooks/use-invisible-wallet.ts
```

#### Step 2: Configure Your Platform

```typescript
// config/wallet-config.ts
import { SDKConfig } from '@galaxy-wallet/invisible-wallets';

export const WALLET_CONFIG: SDKConfig = {
  platformId: 'your-platform-v1', // Unique identifier for your platform
  defaultNetwork: 'testnet', // or 'mainnet' for production
  debug: process.env.NODE_ENV === 'development',
  
  // Optional: Custom branding
  metadata: {
    platformName: 'Your Platform Name',
    brandColor: '#your-color',
    logo: 'https://your-domain.com/logo.png',
  },
  
  // Optional: Custom storage (defaults to IndexedDB)
  storage: undefined, // Will use browser IndexedDB
};
```

#### Step 3: Initialize in Your App

```typescript
// app/layout.tsx or _app.tsx
import { WalletProvider } from '@galaxy-wallet/invisible-wallets';
import { WALLET_CONFIG } from '@/config/wallet-config';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <WalletProvider config={WALLET_CONFIG}>
          {children}
        </WalletProvider>
      </body>
    </html>
  );
}
```

## 🎨 Integration Examples

### 1. E-commerce Platform Integration

```typescript
// components/checkout/WalletCheckout.tsx
'use client';

import { useInvisibleWallet } from '@galaxy-wallet/invisible-wallets';
import { useState } from 'react';

interface CheckoutProps {
  orderTotal: number;
  merchantAddress: string;
  onPaymentComplete: (txHash: string) => void;
}

export function WalletCheckout({ orderTotal, merchantAddress, onPaymentComplete }: CheckoutProps) {
  const {
    createWallet,
    getWallet,
    signTransaction,
    wallet,
    isLoading,
    error
  } = useInvisibleWallet({
    platformId: 'ecommerce-store-v1',
    defaultNetwork: 'testnet',
  });

  const [userCredentials, setUserCredentials] = useState({
    email: '',
    passphrase: '',
  });

  const handlePayment = async () => {
    try {
      // Get or create wallet
      let userWallet = await getWallet(userCredentials.email, {
        network: 'testnet'
      });
      
      if (!userWallet) {
        userWallet = await createWallet(
          userCredentials.email,
          userCredentials.passphrase,
          {
            metadata: { 
              source: 'checkout',
              orderId: `order-${Date.now()}`
            }
          }
        );
      }

      // Create payment transaction
      const transactionXDR = await createPaymentTransaction(
        userWallet.publicKey,
        merchantAddress,
        orderTotal.toString()
      );

      // Sign and submit transaction
      const result = await signTransaction(
        userWallet.id,
        userCredentials.email,
        userCredentials.passphrase,
        transactionXDR
      );

      if (result.success && result.transactionHash) {
        onPaymentComplete(result.transactionHash);
      }
    } catch (err) {
      console.error('Payment failed:', err);
    }
  };

  return (
    <div className="wallet-checkout">
      <h3>Pay with Galaxy Wallet</h3>
      
      <div className="form-group">
        <input
          type="email"
          placeholder="Your email"
          value={userCredentials.email}
          onChange={(e) => setUserCredentials(prev => ({
            ...prev,
            email: e.target.value
          }))}
        />
      </div>
      
      <div className="form-group">
        <input
          type="password"
          placeholder="Wallet passphrase"
          value={userCredentials.passphrase}
          onChange={(e) => setUserCredentials(prev => ({
            ...prev,
            passphrase: e.target.value
          }))}
        />
      </div>
      
      <button
        onClick={handlePayment}
        disabled={isLoading}
        className="pay-button"
      >
        {isLoading ? 'Processing...' : `Pay ${orderTotal} XLM`}
      </button>
      
      {error && (
        <div className="error-message">{error}</div>
      )}
    </div>
  );
}

// Helper function to create payment transaction
async function createPaymentTransaction(
  sourcePublicKey: string,
  destinationAddress: string,
  amount: string
): Promise<string> {
  const { TransactionBuilder, Account, Operation, Asset, Networks } = await import('@stellar/stellar-sdk');
  
  // In a real implementation, you'd fetch the current sequence number
  const account = new Account(sourcePublicKey, '0');
  
  const transaction = new TransactionBuilder(account, {
    fee: '100',
    networkPassphrase: Networks.TESTNET,
  })
  .addOperation(Operation.payment({
    destination: destinationAddress,
    asset: Asset.native(),
    amount: amount,
  }))
  .setTimeout(300)
  .build();

  return transaction.toXDR();
}
```

### 2. Gaming Platform Integration

```typescript
// components/game/GameWallet.tsx
'use client';

import { useInvisibleWallet } from '@galaxy-wallet/invisible-wallets';
import { useState, useEffect } from 'react';

export function GameWallet() {
  const {
    createWallet,
    getWallet,
    wallet,
    isLoading
  } = useInvisibleWallet({
    platformId: 'game-platform-v1',
    defaultNetwork: 'testnet',
    metadata: {
      gameVersion: '1.0.0',
      genre: 'RPG'
    }
  });

  const [playerData, setPlayerData] = useState({
    username: '',
    email: '',
    passphrase: '',
    isLoggedIn: false,
  });

  const initializePlayer = async () => {
    try {
      // Try to get existing wallet
      let playerWallet = await getWallet(playerData.email, {
        network: 'testnet'
      });

      if (!playerWallet) {
        // Create new player wallet
        playerWallet = await createWallet(
          playerData.email,
          playerData.passphrase,
          {
            metadata: {
              username: playerData.username,
              gameCharacter: 'warrior',
              level: 1,
              joinedAt: new Date().toISOString()
            }
          }
        );
      }

      setPlayerData(prev => ({ ...prev, isLoggedIn: true }));
    } catch (err) {
      console.error('Failed to initialize player:', err);
    }
  };

  if (!playerData.isLoggedIn) {
    return (
      <div className="game-login">
        <h2>Create Your Game Wallet</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          initializePlayer();
        }}>
          <input
            type="text"
            placeholder="Username"
            value={playerData.username}
            onChange={(e) => setPlayerData(prev => ({
              ...prev,
              username: e.target.value
            }))}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={playerData.email}
            onChange={(e) => setPlayerData(prev => ({
              ...prev,
              email: e.target.value
            }))}
            required
          />
          <input
            type="password"
            placeholder="Secure passphrase"
            value={playerData.passphrase}
            onChange={(e) => setPlayerData(prev => ({
              ...prev,
              passphrase: e.target.value
            }))}
            required
          />
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Creating...' : 'Start Playing'}
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="game-wallet">
      <div className="player-info">
        <h3>Welcome, {playerData.username}!</h3>
        <p>Wallet: {wallet?.publicKey.slice(0, 8)}...</p>
        <p>Balance: {wallet?.balance?.native || '0'} XLM</p>
      </div>
      
      <div className="game-actions">
        <button onClick={() => earnCredits(10)}>
          🏆 Complete Quest (+10 XLM)
        </button>
        <button onClick={() => purchaseItem('sword', 5)}>
          ⚔️ Buy Sword (5 XLM)
        </button>
      </div>
    </div>
  );
}

// Game-specific helper functions
function earnCredits(amount: number) {
  // Implementation for earning in-game credits
  console.log(`Player earned ${amount} credits`);
}

function purchaseItem(item: string, cost: number) {
  // Implementation for purchasing in-game items
  console.log(`Player purchased ${item} for ${cost} XLM`);
}
```

### 3. DeFi Platform Integration

```typescript
// components/defi/DeFiWallet.tsx
'use client';

import { useInvisibleWallet } from '@galaxy-wallet/invisible-wallets';
import { useState } from 'react';

export function DeFiWallet() {
  const {
    createWallet,
    getWallet,
    signTransaction,
    wallet,
    isLoading
  } = useInvisibleWallet({
    platformId: 'defi-platform-v1',
    defaultNetwork: 'mainnet', // DeFi typically uses mainnet
    metadata: {
      protocolVersion: '2.0',
      riskProfile: 'moderate'
    }
  });

  const [poolData] = useState([
    { name: 'XLM/USDC', apy: '12.5%', tvl: '$1.2M' },
    { name: 'XLM/BTC', apy: '8.3%', tvl: '$800K' },
    { name: 'USDC/USDT', apy: '6.1%', tvl: '$2.1M' },
  ]);

  const [userCredentials, setUserCredentials] = useState({
    email: '',
    passphrase: '',
  });

  const connectWallet = async () => {
    try {
      let userWallet = await getWallet(userCredentials.email, {
        network: 'mainnet'
      });

      if (!userWallet) {
        userWallet = await createWallet(
          userCredentials.email,
          userCredentials.passphrase,
          {
            metadata: {
              protocolAccepted: true,
              riskDisclosureAccepted: true,
              connectedAt: new Date().toISOString()
            }
          }
        );
      }
    } catch (err) {
      console.error('Failed to connect wallet:', err);
    }
  };

  const stakeLiquidity = async (poolName: string, amount: string) => {
    if (!wallet) return;

    try {
      // Create staking transaction
      const transactionXDR = await createStakingTransaction(
        wallet.publicKey,
        poolName,
        amount
      );

      const result = await signTransaction(
        wallet.id,
        userCredentials.email,
        userCredentials.passphrase,
        transactionXDR
      );

      if (result.success) {
        console.log('Staking successful:', result.transactionHash);
      }
    } catch (err) {
      console.error('Staking failed:', err);
    }
  };

  if (!wallet) {
    return (
      <div className="defi-connect">
        <h2>Connect to Galaxy DeFi</h2>
        <div className="connect-form">
          <input
            type="email"
            placeholder="Email"
            value={userCredentials.email}
            onChange={(e) => setUserCredentials(prev => ({
              ...prev,
              email: e.target.value
            }))}
          />
          <input
            type="password"
            placeholder="Passphrase"
            value={userCredentials.passphrase}
            onChange={(e) => setUserCredentials(prev => ({
              ...prev,
              passphrase: e.target.value
            }))}
          />
          <button onClick={connectWallet} disabled={isLoading}>
            {isLoading ? 'Connecting...' : 'Connect Wallet'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="defi-dashboard">
      <div className="wallet-info">
        <h3>Portfolio</h3>
        <p>Address: {wallet.publicKey.slice(0, 8)}...</p>
        <p>Balance: {wallet.balance?.native || '0'} XLM</p>
      </div>
      
      <div className="liquidity-pools">
        <h3>Liquidity Pools</h3>
        {poolData.map((pool, index) => (
          <div key={index} className="pool-card">
            <div className="pool-info">
              <h4>{pool.name}</h4>
              <p>APY: {pool.apy}</p>
              <p>TVL: {pool.tvl}</p>
            </div>
            <button
              onClick={() => stakeLiquidity(pool.name, '100')}
              className="stake-button"
            >
              Stake 100 XLM
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// Helper function for staking transactions
async function createStakingTransaction(
  userPublicKey: string,
  poolName: string,
  amount: string
): Promise<string> {
  // This would create a proper staking transaction
  // Implementation depends on your DeFi protocol
  console.log(`Creating staking transaction for ${amount} XLM in ${poolName}`);
  return 'mock-transaction-xdr';
}
```

## 🔧 Advanced Integration Options

### 1. Custom Storage Implementation

```typescript
// lib/custom-storage.ts
import { WalletStorage, InvisibleWallet, AuditLogEntry, NetworkType } from '@galaxy-wallet/invisible-wallets';

export class DatabaseWalletStorage implements WalletStorage {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string, apiKey: string) {
    this.apiUrl = apiUrl;
    this.apiKey = apiKey;
  }

  async saveWallet(wallet: InvisibleWallet): Promise<void> {
    const response = await fetch(`${this.apiUrl}/wallets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(wallet),
    });

    if (!response.ok) {
      throw new Error('Failed to save wallet');
    }
  }

  async getWallet(email: string, platformId: string, network: NetworkType): Promise<InvisibleWallet | null> {
    const response = await fetch(
      `${this.apiUrl}/wallets?email=${email}&platformId=${platformId}&network=${network}`,
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get wallet');
    }

    return response.json();
  }

  async getWalletById(id: string): Promise<InvisibleWallet | null> {
    const response = await fetch(`${this.apiUrl}/wallets/${id}`, {
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new Error('Failed to get wallet by ID');
    }

    return response.json();
  }

  async updateWalletAccess(id: string): Promise<void> {
    await fetch(`${this.apiUrl}/wallets/${id}/access`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
  }

  async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    await fetch(`${this.apiUrl}/audit-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(entry),
    });
  }

  async deleteWallet(id: string): Promise<void> {
    await fetch(`${this.apiUrl}/wallets/${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
      },
    });
  }
}

// Usage
const customStorage = new DatabaseWalletStorage(
  'https://your-api.com',
  'your-api-key'
);

const walletConfig = {
  platformId: 'your-platform-v1',
  defaultNetwork: 'testnet',
  storage: customStorage,
};
```

### 2. Multi-Platform Wallet Management

```typescript
// lib/multi-platform-manager.ts
import { useInvisibleWallet } from '@galaxy-wallet/invisible-wallets';

export class MultiPlatformWalletManager {
  private platforms: Map<string, any> = new Map();

  registerPlatform(platformId: string, config: any) {
    this.platforms.set(platformId, {
      ...config,
      platformId,
    });
  }

  usePlatformWallet(platformId: string) {
    const config = this.platforms.get(platformId);
    if (!config) {
      throw new Error(`Platform ${platformId} not registered`);
    }

    return useInvisibleWallet(config);
  }

  async transferBetweenPlatforms(
    fromPlatformId: string,
    toPlatformId: string,
    email: string,
    passphrase: string,
    amount: string
  ) {
    const fromWallet = this.usePlatformWallet(fromPlatformId);
    const toWallet = this.usePlatformWallet(toPlatformId);

    // Implementation for cross-platform transfers
    console.log(`Transferring ${amount} XLM from ${fromPlatformId} to ${toPlatformId}`);
  }
}

// Usage
const walletManager = new MultiPlatformWalletManager();

walletManager.registerPlatform('ecommerce', {
  defaultNetwork: 'testnet',
  metadata: { type: 'ecommerce' }
});

walletManager.registerPlatform('gaming', {
  defaultNetwork: 'testnet',
  metadata: { type: 'gaming' }
});

// In components
export function CrossPlatformWallet() {
  const ecommerceWallet = walletManager.usePlatformWallet('ecommerce');
  const gamingWallet = walletManager.usePlatformWallet('gaming');

  return (
    <div>
      <div>E-commerce Balance: {ecommerceWallet.wallet?.balance?.native}</div>
      <div>Gaming Balance: {gamingWallet.wallet?.balance?.native}</div>
    </div>
  );
}
```

## 🎨 White-label Solutions

### 1. Custom Branding

```typescript
// config/branded-wallet.ts
export const BRANDED_WALLET_CONFIG = {
  platformId: 'your-brand-v1',
  defaultNetwork: 'mainnet',
  
  // Custom branding
  branding: {
    primaryColor: '#your-primary-color',
    secondaryColor: '#your-secondary-color',
    logo: 'https://your-domain.com/logo.png',
    name: 'Your Brand Wallet',
    tagline: 'Secure, Simple, Stellar',
  },
  
  // Custom labels
  labels: {
    createWallet: 'Create Your Account',
    recoverWallet: 'Access Your Account',
    signTransaction: 'Authorize Payment',
    balance: 'Available Balance',
  },
  
  // Custom styling
  styling: {
    borderRadius: '12px',
    fontFamily: 'Your Brand Font',
    buttonStyle: 'rounded',
    theme: 'light', // or 'dark'
  },
};
```

### 2. Custom Components

```typescript
// components/branded/BrandedWallet.tsx
import { useInvisibleWallet } from '@galaxy-wallet/invisible-wallets';
import { BRANDED_WALLET_CONFIG } from '@/config/branded-wallet';

export function BrandedWallet() {
  const { createWallet, wallet, isLoading } = useInvisibleWallet(BRANDED_WALLET_CONFIG);

  return (
    <div 
      className="branded-wallet"
      style={{
        '--primary-color': BRANDED_WALLET_CONFIG.branding.primaryColor,
        '--secondary-color': BRANDED_WALLET_CONFIG.branding.secondaryColor,
      }}
    >
      <div className="brand-header">
        <img 
          src={BRANDED_WALLET_CONFIG.branding.logo} 
          alt={BRANDED_WALLET_CONFIG.branding.name}
        />
        <h1>{BRANDED_WALLET_CONFIG.branding.name}</h1>
        <p>{BRANDED_WALLET_CONFIG.branding.tagline}</p>
      </div>
      
      {/* Your custom wallet interface */}
      <div className="wallet-interface">
        {/* Implementation using your brand styling */}
      </div>
    </div>
  );
}
```

## 📊 Analytics & Monitoring

### Platform Usage Analytics

```typescript
// lib/platform-analytics.ts
export class PlatformAnalytics {
  private platformId: string;
  private apiEndpoint: string;

  constructor(platformId: string, apiEndpoint: string) {
    this.platformId = platformId;
    this.apiEndpoint = apiEndpoint;
  }

  trackWalletCreation(userId: string) {
    this.sendEvent('wallet_created', { userId });
  }

  trackTransaction(userId: string, amount: string, type: string) {
    this.sendEvent('transaction', { userId, amount, type });
  }

  trackError(error: string, context: any) {
    this.sendEvent('error', { error, context });
  }

  private async sendEvent(eventType: string, data: any) {
    try {
      await fetch(`${this.apiEndpoint}/analytics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platformId: this.platformId,
          eventType,
          data,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (err) {
      console.error('Analytics error:', err);
    }
  }
}
```

## 🚀 Deployment & Production

### 1. Environment Configuration

```typescript
// config/production.ts
export const PRODUCTION_CONFIG = {
  platformId: process.env.NEXT_PUBLIC_PLATFORM_ID!,
  defaultNetwork: 'mainnet',
  debug: false,
  
  // Production security settings
  security: {
    requireHttps: true,
    enableCSP: true,
    maxWalletsPerUser: 10,
    sessionTimeout: 30 * 60 * 1000, // 30 minutes
  },
  
  // Performance settings
  performance: {
    cacheTimeout: 5 * 60 * 1000, // 5 minutes
    maxConcurrentOperations: 5,
    enableServiceWorker: true,
  },
  
  // Monitoring
  monitoring: {
    errorReporting: true,
    performanceTracking: true,
    userAnalytics: true,
  },
};
```

### 2. Health Checks

```typescript
// pages/api/health.ts
export default async function handler(req, res) {
  const healthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    platform: process.env.NEXT_PUBLIC_PLATFORM_ID,
    checks: {
      stellar: await checkStellarNetwork(),
      storage: await checkStorage(),
      encryption: await checkEncryption(),
    }
  };
  
  const isHealthy = Object.values(healthCheck.checks)
    .every(check => check.status === 'ok');
  
  res.status(isHealthy ? 200 : 503).json(healthCheck);
}
```

## 📋 Integration Checklist

### Pre-Integration
- [ ] Define your platform ID
- [ ] Choose integration model (SDK/API/Widget)
- [ ] Set up development environment
- [ ] Configure network (testnet/mainnet)
- [ ] Plan user experience flow

### Development
- [ ] Install and configure SDK
- [ ] Implement wallet creation flow
- [ ] Implement wallet recovery flow
- [ ] Add transaction signing
- [ ] Implement error handling
- [ ] Add loading states and feedback

### Testing
- [ ] Test wallet creation and recovery
- [ ] Test transaction signing
- [ ] Test error scenarios
- [ ] Test network connectivity issues
- [ ] Perform security testing
- [ ] Test performance under load

### Production
- [ ] Configure production settings
- [ ] Set up monitoring and analytics
- [ ] Implement security measures
- [ ] Set up backup and recovery
- [ ] Plan user support processes
- [ ] Document integration for your team

## 🎯 Next Steps

1. **Start with the Demo**: Visit `/invisible-wallet` to see Galaxy Wallet in action
2. **Choose Integration Model**: Decide between SDK, API, or widget integration
3. **Set Up Development**: Configure your development environment
4. **Build MVP**: Create a minimal viable integration
5. **Test Thoroughly**: Test all scenarios and edge cases
6. **Deploy to Production**: Follow the production deployment guide
7. **Monitor and Optimize**: Use analytics to improve user experience

Galaxy Wallet's Invisible Wallets system provides a complete solution for platforms wanting to offer seamless blockchain wallet functionality without the complexity of traditional key management.
