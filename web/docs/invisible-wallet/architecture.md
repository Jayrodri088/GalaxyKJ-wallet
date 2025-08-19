# Architecture Overview

## 🏗️ System Architecture

The Invisible Wallets system is designed with a layered architecture that prioritizes security, performance, and developer experience.

```
┌─────────────────────────────────────────────────────────────┐
│                    React Application Layer                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   Components    │  │     Hooks       │  │   Pages     │  │
│  │                 │  │                 │  │             │  │
│  │ • Demo UI       │  │ • useInvisible  │  │ • /invisible│  │
│  │ • Forms         │  │   Wallet        │  │   -wallet   │  │
│  │ • Displays      │  │ • State Mgmt    │  │             │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     SDK Layer (Public API)                 │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ InvisibleWallet │  │  Event System   │  │  Storage    │  │
│  │      SDK        │  │                 │  │  Adapter    │  │
│  │                 │  │ • walletCreated │  │             │  │
│  │ • Public API    │  │ • walletRecov   │  │ • IndexedDB │  │
│  │ • Config Mgmt   │  │ • txSigned      │  │ • Memory    │  │
│  │ • Error Handle  │  │ • error         │  │ • Custom    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer (Core Logic)              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │ Wallet Service  │  │ Crypto Service  │  │ Audit System│  │
│  │                 │  │                 │  │             │  │
│  │ • Create        │  │ • AES-256-GCM   │  │ • Operation │  │
│  │ • Recover       │  │ • PBKDF2        │  │   Logging   │  │
│  │ • Sign          │  │ • Key Gen       │  │ • Security  │  │
│  │ • Balance       │  │ • Validation    │  │   Events    │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                   Storage & Network Layer                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────┐  │
│  │   IndexedDB     │  │  Stellar SDK    │  │   Horizon   │  │
│  │                 │  │                 │  │     API     │  │
│  │ • Encrypted     │  │ • Keypairs      │  │             │  │
│  │   Wallets       │  │ • Transactions  │  │ • Balances  │  │
│  │ • Audit Logs    │  │ • Networks      │  │ • Submit TX │  │
│  │ • Metadata      │  │ • Signing       │  │ • History   │  │
│  └─────────────────┘  └─────────────────┘  └─────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 Core Components

### 1. React Application Layer

**Purpose**: User interface and state management
**Files**: 
- `components/invisible-wallet/invisible-wallet-demo.tsx`
- `hooks/use-invisible-wallet.ts`
- `app/invisible-wallet/page.tsx`

**Responsibilities**:
- User interface components
- Form handling and validation
- React state management
- Error display and user feedback
- Integration with React ecosystem

### 2. SDK Layer (Public API)

**Purpose**: Developer-friendly interface for wallet operations
**Files**: 
- `lib/invisible-wallet/sdk.ts`
- `lib/invisible-wallet/index.ts`

**Responsibilities**:
- Public API surface
- Configuration management
- Event system for wallet operations
- Storage abstraction
- Error handling and user-friendly messages

### 3. Service Layer (Core Logic)

**Purpose**: Business logic and cryptographic operations
**Files**: 
- `lib/invisible-wallet/wallet-service.ts`
- `lib/invisible-wallet/crypto-service.ts`

**Responsibilities**:
- Wallet lifecycle management
- Cryptographic operations (encryption/decryption)
- Stellar network interactions
- Audit logging
- Validation logic

### 4. Storage & Network Layer

**Purpose**: Data persistence and external communication
**Technologies**: 
- IndexedDB (browser storage)
- Stellar SDK (blockchain interaction)
- Horizon API (Stellar network)

**Responsibilities**:
- Encrypted wallet storage
- Blockchain communication
- Network error handling
- Data persistence

## 🔐 Security Architecture

### Encryption Flow

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Input    │    │  Key Derivation │    │   Encryption    │
│                 │    │                 │    │                 │
│ Email           │───►│ PBKDF2          │───►│ AES-256-GCM     │
│ Passphrase      │    │ SHA-256         │    │                 │
│                 │    │ 100k iterations │    │ Unique Salt+IV  │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IndexedDB     │    │  Stellar Keys   │    │ Encrypted Blob  │
│                 │◄───│                 │◄───│                 │
│ Encrypted Data  │    │ Public Key      │    │ Ciphertext      │
│ Salt & IV       │    │ Private Key     │    │ Salt & IV       │
│ Metadata        │    │                 │    │ AAD             │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Key Security Features

1. **Zero-Knowledge Architecture**
   - Private keys never stored in plaintext
   - Passphrases never logged or transmitted
   - Decryption only happens in memory during operations

2. **Cryptographic Standards**
   - AES-256-GCM for authenticated encryption
   - PBKDF2 with SHA-256 (100,000 iterations)
   - Unique salt and IV per wallet
   - Stellar-compatible ED25519 keypairs

3. **Browser Security**
   - Web Crypto API for cryptographic operations
   - IndexedDB for secure local storage
   - CSP-compliant implementation
   - No sensitive data in localStorage

## 📊 Data Flow

### Wallet Creation Flow

```
1. User Input (email + passphrase)
         │
         ▼
2. Generate Stellar Keypair (ED25519)
         │
         ▼
3. Derive encryption key (PBKDF2)
         │
         ▼
4. Encrypt private key (AES-256-GCM)
         │
         ▼
5. Store encrypted wallet (IndexedDB)
         │
         ▼
6. Fund account (Testnet only)
         │
         ▼
7. Return wallet response
```

### Transaction Signing Flow

```
1. Transaction XDR input
         │
         ▼
