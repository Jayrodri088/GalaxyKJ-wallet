# Invisible Wallets Documentation

## 🚀 Overview

**Invisible Wallets** is a revolutionary system that eliminates the friction of managing Stellar blockchain private keys for end-users. Instead of dealing with complex seed phrases and key management, users can create and recover wallets using just their email and a passphrase.

## 🎯 Key Features

- **🔐 No Seed Phrases**: Users never see or manage seed phrases
- **📧 Email + Passphrase Recovery**: Simple recovery mechanism using familiar credentials
- **🔒 End-to-End Encryption**: Private keys are encrypted with AES-256-GCM
- **⚡ Transparent Signing**: Sign transactions without exposing private keys
- **🌐 Stellar Compatible**: Full compatibility with Stellar Core protocol
- **💾 Local Storage**: Uses IndexedDB for secure local wallet storage
- **🔄 Auto-Funding**: Automatic testnet account funding
- **📊 Balance Tracking**: Real-time balance monitoring
- **🎨 React Integration**: Easy-to-use React hooks and components

## 📖 Table of Contents

1. [Quick Start Guide](./quick-start.md)
2. [Platform Integration](./platform-integration.md)
3. [Architecture Overview](./architecture.md)
4. [API Reference](./api-reference.md)
5. [Security Model](./security.md)
6. [Error Handling](./error-handling.md)
7. [Examples](./examples.md)
8. [Production Deployment](./production.md)
9. [Troubleshooting](./troubleshooting.md)

## 🔧 Core Components

### 1. **Cryptographic Service** (`crypto-service.ts`)
- Handles keypair generation
- Manages AES-256-GCM encryption/decryption
- Implements PBKDF2 key derivation
- Provides secure random ID generation

### 2. **Wallet Service** (`wallet-service.ts`)
- Core wallet management logic
- Handles wallet creation, recovery, and signing
- Manages Stellar network interactions
- Implements audit logging

### 3. **SDK** (`sdk.ts`)
- Public-facing JavaScript/TypeScript SDK
- Event-driven architecture
- Browser storage management
- Simple API for web applications

### 4. **React Hooks** (`use-invisible-wallet.ts`)
- React-specific integration layer
- State management for wallet operations
- Loading and error handling
- Automatic balance updates

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   React App     │    │   Invisible      │    │   Stellar       │
│                 │    │   Wallet SDK     │    │   Network       │
│  ┌───────────┐  │    │                  │    │                 │
│  │   Hooks   │  │◄──►│  ┌─────────────┐ │    │  ┌────────────┐ │
│  └───────────┘  │    │  │   Service   │ │◄──►│  │  Horizon   │ │
│                 │    │  └─────────────┘ │    │  │    API     │ │
│  ┌───────────┐  │    │                  │    │  └────────────┘ │
│  │Components │  │    │  ┌─────────────┐ │    │                 │
│  └───────────┘  │    │  │   Crypto    │ │    │  ┌────────────┐ │
└─────────────────┘    │  │   Service   │ │    │  │ Friendbot  │ │
                       │  └─────────────┘ │    │  │(Testnet)   │ │
┌─────────────────┐    │                  │    │  └────────────┘ │
│   IndexedDB     │◄──►│  ┌─────────────┐ │    └─────────────────┘
│   Storage       │    │  │  Storage    │ │
└─────────────────┘    │  │  Layer      │ │
                       │  └─────────────┘ │
                       └──────────────────┘
```

## 🚀 Getting Started

### Installation

The Invisible Wallet system is already integrated into your project. To use it:

1. **Import the hook**:
```typescript
import { useInvisibleWallet } from '@/hooks/use-invisible-wallet';
```

2. **Configure the SDK**:
```typescript
const config = {
  platformId: 'your-platform-id',
  defaultNetwork: 'testnet', // or 'mainnet'
  debug: true, // Enable debug logging
};
```

3. **Use in your component**:
```typescript
const { createWalletWithKeys, wallet, isLoading, error } = useInvisibleWallet(config);
```

### Demo Page

Visit `/invisible-wallet` to see a complete working demo with all features.

## 🔑 Basic Usage

### Creating a Wallet

```typescript
const result = await createWalletWithKeys(
  'user@example.com',
  'secure-passphrase-123',
  {
    network: 'testnet',
    metadata: { source: 'your-app' }
  }
);

console.log('Public Key:', result.publicKey);
console.log('Secret Key:', result.secretKey); // Demo only!
```

### Recovering a Wallet

```typescript
const wallet = await recoverWallet(
  'user@example.com',
  'secure-passphrase-123',
  { network: 'testnet' }
);
```

### Signing Transactions

```typescript
const result = await signTransaction(
  walletId,
  'user@example.com',
  'secure-passphrase-123',
  transactionXDR
);
```

## 🔒 Security Features

- **AES-256-GCM Encryption**: Military-grade encryption for private keys
- **PBKDF2 Key Derivation**: 100,000 iterations with SHA-256
- **Unique Salt & IV**: Each wallet has unique cryptographic parameters
- **No Private Key Exposure**: Keys never leave the encryption layer (except in demo mode)
- **Audit Logging**: All operations are logged for security monitoring
- **Browser Security**: CSP-compliant, no localStorage for secrets

## 📱 Supported Networks

- **Testnet**: For development and testing
- **Mainnet**: For production use (Stellar public network)

## 🌟 Next Steps

1. Read the [Quick Start Guide](./quick-start.md) for hands-on examples
2. Explore the [API Reference](./api-reference.md) for detailed method documentation
3. Check out [Security Model](./security.md) to understand the cryptographic design
4. See [Examples](./examples.md) for real-world use cases

---

**⚠️ Important**: The `createWalletWithKeys` method that exposes private keys is designed for demonstration purposes only. In production applications, use the standard `createWallet` method that keeps private keys encrypted and secure.
