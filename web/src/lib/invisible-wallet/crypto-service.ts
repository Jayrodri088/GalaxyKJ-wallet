/**
 * Enhanced Cryptographic Service for Invisible Wallets
 * 
 * Implements AES-256-GCM encryption with PBKDF2 key derivation
 * following the security requirements specified in the architecture.
 */

import { EncryptionMetadata, InvisibleWalletError } from '@/types/invisible-wallet';

export interface EncryptionResult {
  ciphertext: string; // Base64 encoded
  salt: string; // Base64 encoded
  iv: string; // Base64 encoded
  metadata: EncryptionMetadata;
}

export interface DecryptionInput {
  ciphertext: string;
  salt: string;
  iv: string;
  metadata: EncryptionMetadata;
}

/**
 * Enhanced cryptographic service with security optimizations
 */
export class CryptoService {
  private static readonly ENCRYPTION_ALGORITHM = 'AES-GCM';
  private static readonly KEY_DERIVATION_ALGORITHM = 'PBKDF2';
  private static readonly HASH_ALGORITHM = 'SHA-256';
  private static readonly KEY_LENGTH = 256;
  private static readonly ITERATIONS = 100000; // Minimum recommended iterations
  private static readonly SALT_LENGTH = 32; // 32 bytes for maximum security
  private static readonly IV_LENGTH = 16; // 16 bytes for AES-GCM

