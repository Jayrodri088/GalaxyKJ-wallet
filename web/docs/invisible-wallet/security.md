# Security Model

## 🔒 Security Overview

The Invisible Wallets system is built with security as the primary concern. This document outlines the cryptographic design, security measures, and best practices implemented to protect user assets and data.

## 🔐 Cryptographic Foundation

### Encryption Algorithm: AES-256-GCM

**Why AES-256-GCM?**
- **Authenticated Encryption**: Provides both confidentiality and integrity
- **NIST Approved**: Meets government-grade security standards
- **Hardware Acceleration**: Optimized performance on modern processors
- **Resistance to Attacks**: Immune to padding oracle and timing attacks

**Implementation Details:**
```typescript
// Encryption Parameters
const ENCRYPTION_CONFIG = {
  algorithm: 'AES-GCM',
  keyLength: 256,        // 256-bit key
  ivLength: 16,          // 128-bit initialization vector
  saltLength: 32,        // 256-bit salt
  tagLength: 16,         // 128-bit authentication tag
};
```

### Key Derivation: PBKDF2-SHA256

**Why PBKDF2?**
- **Industry Standard**: Widely adopted and well-tested
- **Configurable Iterations**: Adjustable work factor
- **Salt Support**: Prevents rainbow table attacks
- **FIPS Approved**: Meets compliance requirements

**Configuration:**
```typescript
const PBKDF2_CONFIG = {
  iterations: 100000,    // 100k iterations (OWASP recommended minimum)
  hash: 'SHA-256',       // Secure hash function
  saltLength: 32,        // 256-bit unique salt per wallet
};
```

### Stellar Keypairs: ED25519

**Why ED25519?**
- **Stellar Native**: Required by Stellar protocol
- **High Security**: 128-bit security level
- **Performance**: Fast signature generation and verification
- **Small Keys**: 32-byte keys, 64-byte signatures

## 🛡️ Security Architecture

### Zero-Knowledge Design

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   User Device   │    │   Application   │    │  Stellar Network│
│                 │    │                 │    │                 │
│ • Passphrase    │    │ • Encrypted     │    │ • Public Keys   │
│ • Private Keys  │    │   Data Only     │    │ • Transactions  │
│ • Decryption    │    │ • No Secrets    │    │ • Balances      │
│                 │    │ • Audit Logs    │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        │                        │                        │
        │◄──── Encrypted ────────┤                        │
        │       Storage          │                        │
        │                        │                        │
        └────── Public Ops ──────┼────────────────────────┘
                                 │
                            No Private
                            Data Stored
```

### Threat Model

**Protected Against:**
- ✅ **Database Compromise**: All private keys encrypted
- ✅ **Man-in-the-Middle**: HTTPS + signed transactions
- ✅ **Rainbow Tables**: Unique salts per wallet
- ✅ **Brute Force**: High iteration PBKDF2
- ✅ **Timing Attacks**: Constant-time operations
- ✅ **Memory Dumps**: Keys cleared after use
- ✅ **Cross-Site Scripting**: CSP headers + input validation
- ✅ **Replay Attacks**: Stellar sequence numbers

**Attack Vectors Considered:**
- ❌ **Weak Passphrases**: Mitigated by validation
- ❌ **Phishing**: User education + domain verification
- ❌ **Social Engineering**: Multi-factor recovery (planned)
- ❌ **Device Compromise**: Local encryption + secure storage

## 🔑 Key Management

### Key Generation Process

```typescript
// 1. Generate Stellar Keypair
const keypair = Keypair.random(); // Uses secure random number generator
const publicKey = keypair.publicKey();  // Safe to store/transmit
const secretKey = keypair.secret();     // Must be encrypted immediately

