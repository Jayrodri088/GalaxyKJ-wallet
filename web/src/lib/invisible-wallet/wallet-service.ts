/**
 * Invisible Wallet Service
 * 
 * Core service that manages wallet creation, recovery, and signing operations
 * while abstracting Stellar blockchain complexity from end users.
 */

import { Keypair, Networks, Horizon, TransactionBuilder } from '@stellar/stellar-sdk';
import { 
  InvisibleWallet, 
  CreateWalletRequest, 
  RecoverWalletRequest, 
  WalletResponse,
  WalletCreationResponse,
  WalletWithBalance,
  SignTransactionRequest,
  SignTransactionResponse,
  NetworkType,
  InvisibleWalletError,
  AuditLogEntry,
  StellarBalance
} from '@/types/invisible-wallet';
import { CryptoService } from './crypto-service';

/**
 * Configuration for Stellar networks
 */
const STELLAR_NETWORKS = {
  testnet: {
    horizonURL: 'https://horizon-testnet.stellar.org',
    friendbotURL: 'https://friendbot.stellar.org',
    networkPassphrase: Networks.TESTNET,
  },
  mainnet: {
    horizonURL: 'https://horizon.stellar.org',
    friendbotURL: '',
    networkPassphrase: Networks.PUBLIC,
  },
} as const;

/**
 * Storage interface for wallet persistence
 */
export interface WalletStorage {
  saveWallet(wallet: InvisibleWallet): Promise<void>;
  getWallet(email: string, platformId: string, network: NetworkType): Promise<InvisibleWallet | null>;
  getWalletById(id: string): Promise<InvisibleWallet | null>;
  updateWalletAccess(id: string): Promise<void>;
  saveAuditLog(entry: AuditLogEntry): Promise<void>;
  deleteWallet(id: string): Promise<void>;
}

/**
 * In-memory storage implementation for development/testing
 */
class MemoryWalletStorage implements WalletStorage {
  private wallets = new Map<string, InvisibleWallet>();
  private auditLogs: AuditLogEntry[] = [];

  async saveWallet(wallet: InvisibleWallet): Promise<void> {
    const key = `${wallet.email}-${wallet.platformId}-${wallet.network}`;
    this.wallets.set(key, wallet);
  }

  async getWallet(email: string, platformId: string, network: NetworkType): Promise<InvisibleWallet | null> {
    const key = `${email}-${platformId}-${network}`;
    return this.wallets.get(key) || null;
  }

  async getWalletById(id: string): Promise<InvisibleWallet | null> {
    for (const wallet of this.wallets.values()) {
      if (wallet.id === id) return wallet;
    }
    return null;
  }

  async updateWalletAccess(id: string): Promise<void> {
    for (const [key, wallet] of this.wallets.entries()) {
      if (wallet.id === id) {
        wallet.lastAccessedAt = new Date().toISOString();
        this.wallets.set(key, wallet);
        break;
      }
    }
  }

  async saveAuditLog(entry: AuditLogEntry): Promise<void> {
    this.auditLogs.push(entry);
    // Keep only last 1000 entries
    if (this.auditLogs.length > 1000) {
      this.auditLogs = this.auditLogs.slice(-1000);
    }
  }

  async deleteWallet(id: string): Promise<void> {
    for (const [key, wallet] of this.wallets.entries()) {
      if (wallet.id === id) {
        this.wallets.delete(key);
        break;
      }
    }
  }
}

/**
 * Main Invisible Wallet Service
 */
export class InvisibleWalletService {
  private storage: WalletStorage;

  constructor(storage?: WalletStorage) {
    this.storage = storage || new MemoryWalletStorage();
  }