2. Validate transaction format
         │
         ▼
3. Decrypt private key (user passphrase)
         │
         ▼
4. Sign transaction (Stellar SDK)
         │
         ▼
5. Submit to network (optional)
         │
         ▼
6. Log audit entry
         │
         ▼
7. Return signed transaction
```

## 🏪 Storage Architecture

### IndexedDB Schema

```javascript
// Database: InvisibleWalletsDB
// Version: 1

// Object Store: wallets
{
  keyPath: 'id',
  indexes: {
    'email-platform-network': ['email', 'platformId', 'network'],
    'email': 'email',
    'platformId': 'platformId',
    'network': 'network'
  }
}

// Object Store: auditLogs
{
  keyPath: 'id',
  indexes: {
    'walletId': 'walletId',
    'timestamp': 'timestamp',
    'operation': 'operation'
  }
}
```

### Data Structures

```typescript
// Stored in IndexedDB
interface StoredWallet {
  id: string;
  email: string;
  publicKey: string;
  encryptedSecret: number[]; // AES-256-GCM ciphertext
  salt: number[];            // PBKDF2 salt
  iv: number[];              // AES-GCM initialization vector
  platformId: string;
  network: NetworkType;
  status: WalletStatus;
  createdAt: string;
  lastAccessedAt?: string;
  metadata?: Record<string, unknown>;
}

interface AuditLogEntry {
  id: string;
  walletId: string;
  operation: string;
  timestamp: string;
  platformId: string;
  ipAddress: string;
  userAgent: string;
  success: boolean;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}
```

## 🌐 Network Architecture

### Stellar Network Integration

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Application    │    │  Stellar SDK    │    │ Stellar Network │
│                 │    │                 │    │                 │
│ • Create TX     │───►│ • Build TX      │───►│ • Validate      │
│ • Sign TX       │    │ • Sign TX       │    │ • Execute       │
│ • Submit TX     │    │ • Submit TX     │    │ • Confirm       │
│                 │◄───│                 │◄───│                 │
│ • Get Balance   │    │ • Query API     │    │ • Ledger Data   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### Network Configurations

```typescript
const STELLAR_NETWORKS = {
  testnet: {
    networkPassphrase: Networks.TESTNET,
    horizonUrl: 'https://horizon-testnet.stellar.org',
    friendbotUrl: 'https://friendbot.stellar.org',
  },
  mainnet: {
    networkPassphrase: Networks.PUBLIC,
    horizonUrl: 'https://horizon.stellar.org',
    friendbotUrl: null, // No friendbot on mainnet
  },
};
```

## 🔄 Event System

### Event-Driven Architecture

```typescript
// SDK Events
interface SDKEvents {
  walletCreated: {
    walletId: string;
    email: string;
    publicKey: string;
    network: NetworkType;
  };
  
  walletRecovered: {
    walletId: string;
    email: string;
    publicKey: string;
    network: NetworkType;
  };
  
  transactionSigned: {
    walletId: string;
    transactionHash: string;
    signedXDR: string;
  };
  
  error: {
    operation: string;
    error: string;
    details?: any;
  };
}
```

### Event Flow

```
1. User Action (e.g., create wallet)
         │
         ▼
2. SDK Method Call
         │
         ▼
3. Service Layer Processing
         │
         ▼
4. Success/Error Result
         │
         ▼
5. Event Emission
         │
         ▼
6. React Hook State Update
         │
         ▼
7. UI Re-render
```

## 🚀 Performance Optimizations

### 1. Lazy Loading
- SDK initialization only when needed
- Cryptographic operations on-demand
- IndexedDB connections as required

### 2. Caching Strategy
- Wallet metadata cached in memory
- Balance information cached with TTL
- Network responses cached appropriately

### 3. Parallel Operations
- Multiple wallet operations can run concurrently
- Background balance updates
- Non-blocking UI operations

### 4. Memory Management
- Sensitive data cleared after use
- Proper cleanup of event listeners
- Efficient IndexedDB queries

## 🔧 Extensibility Points

### 1. Custom Storage Implementations
```typescript
interface WalletStorage {
  saveWallet(wallet: InvisibleWallet): Promise<void>;
  getWallet(email: string, platformId: string, network: NetworkType): Promise<InvisibleWallet | null>;
  getWalletById(id: string): Promise<InvisibleWallet | null>;
  deleteWallet(id: string): Promise<void>;
  saveAuditLog(entry: AuditLogEntry): Promise<void>;
}
```

### 2. Custom Network Providers
```typescript
interface NetworkProvider {
  getBalance(publicKey: string): Promise<StellarBalance[]>;
  submitTransaction(signedXDR: string): Promise<any>;
  fundAccount(publicKey: string): Promise<void>;
}
```

### 3. Plugin Architecture
```typescript
interface InvisibleWalletPlugin {
  name: string;
  version: string;
  initialize(sdk: InvisibleWalletSDK): void;
  destroy(): void;
}
```

## 📈 Scalability Considerations

### Browser Limitations
- **IndexedDB Storage**: ~50MB per domain
- **Memory Usage**: ~10MB per 1000 wallets
- **Concurrent Operations**: Limited by browser tab limits

### Performance Targets
- **Wallet Creation**: < 1 second
- **Balance Queries**: < 500ms
- **Transaction Signing**: < 200ms
- **Recovery Operations**: < 800ms

### Future Enhancements
- **Service Worker Integration**: Offline capabilities
- **WebAssembly**: Faster cryptographic operations
- **Shared Workers**: Cross-tab wallet sharing
- **Streaming APIs**: Real-time balance updates