// 2. Derive Encryption Key
const salt = crypto.getRandomValues(new Uint8Array(32));
const keyMaterial = await crypto.subtle.importKey('raw', passwordBytes, 'PBKDF2', false, ['deriveKey']);
const encryptionKey = await crypto.subtle.deriveKey(
  { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
  keyMaterial,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt']
);

// 3. Encrypt Private Key
const iv = crypto.getRandomValues(new Uint8Array(16));
const encryptedSecret = await crypto.subtle.encrypt(
  { name: 'AES-GCM', iv },
  encryptionKey,
  secretKeyBytes
);
```

### Key Storage Security

**Browser Storage (IndexedDB):**
```typescript
// Stored Data Structure
interface StoredWallet {
  id: string;                    // UUID (public)
  email: string;                 // Email (public)
  publicKey: string;             // Stellar public key (public)
  encryptedSecret: number[];     // AES-256-GCM encrypted private key
  salt: number[];                // PBKDF2 salt (unique per wallet)
  iv: number[];                  // AES-GCM initialization vector
  // ... other metadata (all public)
}
```

**Security Properties:**
- **Encrypted at Rest**: Private keys never stored in plaintext
- **Domain Isolation**: IndexedDB isolated per domain
- **Secure Context**: Requires HTTPS in production
- **No Cross-Origin Access**: Same-origin policy enforced

### Key Usage Lifecycle

```
1. User Authentication (email + passphrase)
         │
         ▼
2. Retrieve Encrypted Wallet (IndexedDB)
         │
         ▼
3. Derive Decryption Key (PBKDF2)
         │
         ▼
4. Decrypt Private Key (AES-GCM)
         │
         ▼
5. Perform Operation (sign transaction)
         │
         ▼
6. Clear Private Key (memory wipe)
         │
         ▼
7. Operation Complete (no secrets retained)
```

## 🔐 Authentication & Authorization

### Multi-Factor Authentication

**Primary Factors:**
1. **Email Address**: User identifier
2. **Passphrase**: User-chosen secret

**Additional Security (Future):**
- **Device Binding**: Hardware-based authentication
- **Biometric Authentication**: WebAuthn integration
- **Time-based Tokens**: TOTP for critical operations

### Access Control

**Wallet Access Levels:**
```typescript
enum WalletPermission {
  READ_ONLY = 'read',      // View balance and transactions
  SIGN_TRANSACTIONS = 'sign', // Sign and submit transactions
  FULL_ACCESS = 'full',    // All operations including export
}
```

**Platform Isolation:**
- Each `platformId` creates isolated wallet namespace
- Cross-platform access requires explicit permission
- Audit logs track all cross-platform operations

## 🛡️ Browser Security

### Content Security Policy (CSP)

```http
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval';
  connect-src 'self' https://horizon.stellar.org https://horizon-testnet.stellar.org;
  img-src 'self' data: https:;
  style-src 'self' 'unsafe-inline';
  font-src 'self' data:;
```

### Secure Context Requirements

**HTTPS Enforcement:**
- Web Crypto API requires secure context
- Service Worker requires HTTPS
- IndexedDB enhanced security in HTTPS
- Secure cookie attributes

**Browser APIs Used:**
- `crypto.subtle.*` - Web Crypto API
- `crypto.getRandomValues()` - Secure random numbers
- `IndexedDB` - Encrypted data storage
- `fetch()` with CORS - Network requests

### Input Validation & Sanitization

**Email Validation:**
```typescript
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email) && email.length <= 254;
};
```

**Passphrase Validation:**
```typescript
const validatePassphrase = (passphrase: string) => {
  const errors: string[] = [];
  
  if (passphrase.length < 12) {
    errors.push('Passphrase must be at least 12 characters long');
  }
  
  if (!/[A-Z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one lowercase letter');
  }
  
  if (!/[0-9]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one number');
  }
  
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
    errors.push('Passphrase must contain at least one special character');
  }
  
  return { isValid: errors.length === 0, errors };
};
```

## 📊 Audit & Monitoring

### Security Event Logging

**Logged Events:**
```typescript
interface SecurityEvent {
  id: string;
  walletId: string;
  operation: 'create' | 'recover' | 'sign' | 'balance' | 'delete';
  timestamp: string;
  platformId: string;
  ipAddress: string;      // Client IP (if available)
  userAgent: string;      // Browser fingerprint
  success: boolean;
  errorCode?: string;
  metadata?: {
    transactionHash?: string;
    networkUsed?: string;
    operationDuration?: number;
  };
}
```

**Audit Trail Features:**
- **Immutable Logs**: Append-only audit trail
- **Cryptographic Integrity**: Signed log entries (future)
- **Retention Policy**: Configurable log retention
- **Privacy Compliance**: No sensitive data in logs

### Security Monitoring

**Anomaly Detection:**
- Multiple failed authentication attempts
- Unusual transaction patterns
- Cross-platform access attempts
- High-frequency operations

**Alerting Thresholds:**
```typescript
const SECURITY_THRESHOLDS = {
  maxFailedAttempts: 5,        // Lock after 5 failed attempts
  maxTransactionsPerHour: 100, // Rate limiting
  maxWalletsPerPlatform: 1000, // Platform limits
  suspiciousPatternScore: 80,  // ML-based scoring
};
```

## 🔒 Network Security

### Stellar Network Integration

**Transaction Security:**
- **Sequence Numbers**: Prevents replay attacks
- **Time Bounds**: Limits transaction validity window
- **Multi-Signature**: Supports complex authorization schemes
- **Memo Fields**: Encrypted communication (optional)

**Network Communication:**
```typescript
// All network requests use HTTPS
const NETWORK_CONFIG = {
  testnet: {
    horizonUrl: 'https://horizon-testnet.stellar.org',
    networkPassphrase: Networks.TESTNET,
  },
  mainnet: {
    horizonUrl: 'https://horizon.stellar.org',
    networkPassphrase: Networks.PUBLIC,
  },
};
```

### API Security

**Request Authentication:**
- Platform ID validation
- Rate limiting per platform
- Request signing (future enhancement)
- IP whitelisting (enterprise feature)

**Response Security:**
- No sensitive data in responses
- Proper error handling (no information leakage)
- CORS headers configured
- Response size limits

## 🚨 Incident Response

### Security Incident Classification

**Severity Levels:**
1. **Critical**: Private key exposure, mass account compromise
2. **High**: Authentication bypass, privilege escalation
3. **Medium**: Data leakage, service disruption
4. **Low**: Minor vulnerabilities, configuration issues

### Response Procedures

**Immediate Actions:**
1. **Isolate**: Disable affected components
2. **Assess**: Determine scope and impact
3. **Notify**: Alert security team and users
4. **Mitigate**: Apply temporary fixes
5. **Investigate**: Root cause analysis
6. **Remediate**: Permanent solution
7. **Review**: Post-incident analysis

### Recovery Procedures

**Wallet Recovery Options:**
1. **Standard Recovery**: Email + passphrase
2. **Emergency Recovery**: Multi-factor authentication (future)
3. **Social Recovery**: Trusted contacts (future)
4. **Hardware Recovery**: Hardware security module (enterprise)

## 📋 Security Compliance

### Standards Compliance

**Cryptographic Standards:**
- **FIPS 140-2**: Federal cryptographic standards
- **NIST SP 800-63B**: Digital identity guidelines
- **RFC 5869**: HMAC-based key derivation
- **RFC 3394**: AES key wrapping

**Security Frameworks:**
- **OWASP Top 10**: Web application security
- **CIS Controls**: Cybersecurity best practices
- **ISO 27001**: Information security management
- **SOC 2 Type II**: Security controls audit (planned)

### Privacy Compliance

**Data Protection:**
- **GDPR**: European data protection regulation
- **CCPA**: California consumer privacy act
- **PIPEDA**: Canadian privacy legislation
- **Data Minimization**: Collect only necessary data

**User Rights:**
- **Right to Access**: Export wallet data
- **Right to Deletion**: Secure wallet deletion
- **Right to Portability**: Wallet export/import
- **Right to Rectification**: Update user information

## ⚠️ Security Recommendations

### For Developers

1. **Never Log Secrets**: Passphrases, private keys, or derived keys
2. **Validate All Inputs**: Email, passphrases, transaction data
3. **Use Secure Defaults**: Enable all security features by default
4. **Regular Updates**: Keep dependencies current
5. **Security Testing**: Regular penetration testing
6. **Code Reviews**: Security-focused code reviews

### For Users

1. **Strong Passphrases**: Use unique, complex passphrases
2. **Secure Devices**: Keep devices updated and secure
3. **Network Security**: Avoid public Wi-Fi for sensitive operations
4. **Phishing Awareness**: Verify domain before entering credentials
5. **Regular Backups**: Keep secure backup of recovery information
6. **Monitor Activity**: Review transaction history regularly

### For Platforms

1. **Platform ID Security**: Keep platform IDs confidential
2. **Rate Limiting**: Implement appropriate rate limits
3. **User Education**: Provide security guidance to users
4. **Incident Planning**: Have incident response procedures
5. **Regular Audits**: Conduct security assessments
6. **Compliance**: Meet relevant regulatory requirements

## 🔮 Future Security Enhancements

### Planned Features

1. **Hardware Security Modules (HSM)**: Enterprise-grade key protection
2. **Multi-Signature Wallets**: Shared control mechanisms
3. **Biometric Authentication**: WebAuthn integration
4. **Zero-Knowledge Proofs**: Enhanced privacy features
5. **Quantum-Resistant Cryptography**: Post-quantum security
6. **Decentralized Identity**: Self-sovereign identity integration

### Research Areas

1. **Homomorphic Encryption**: Computation on encrypted data
2. **Secure Multi-Party Computation**: Distributed key management
3. **Threshold Cryptography**: Distributed signing schemes
4. **Privacy-Preserving Analytics**: Secure usage metrics
5. **Formal Verification**: Mathematical security proofs