  /**
   * Creates a new invisible wallet for a user
   */
  async createWallet(request: CreateWalletRequest): Promise<WalletResponse> {
    try {
      // Validate request
      this.validateCreateRequest(request);

      // Check if wallet already exists
      const existingWallet = await this.storage.getWallet(
        request.email, 
        request.platformId, 
        request.network
      );

      if (existingWallet) {
        throw new Error(InvisibleWalletError.WALLET_ALREADY_EXISTS);
      }

      // Generate new Stellar keypair
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();

      // Encrypt the private key
      const encryptionResult = await CryptoService.encryptPrivateKey(
        secretKey, 
        request.passphrase
      );

      // Create wallet object
      const wallet: InvisibleWallet = {
        id: CryptoService.generateSecureId(),
        email: request.email,
        publicKey: publicKey,
        encryptedSecret: encryptionResult.ciphertext,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        platformId: request.platformId,
        network: request.network,
        status: 'active',
        createdAt: new Date().toISOString(),
        metadata: request.metadata,
      };

      // Save wallet to storage
      await this.storage.saveWallet(wallet);

      // Fund account if on testnet
      if (request.network === 'testnet') {
        await this.fundTestnetAccount(publicKey);
      }

      // Log audit entry
      await this.logAuditEntry({
        id: CryptoService.generateSecureId(),
        walletId: wallet.id,
        operation: 'create',
        timestamp: new Date().toISOString(),
        platformId: request.platformId,
        ipAddress: 'unknown', // Should be passed from request context
        userAgent: 'unknown', // Should be passed from request context
        success: true,
      });

      // Return wallet response (without sensitive data)
      return this.toWalletResponse(wallet);

    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  /**
   * Creates a new invisible wallet and returns complete information (for demo purposes only)
   * WARNING: This method exposes the private key and should only be used for demos/development
   */
  async createWalletWithKeys(request: CreateWalletRequest): Promise<WalletCreationResponse> {
    try {
      // Validate request
      this.validateCreateRequest(request);

      // Check if wallet already exists
      const existingWallet = await this.storage.getWallet(
        request.email, 
        request.platformId, 
        request.network
      );

      if (existingWallet) {
        throw new Error(InvisibleWalletError.WALLET_ALREADY_EXISTS);
      }

      // Generate new Stellar keypair
      const keypair = Keypair.random();
      const publicKey = keypair.publicKey();
      const secretKey = keypair.secret();

      // Encrypt the private key
      const encryptionResult = await CryptoService.encryptPrivateKey(
        secretKey, 
        request.passphrase
      );

      // Create wallet object
      const wallet: InvisibleWallet = {
        id: CryptoService.generateSecureId(),
        email: request.email,
        publicKey: publicKey,
        encryptedSecret: encryptionResult.ciphertext,
        salt: encryptionResult.salt,
        iv: encryptionResult.iv,
        platformId: request.platformId,
        network: request.network,
        status: 'active',
        createdAt: new Date().toISOString(),
        metadata: request.metadata,
      };

      // Save wallet to storage
      await this.storage.saveWallet(wallet);

      // Fund account if on testnet
      if (request.network === 'testnet') {
        await this.fundTestnetAccount(publicKey);
      }

      // Log audit entry
      await this.logAuditEntry({
        id: CryptoService.generateSecureId(),
        walletId: wallet.id,
        operation: 'create',
        timestamp: new Date().toISOString(),
        platformId: request.platformId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
      });

      // Return wallet response with private key (for demo only)
      return {
        ...this.toWalletResponse(wallet),
        secretKey: secretKey, // WARNING: Only for demo purposes
      };

    } catch (error) {
      console.error('Failed to create wallet:', error);
      throw error;
    }
  }

  /**
   * Recovers an existing invisible wallet
   */
  async recoverWallet(request: RecoverWalletRequest): Promise<WalletResponse> {
    try {
      // Validate request
      this.validateRecoverRequest(request);

      // Find existing wallet
      const wallet = await this.storage.getWallet(
        request.email,
        request.platformId,
        request.network
      );

      if (!wallet) {
        throw new Error(InvisibleWalletError.WALLET_NOT_FOUND);
      }

      // Attempt to decrypt private key to verify passphrase
      const decryptionInput = {
        ciphertext: wallet.encryptedSecret,
        salt: wallet.salt,
        iv: wallet.iv,
        metadata: {
          algorithm: 'AES-256-GCM' as const,
          keyDerivation: 'PBKDF2' as const,
          iterations: 100000,
          saltLength: 32,
          ivLength: 16,
        },
      };

      try {
        await CryptoService.decryptPrivateKey(decryptionInput, request.passphrase);
      } catch {
        await this.logAuditEntry({
          id: CryptoService.generateSecureId(),
          walletId: wallet.id,
          operation: 'recover',
          timestamp: new Date().toISOString(),
          platformId: request.platformId,
          ipAddress: 'unknown',
          userAgent: 'unknown',
          success: false,
          error: 'Invalid passphrase',
        });
        throw new Error(InvisibleWalletError.INVALID_PASSPHRASE);
      }

      // Update last accessed time
      await this.storage.updateWalletAccess(wallet.id);

      // Log successful recovery
      await this.logAuditEntry({
        id: CryptoService.generateSecureId(),
        walletId: wallet.id,
        operation: 'recover',
        timestamp: new Date().toISOString(),
        platformId: request.platformId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
      });

      return this.toWalletResponse(wallet);

    } catch (error) {
      console.error('Failed to recover wallet:', error);
      throw error;
    }
  }

  /**
   * Signs a Stellar transaction with the wallet's private key
   */
  async signTransaction(request: SignTransactionRequest): Promise<SignTransactionResponse> {
    try {
      // Find wallet
      const wallet = await this.storage.getWalletById(request.walletId);
      
      if (!wallet) {
        throw new Error(InvisibleWalletError.WALLET_NOT_FOUND);
      }

      // Verify platform access
      if (wallet.platformId !== request.platformId) {
        throw new Error(InvisibleWalletError.UNAUTHORIZED_ORIGIN);
      }

      // Verify email
      if (wallet.email !== request.email) {
        throw new Error(InvisibleWalletError.WALLET_NOT_FOUND);
      }

      // Decrypt private key
      const decryptionInput = {
        ciphertext: wallet.encryptedSecret,
        salt: wallet.salt,
        iv: wallet.iv,
        metadata: {
          algorithm: 'AES-256-GCM' as const,
          keyDerivation: 'PBKDF2' as const,
          iterations: 100000,
          saltLength: 32,
          ivLength: 16,
        },
      };

      let privateKey: string;
      try {
        privateKey = await CryptoService.decryptPrivateKey(decryptionInput, request.passphrase);
      } catch {
        await this.logAuditEntry({
          id: CryptoService.generateSecureId(),
          walletId: wallet.id,
          operation: 'sign',
          timestamp: new Date().toISOString(),
          platformId: request.platformId,
          ipAddress: 'unknown',
          userAgent: 'unknown',
          success: false,
          error: 'Invalid passphrase',
        });
        throw new Error(InvisibleWalletError.INVALID_PASSPHRASE);
      }

      // Parse and sign transaction
      const networkConfig = STELLAR_NETWORKS[wallet.network];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let transaction: any;
      
      try {
        transaction = TransactionBuilder.fromXDR(
          request.transactionXDR,
          networkConfig.networkPassphrase
        );
      } catch {
        throw new Error(InvisibleWalletError.INVALID_TRANSACTION_XDR);
      }

      // Sign with wallet keypair
      const keypair = Keypair.fromSecret(privateKey);
      transaction.sign(keypair);

      const signedXDR = transaction.toXDR();
      const transactionHash = transaction.hash().toString('hex');

      // Update last accessed time
      await this.storage.updateWalletAccess(wallet.id);

      // Log successful signing
      await this.logAuditEntry({
        id: CryptoService.generateSecureId(),
        walletId: wallet.id,
        operation: 'sign',
        timestamp: new Date().toISOString(),
        platformId: request.platformId,
        ipAddress: 'unknown',
        userAgent: 'unknown',
        success: true,
        metadata: { transactionHash },
      });

      return {
        signedXDR,
        transactionHash,
        success: true,
      };

    } catch (error) {
      console.error('Failed to sign transaction:', error);
      return {
        signedXDR: '',
        transactionHash: '',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Gets wallet information with Stellar account balance
   */
  async getWalletWithBalance(
    email: string,
    platformId: string,
    network: NetworkType
  ): Promise<WalletWithBalance | null> {
    try {
      const wallet = await this.storage.getWallet(email, platformId, network);
      
      if (!wallet) {
        return null;
      }

      // Get Stellar account information
      const networkConfig = STELLAR_NETWORKS[network];
      const server = new Horizon.Server(networkConfig.horizonURL);

      let balances: StellarBalance[] = [];
      let sequence = '0';
      let accountExists = false;

      try {
        const account = await server.loadAccount(wallet.publicKey);
        accountExists = true;
        sequence = account.sequence;
        
        balances = account.balances.map(balance => ({
          balance: balance.balance,
          assetType: balance.asset_type,
          assetCode: balance.asset_type === 'native' ? 'XLM' : (balance as unknown as Record<string, unknown>).asset_code as string,
          assetIssuer: balance.asset_type === 'native' ? undefined : (balance as unknown as Record<string, unknown>).asset_issuer as string,
        }));
      } catch {
        // Account doesn't exist yet
        accountExists = false;
      }

      return {
        ...this.toWalletResponse(wallet),
        balances,
        sequence,
        accountExists,
      };

    } catch (error) {
      console.error('Failed to get wallet with balance:', error);
      return null;
    }
  }

  /**
   * Funds a testnet account using Friendbot
   */
  private async fundTestnetAccount(publicKey: string): Promise<void> {
    try {
      const friendbotURL = STELLAR_NETWORKS.testnet.friendbotURL;
      const response = await fetch(`${friendbotURL}?addr=${publicKey}`);
      
      if (!response.ok) {
        console.warn('Failed to fund testnet account:', await response.text());
      }
    } catch (error) {
      console.warn('Friendbot funding failed:', error);
    }
  }

  /**
   * Validates wallet creation request
   */
  private validateCreateRequest(request: CreateWalletRequest): void {
    if (!request.email || !this.isValidEmail(request.email)) {
      throw new Error(InvisibleWalletError.INVALID_EMAIL);
    }

    if (!request.passphrase) {
      throw new Error(InvisibleWalletError.INVALID_PASSPHRASE_STRENGTH);
    }

    if (!request.platformId) {
      throw new Error('Platform ID is required');
    }

    if (!['testnet', 'mainnet'].includes(request.network)) {
      throw new Error(InvisibleWalletError.INVALID_NETWORK);
    }
  }

  /**
   * Validates wallet recovery request
   */
  private validateRecoverRequest(request: RecoverWalletRequest): void {
    if (!request.email || !this.isValidEmail(request.email)) {
      throw new Error(InvisibleWalletError.INVALID_EMAIL);
    }

    if (!request.passphrase) {
      throw new Error('Passphrase is required');
    }

    if (!request.platformId) {
      throw new Error('Platform ID is required');
    }

    if (!['testnet', 'mainnet'].includes(request.network)) {
      throw new Error(InvisibleWalletError.INVALID_NETWORK);
    }
  }

  /**
   * Validates email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Converts wallet to response format (removes sensitive data)
   */
  private toWalletResponse(wallet: InvisibleWallet): WalletResponse {
    return {
      id: wallet.id,
      email: wallet.email,
      publicKey: wallet.publicKey,
      platformId: wallet.platformId,
      network: wallet.network,
      status: wallet.status,
      createdAt: wallet.createdAt,
      lastAccessedAt: wallet.lastAccessedAt,
      metadata: wallet.metadata,
    };
  }

  /**
   * Logs audit entry
   */
  private async logAuditEntry(entry: AuditLogEntry): Promise<void> {
    try {
      await this.storage.saveAuditLog(entry);
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }
}