  /**
   * Validates passphrase strength according to security requirements
   */
  public static validatePassphraseStrength(passphrase: string): { 
    isValid: boolean; 
    errors: string[] 
  } {
    const errors: string[] = [];
    
    if (passphrase.length < 8) {
      errors.push('Passphrase must be at least 8 characters long');
    }
    
    if (passphrase.length > 128) {
      errors.push('Passphrase must not exceed 128 characters');
    }
    
    if (!/[a-z]/.test(passphrase)) {
      errors.push('Passphrase must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(passphrase)) {
      errors.push('Passphrase must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(passphrase)) {
      errors.push('Passphrase must contain at least one number');
    }
    
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(passphrase)) {
      errors.push('Passphrase must contain at least one special character');
    }
    
    // Check for common weak patterns
    const commonPatterns = [
      'password', '123456', 'qwerty', 'abc123', 'admin', 'user',
      'test', 'guest', 'demo', '111111', '000000'
    ];
    
    const lowerPassphrase = passphrase.toLowerCase();
    for (const pattern of commonPatterns) {
      if (lowerPassphrase.includes(pattern)) {
        errors.push(`Passphrase must not contain common patterns like "${pattern}"`);
        break;
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Encrypts a private key using AES-256-GCM with PBKDF2 key derivation
   * 
   * @param privateKey - Stellar private key to encrypt
   * @param passphrase - User passphrase for encryption
   * @returns Promise resolving to encryption result with metadata
   */
  public static async encryptPrivateKey(
    privateKey: string, 
    passphrase: string
  ): Promise<EncryptionResult> {
    // Validate inputs
    if (!privateKey || !passphrase) {
      throw new Error(InvisibleWalletError.INVALID_ENCRYPTION_DATA);
    }
    
    // Validate passphrase strength
    const validation = this.validatePassphraseStrength(passphrase);
    if (!validation.isValid) {
      throw new Error(`${InvisibleWalletError.INVALID_PASSPHRASE_STRENGTH}: ${validation.errors.join(', ')}`);
    }

    const enc = new TextEncoder();
    let keyMaterial: CryptoKey | null = null;
    let derivedKey: CryptoKey | null = null;
    let passphraseBytes: Uint8Array | null = null;
    let privateKeyBytes: Uint8Array | null = null;

    try {
      // Generate cryptographically secure salt and IV
      const salt = crypto.getRandomValues(new Uint8Array(this.SALT_LENGTH));
      const iv = crypto.getRandomValues(new Uint8Array(this.IV_LENGTH));

      // Convert inputs to bytes
      passphraseBytes = enc.encode(passphrase);
      privateKeyBytes = enc.encode(privateKey);

      // Import passphrase as key material
      keyMaterial = await crypto.subtle.importKey(
        'raw',
        passphraseBytes,
        { name: this.KEY_DERIVATION_ALGORITHM },
        false,
        ['deriveKey']
      );

      // Derive encryption key using PBKDF2
      derivedKey = await crypto.subtle.deriveKey(
        {
          name: this.KEY_DERIVATION_ALGORITHM,
          salt: salt,
          iterations: this.ITERATIONS,
          hash: this.HASH_ALGORITHM,
        },
        keyMaterial,
        {
          name: this.ENCRYPTION_ALGORITHM,
          length: this.KEY_LENGTH,
        },
        false,
        ['encrypt']
      );

      // Encrypt the private key
      const ciphertext = await crypto.subtle.encrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv: iv,
        },
        derivedKey,
        privateKeyBytes
      );

      // Convert to base64 for storage
      const result: EncryptionResult = {
        ciphertext: this.arrayBufferToBase64(ciphertext),
        salt: this.uint8ArrayToBase64(salt),
        iv: this.uint8ArrayToBase64(iv),
        metadata: {
          algorithm: 'AES-256-GCM',
          keyDerivation: 'PBKDF2',
          iterations: this.ITERATIONS,
          saltLength: this.SALT_LENGTH,
          ivLength: this.IV_LENGTH,
        },
      };

      return result;

    } catch (error) {
      console.error('Encryption failed:', error);
      throw new Error(InvisibleWalletError.ENCRYPTION_FAILED);
    } finally {
      // Secure cleanup
      this.secureCleanup([passphraseBytes, privateKeyBytes]);
      keyMaterial = null;
      derivedKey = null;
    }
  }

  /**
   * Decrypts a private key using the stored encryption metadata
   * 
   * @param encryptionData - Encrypted data with metadata
   * @param passphrase - User passphrase for decryption
   * @returns Promise resolving to decrypted private key
   */
  public static async decryptPrivateKey(
    encryptionData: DecryptionInput,
    passphrase: string
  ): Promise<string> {
    if (!encryptionData || !passphrase) {
      throw new Error(InvisibleWalletError.INVALID_ENCRYPTION_DATA);
    }

    const enc = new TextEncoder();
    const dec = new TextDecoder();
    let keyMaterial: CryptoKey | null = null;
    let derivedKey: CryptoKey | null = null;
    let passphraseBytes: Uint8Array | null = null;

    try {
      // Convert base64 data back to bytes
      const salt = this.base64ToUint8Array(encryptionData.salt);
      const iv = this.base64ToUint8Array(encryptionData.iv);
      const ciphertext = this.base64ToArrayBuffer(encryptionData.ciphertext);

      // Validate metadata
      if (encryptionData.metadata.algorithm !== 'AES-256-GCM' ||
          encryptionData.metadata.keyDerivation !== 'PBKDF2') {
        throw new Error('Unsupported encryption algorithm');
      }

      passphraseBytes = enc.encode(passphrase);

      // Import passphrase as key material
      keyMaterial = await crypto.subtle.importKey(
        'raw',
        passphraseBytes,
        { name: this.KEY_DERIVATION_ALGORITHM },
        false,
        ['deriveKey']
      );

      // Derive decryption key using the same parameters
      derivedKey = await crypto.subtle.deriveKey(
        {
          name: this.KEY_DERIVATION_ALGORITHM,
          salt: salt,
          iterations: encryptionData.metadata.iterations,
          hash: this.HASH_ALGORITHM,
        },
        keyMaterial,
        {
          name: this.ENCRYPTION_ALGORITHM,
          length: this.KEY_LENGTH,
        },
        false,
        ['decrypt']
      );

      // Decrypt the private key
      const decryptedBytes = await crypto.subtle.decrypt(
        {
          name: this.ENCRYPTION_ALGORITHM,
          iv: iv,
        },
        derivedKey,
        ciphertext
      );

      const privateKey = dec.decode(decryptedBytes);

      // Secure cleanup of decrypted data
      new Uint8Array(decryptedBytes).fill(0);

      return privateKey;

    } catch (error) {
      console.error('Decryption failed:', error);
      if (error instanceof Error && error.name === 'OperationError') {
        throw new Error(InvisibleWalletError.INVALID_PASSPHRASE);
      }
      throw new Error(InvisibleWalletError.DECRYPTION_FAILED);
    } finally {
      // Secure cleanup
      this.secureCleanup([passphraseBytes]);
      keyMaterial = null;
      derivedKey = null;
    }
  }

  /**
   * Generates a cryptographically secure random string for wallet IDs
   */
  public static generateSecureId(length: number = 32): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return this.uint8ArrayToBase64(array)
      .replace(/[+/]/g, '')
      .substring(0, length);
  }

  /**
   * Hashes a string using SHA-256 (for rate limiting, audit logs, etc.)
   */
  public static async hashString(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return this.arrayBufferToBase64(hashBuffer);
  }

  // Utility methods for encoding conversions
  private static arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer);
    return btoa(String.fromCharCode(...bytes));
  }

  private static base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  private static uint8ArrayToBase64(array: Uint8Array): string {
    return btoa(String.fromCharCode(...array));
  }

  private static base64ToUint8Array(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  /**
   * Securely clears sensitive data from memory
   */
  private static secureCleanup(arrays: (Uint8Array | null)[]): void {
    arrays.forEach(array => {
      if (array) {
        array.fill(0);
      }
    });

    // Attempt garbage collection if available
    if (typeof global !== 'undefined' && global.gc) {
      global.gc();
    }
  }
}
