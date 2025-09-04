import {
  Keypair,
  TransactionBuilder,
  Operation,
  Asset,
  Memo,
  Horizon,
} from "@stellar/stellar-sdk";
import * as StellarSdk from "@stellar/stellar-sdk";
import { STELLAR_CONFIG } from "@/lib/stellar/config";

export interface StellarAsset {
  code: string;
  issuer?: string;
  type: 'native' | 'credit_alphanum4' | 'credit_alphanum12';
}

export interface ConversionRate {
  rate: string;
  path?: StellarAsset[];
  updated: Date;
}

export interface ConversionEstimate {
  sourceAmount: string;
  destinationAmount: string;
  rate: string;
  path?: StellarAsset[];
  fee: string;
  estimatedTime: number;
}

export interface ConversionResult {
  success: boolean;
  hash?: string;
  error?: string;
}

export interface TrustlineInfo {
  asset: StellarAsset;
  exists: boolean;
  balance?: string;
  limit?: string;
}

// Stellar testnet asset definitions for common tokens
export const STELLAR_ASSETS: Record<string, StellarAsset> = {
  xlm: {
    code: 'XLM',
    type: 'native'
  },
  usdc: {
    code: 'USDC',
    issuer: 'GBBD47IF6LWK7P7MDEVSCWR7DPUWV3NY3DTQEVFL4NAT4AQH3ZLLFLA5',
    type: 'credit_alphanum4'
  },
  btc: {
    code: 'BTC',
    issuer: 'GATEMHCCKCY67ZUCKTROYN24ZYT5GK4EQZ65JJLDHKHRUZI3EUEKMTCH',
    type: 'credit_alphanum4'
  },
  eth: {
    code: 'ETH',
    issuer: 'GBVOL67TMUQBGL4TZYNMY3ZQ5WGQYFPFD5VJRWXR72VA33VFNL225PL5',
    type: 'credit_alphanum4'
  }
};

export class StellarConversionService {
  private server: Horizon.Server;

  constructor() {
    // Configure server with timeout and retry options
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonURL, {
      allowHttp: false, // Only allow HTTPS
    });
    
    console.log('🌐 Stellar server initialized with config:', {
      horizonURL: STELLAR_CONFIG.horizonURL,
      networkPassphrase: STELLAR_CONFIG.networkPassphrase
    });
  }

  private createAsset(stellarAsset: StellarAsset): Asset {
    if (stellarAsset.type === 'native') {
      return Asset.native();
    }
    
    // Validate that issuer is defined for non-native assets
    if (!stellarAsset.issuer) {
      throw new Error(`Asset ${stellarAsset.code} is missing required issuer address. Non-native assets must have a valid issuer.`);
    }
    
    return new Asset(stellarAsset.code, stellarAsset.issuer);
  }

  // Type guard to check if a balance object has a limit property
  private hasLimit(balance: unknown): balance is { limit: string } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return Boolean(balance && typeof balance === 'object' && 'limit' in balance && typeof (balance as any).limit === 'string');
  }

  /**
   * Helper function to add timeout to any promise
   */
  private async withTimeout<T>(promise: Promise<T>, timeoutMs: number = 30000): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
    });
    
    return Promise.race([promise, timeoutPromise]);
  }

  /**
   * Retry mechanism for network operations with exponential backoff
   */
  private async withRetry<T>(
    operation: () => Promise<T>,
    operationName: string,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    timeoutMs: number = 30000
  ): Promise<T> {
    let lastError: Error;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ${operationName} attempt ${attempt + 1}/${maxRetries + 1}`);
        
        // Add a small delay between retries to avoid overwhelming the network
        if (attempt > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
        
        return await this.withTimeout(operation(), timeoutMs);
      } catch (error) {
        // Enhanced error capture and logging
        console.log('🔍 Raw error caught:', error);
        console.log('🔍 Error type:', typeof error);
        console.log('🔍 Error constructor:', error?.constructor?.name);
        
        if (error instanceof Error) {
          lastError = error;
        } else if (typeof error === 'string') {
          lastError = new Error(error);
        } else if (error && typeof error === 'object') {
          // Handle AxiosError or other object-like errors
          const errorObj = error as any;
          lastError = new Error(errorObj.message || errorObj.error || JSON.stringify(errorObj));
          // Copy additional properties
          if (errorObj.response) {
            console.log('🔍 Response data:', errorObj.response.data);
            console.log('🔍 Response status:', errorObj.response.status);
            console.log('🔍 Response headers:', errorObj.response.headers);
          }
          if (errorObj.request) {
            console.log('🔍 Request details:', errorObj.request);
          }
          if (errorObj.config) {
            console.log('🔍 Request config:', {
              url: errorObj.config.url,
              method: errorObj.config.method,
              timeout: errorObj.config.timeout,
              headers: errorObj.config.headers
            });
          }
        } else {
          lastError = new Error(String(error));
        }
        
        // Enhanced error logging for debugging
        console.error(`🔴 ${operationName} attempt ${attempt + 1} failed:`, {
          error: lastError.message,
          stack: lastError.stack,
          name: lastError.name,
          operation: operationName,
          attempt: attempt + 1,
          maxRetries,
          timestamp: new Date().toISOString(),
          rawError: error
        });
        
        if (attempt === maxRetries) {
          console.error(`❌ ${operationName} failed after ${maxRetries + 1} attempts:`, {
            finalError: lastError.message,
            operation: operationName,
            timestamp: new Date().toISOString(),
            fullError: lastError
          });
          throw lastError;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        console.warn(`⚠️ ${operationName} attempt ${attempt + 1} failed, retrying in ${delay}ms:`, lastError.message);
        
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
    
    throw lastError!;
  }

  /**
   * Check Stellar network connectivity
   */
  async checkNetworkConnectivity(): Promise<{
    connected: boolean;
    error?: string;
    details?: any;
  }> {
    try {
      console.log('🌐 Checking Stellar network connectivity...');
      console.log('📍 Horizon URL:', STELLAR_CONFIG.horizonURL);
      
      // Use a simple fetch to test connectivity instead of loading a dummy account
      const response = await fetch(STELLAR_CONFIG.horizonURL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      console.log('✅ Stellar network is accessible');
      return { connected: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown network error';
      const errorDetails = {
        message: errorMessage,
        name: error instanceof Error ? error.name : 'Unknown',
        stack: error instanceof Error ? error.stack : undefined,
        horizonUrl: STELLAR_CONFIG.horizonURL,
        timestamp: new Date().toISOString()
      };
      
      console.error('❌ Stellar network connectivity check failed:', errorDetails);
      
      return { 
        connected: false, 
        error: `Network connectivity issue: ${errorMessage}. Please check your internet connection and try again.`,
        details: errorDetails
      };
    }
  }

  /**
   * Comprehensive network diagnostic to identify specific issues
   */
  async runNetworkDiagnostic(): Promise<{
    overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    tests: Array<{
      name: string;
      status: 'pass' | 'fail';
      duration: number;
      error?: string;
    }>;
    summary: string;
    browserInfo?: {
      userAgent: string;
      corsSupported: boolean;
      fetchSupported: boolean;
    };
  }> {
    const tests: Array<{
      name: string;
      status: 'pass' | 'fail';
      duration: number;
      error?: string;
    }> = [];

    console.log('🔍 Running comprehensive network diagnostic...');

    // Collect browser information
    const browserInfo = typeof window !== 'undefined' ? {
      userAgent: navigator.userAgent,
      corsSupported: 'withCredentials' in new XMLHttpRequest(),
      fetchSupported: typeof fetch !== 'undefined'
    } : undefined;

    // Test 1: Basic connectivity
    const startTime1 = Date.now();
    try {
      const response = await fetch(STELLAR_CONFIG.horizonURL);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      tests.push({
        name: 'Basic Connectivity',
        status: 'pass',
        duration: Date.now() - startTime1
      });
    } catch (error) {
      tests.push({
        name: 'Basic Connectivity',
        status: 'fail',
        duration: Date.now() - startTime1,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 2: Path finding (common operation)
    const startTime2 = Date.now();
    try {
      const sourceAsset = this.createAsset(STELLAR_ASSETS.xlm);
      const destAsset = this.createAsset(STELLAR_ASSETS.usdc);
      await this.server.strictSendPaths(sourceAsset, '100', [destAsset]).call();
      tests.push({
        name: 'Path Finding',
        status: 'pass',
        duration: Date.now() - startTime2
      });
    } catch (error) {
      tests.push({
        name: 'Path Finding',
        status: 'fail',
        duration: Date.now() - startTime2,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Test 3: Order book (another common operation)
    const startTime3 = Date.now();
    try {
      const sourceAsset = this.createAsset(STELLAR_ASSETS.xlm);
      const destAsset = this.createAsset(STELLAR_ASSETS.usdc);
      await this.server.orderbook(sourceAsset, destAsset).limit(5).call();
      tests.push({
        name: 'Order Book',
        status: 'pass',
        duration: Date.now() - startTime3
      });
    } catch (error) {
      tests.push({
        name: 'Order Book',
        status: 'fail',
        duration: Date.now() - startTime3,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }

    // Determine overall status
    const failedTests = tests.filter(t => t.status === 'fail');
    let overallStatus: 'healthy' | 'degraded' | 'unhealthy';
    let summary: string;

    if (failedTests.length === 0) {
      overallStatus = 'healthy';
      summary = 'All network tests passed successfully';
    } else if (failedTests.length === 1) {
      overallStatus = 'degraded';
      summary = `Network is degraded: ${failedTests[0].name} failed`;
    } else {
      overallStatus = 'unhealthy';
      summary = `Network is unhealthy: ${failedTests.length} tests failed`;
    }

    console.log('📊 Network diagnostic results:', {
      overallStatus,
      tests,
      summary
    });

    return {
      overallStatus,
      tests,
      summary
    };
  }

  async checkTrustline(accountPublicKey: string, asset: StellarAsset): Promise<TrustlineInfo> {
    try {
      const account = await this.server.loadAccount(accountPublicKey);
      
      if (asset.type === 'native') {
        const xlmBalance = account.balances.find(b => b.asset_type === 'native');
        return {
          asset,
          exists: true,
          balance: xlmBalance?.balance || '0',
          limit: undefined
        };
      }

      const trustline = account.balances.find(
        (balance) =>
          balance.asset_type !== 'native' &&
          'asset_code' in balance &&
          'asset_issuer' in balance &&
          balance.asset_code === asset.code &&
          balance.asset_issuer === asset.issuer
      );

      return {
        asset,
        exists: !!trustline,
        balance: trustline?.balance || '0',
        limit: trustline && this.hasLimit(trustline) ? trustline.limit : undefined
      };
    } catch (error: unknown) {
      // Log the error for better debugging visibility
      console.error('Error checking trustline for asset', asset.code, ':', error);
      
      // Log additional context in development mode
      if (process.env.NODE_ENV === 'development') {
        console.error('Account public key:', accountPublicKey);
        console.error('Asset details:', asset);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
      }
      
      return {
        asset,
        exists: false,
        balance: '0'
      };
    }
  }

  /**
   * Check if account exists and create it if necessary
   */
  async ensureAccountExists(secretKey: string): Promise<boolean> {
    try {
      const keypair = Keypair.fromSecret(secretKey);
      const publicKey = keypair.publicKey();
      
      console.log('🔍 Checking if account exists:', publicKey);
      
      try {
        // Try to load the account
        const account = await this.server.loadAccount(publicKey);
        console.log('✅ Account exists, sequence number:', account.sequenceNumber());
        return true;
      } catch (error) {
        if (error instanceof Error && error.message.includes('not found')) {
          console.log('📝 Account does not exist, creating new account...');
          
          // Create account using friendbot (testnet only)
          try {
            const response = await fetch(`${STELLAR_CONFIG.friendbotURL}?addr=${publicKey}`);
            if (response.ok) {
              console.log('✅ Account created successfully via friendbot');
              return true;
            } else {
              console.error('❌ Failed to create account via friendbot:', response.status);
              return false;
            }
          } catch (friendbotError) {
            console.error('❌ Friendbot error:', friendbotError);
            return false;
          }
        } else {
          console.error('❌ Error checking account:', error);
          return false;
        }
      }
    } catch (error) {
      console.error('❌ Error in ensureAccountExists:', error);
      return false;
    }
  }

  async getExchangeRate(
    sourceAsset: StellarAsset,
    destinationAsset: StellarAsset,
    sourceAmount: string
  ): Promise<ConversionRate | null> {
    try {
      const source = this.createAsset(sourceAsset);
      const destination = this.createAsset(destinationAsset);

      console.log('🔍 Fetching exchange rate for:', {
        sourceAsset: sourceAsset.code,
        destinationAsset: destinationAsset.code,
        sourceAmount
      });

      // Method 1: Try orderbook first for spot price (most reliable)
      try {
        const orderbook = await this.server.orderbook(source, destination).call();
        
        if (orderbook.bids.length > 0 && orderbook.asks.length > 0) {
          // Use the best bid/ask spread for a more accurate rate
          const bestBid = parseFloat(orderbook.bids[0].price);
          const bestAsk = parseFloat(orderbook.asks[0].price);
          const midPrice = (bestBid + bestAsk) / 2;
          
          console.log('📊 Orderbook result:', {
            bestBid,
            bestAsk,
            midPrice,
            sourceAsset: sourceAsset.code,
            destinationAsset: destinationAsset.code
          });

          return {
            rate: midPrice.toString(),
            updated: new Date()
          };
        }
      } catch (error) {
        console.warn('Orderbook failed:', error);
      }

      // Method 2: Fallback to strictSendPaths
      try {
        const pathsCallBuilder = this.server.strictSendPaths(source, sourceAmount, [destination]);
        const pathsResponse = await pathsCallBuilder.call();
        
        if (pathsResponse.records.length > 0) {
          const bestPath = pathsResponse.records[0];
          const calculatedRate = (parseFloat(bestPath.destination_amount) / parseFloat(sourceAmount)).toString();
          
          console.log('📊 StrictSendPaths result:', {
            sourceAmount,
            destinationAmount: bestPath.destination_amount,
            calculatedRate
          });

          // Validate the rate makes sense
          const rateValue = parseFloat(calculatedRate);
          if (!isNaN(rateValue) && rateValue > 0) {
            const path = bestPath.path.map((pathAsset: any) => ({
              code: pathAsset.asset_code || 'XLM',
              issuer: pathAsset.asset_issuer,
              type: pathAsset.asset_type === 'native' ? 'native' as const : 'credit_alphanum4' as const
            }));

            return {
              rate: calculatedRate,
              path: path.length > 0 ? path : undefined,
              updated: new Date()
            };
          }
        }
      } catch (error) {
        console.warn('StrictSendPaths failed:', error);
      }

      console.error('❌ All methods failed to get exchange rate');
      return null;
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      return null;
    }
  }

  async estimateConversion(
    sourceAsset: StellarAsset,
    destinationAsset: StellarAsset,
    sourceAmount: string
  ): Promise<ConversionEstimate | null> {
    try {
      const rateInfo = await this.getExchangeRate(sourceAsset, destinationAsset, sourceAmount);
      if (!rateInfo) {
        return null;
      }

      // Simple fee fetching with fallback
      let fee;
      try {
        fee = await this.server.fetchBaseFee();
      } catch (error) {
        console.warn('Network error fetching base fee, using fallback');
        fee = 100; // Fallback fee in stroops
      }
      const feeXLM = (fee * 0.0000001).toFixed(7);
      
      const destinationAmount = (parseFloat(sourceAmount) * parseFloat(rateInfo.rate)).toFixed(7);

      return {
        sourceAmount,
        destinationAmount,
        rate: rateInfo.rate,
        path: rateInfo.path,
        fee: feeXLM,
        estimatedTime: 5
      };
    } catch (error) {
      console.error('Error estimating conversion:', error);
      return null;
    }
  }

  async establishTrustline(
    secretKey: string,
    asset: StellarAsset,
    limit: string = '1000000'
  ): Promise<boolean> {
    try {
      console.log('🔧 Starting trustline establishment for:', {
        asset: asset.code,
        issuer: asset.issuer,
        limit
      });

      const keypair = Keypair.fromSecret(secretKey);
      const publicKey = keypair.publicKey();
      
      console.log('🔑 Keypair created for public key:', publicKey);
      
      // First, ensure the account exists
      const accountExists = await this.ensureAccountExists(secretKey);
      if (!accountExists) {
        console.error('❌ Failed to ensure account exists');
        return false;
      }
      
      // Check if trustline already exists
      const existingTrustline = await this.withRetry(
        () => this.checkTrustline(publicKey, asset),
        'check existing trustline',
        3,
        1000,
        15000
      );
      
      if (existingTrustline.exists) {
        console.log('✅ Trustline already exists for:', asset.code);
        return true; // Trustline already exists
      }

      console.log('📝 Trustline does not exist, creating new one...');

      // Load account with retry
      const account = await this.withRetry(
        () => this.server.loadAccount(publicKey),
        'load account for trustline',
        3,
        1000,
        15000
      );

      console.log('📊 Account loaded, sequence number:', account.sequenceNumber());

      // Check if account has enough XLM for the trustline operation
      const nativeBalance = account.balances.find(balance => balance.asset_type === 'native');
      if (nativeBalance) {
        const balanceXLM = parseFloat(nativeBalance.balance);
        console.log('💰 Account XLM balance:', balanceXLM);
        
        // Trustline operations typically need at least 0.5 XLM for reserve + fee
        if (balanceXLM < 0.5) {
          console.error('💸 Insufficient XLM balance for trustline operation. Need at least 0.5 XLM, have:', balanceXLM);
          return false;
        }
      } else {
        console.error('❌ No native balance found on account');
        return false;
      }

      const fee = await this.withRetry(
        () => this.server.fetchBaseFee(),
        'fetch base fee for trustline',
        3,
        1000,
        15000
      );

      console.log('💰 Base fee fetched:', fee);

      const assetObj = this.createAsset(asset);
      console.log('🏦 Asset object created:', {
        code: assetObj.getCode(),
        issuer: assetObj.getIssuer()
      });

      const txBuilder = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      console.log('🏗️ Transaction builder created with fee:', fee.toString());

      // Add change trust operation
      txBuilder.addOperation(
        Operation.changeTrust({
          asset: assetObj,
          limit: limit
        })
      );

      console.log('➕ Change trust operation added');

      const transaction = txBuilder.setTimeout(180).build();
      console.log('🔨 Transaction built, signing...');
      
      transaction.sign(keypair);
      console.log('✍️ Transaction signed');

      // Submit trustline transaction with retry
      console.log('🚀 Submitting trustline transaction...');
      const response = await this.withRetry(
        () => this.server.submitTransaction(transaction),
        'submit trustline transaction',
        3, // max retries
        2000, // base delay of 2 seconds
        30000 // 30 second timeout for trustline transaction
      );
      
      console.log('✅ Trustline established successfully:', response.hash);
      return true;
    } catch (error) {
      console.error('❌ Failed to establish trustline:', {
        error: error,
        errorType: typeof error,
        errorName: error?.constructor?.name,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack trace',
        asset: asset.code,
        issuer: asset.issuer
      });
      
      // Enhanced error handling for trustline establishment
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          console.error('🌐 Network error while establishing trustline');
        } else if (error.message.includes('insufficient_fee')) {
          console.error('💰 Insufficient fee for trustline transaction');
        } else if (error.message.includes('bad_seq')) {
          console.error('🔄 Sequence number mismatch for trustline transaction');
        } else if (error.message.includes('op_already_exists')) {
          console.log('⚠️ Trustline already exists - this is actually success');
          return true; // This is actually a success case
        } else if (error.message.includes('op_underfunded')) {
          console.error('💸 Account underfunded for trustline transaction');
        } else if (error.message.includes('tx_failed')) {
          console.error('❌ Transaction failed on network');
        } else if (error.message.includes('op_cross_self')) {
          console.log('⚠️ Trustline operation on self - this might be expected');
          return true; // This might be expected in some cases
        } else {
          console.error('❌ Unknown trustline error:', error.message);
        }
      } else {
        console.error('❌ Non-Error object thrown:', error);
      }
      
      return false;
    }
  }

  async executeConversion(
    sourceSecret: string,
    sourceAsset: StellarAsset,
    destinationAsset: StellarAsset,
    sourceAmount: string,
    destinationMin: string,
    destination?: string,
    memo?: string
  ): Promise<ConversionResult> {
    try {
      // First, check network connectivity
      const connectivity = await this.checkNetworkConnectivity();
      if (!connectivity.connected) {
        return {
          success: false,
          error: connectivity.error || 'Network connectivity issue. Please check your internet connection.'
        };
      }

      const sourceKeypair = Keypair.fromSecret(sourceSecret);
      const sourcePublicKey = sourceKeypair.publicKey();
      const destinationPublicKey = destination || sourcePublicKey;

      // Validate destination address
      if (destinationPublicKey !== sourcePublicKey) {
        try {
          Keypair.fromPublicKey(destinationPublicKey);
        } catch {
          throw new Error("Invalid destination address");
        }
      }

      // Ensure source account exists
      const accountExists = await this.ensureAccountExists(sourceSecret);
      if (!accountExists) {
        throw new Error("Source account does not exist and could not be created. Please ensure you have a valid Stellar account.");
      }

      // Check source trustline
      const sourceTrustline = await this.withRetry(
        () => this.checkTrustline(sourcePublicKey, sourceAsset),
        'check source trustline',
        3,
        1000,
        15000
      );

      if (!sourceTrustline.exists) {
        throw new Error(`Source account does not have trustline for ${sourceAsset.code}`);
      }

      // For self-conversions, establish destination trustline if needed
      if (destinationPublicKey === sourcePublicKey && destinationAsset.type !== 'native') {
        const destTrustline = await this.withRetry(
          () => this.checkTrustline(sourcePublicKey, destinationAsset),
          'check destination trustline',
          3,
          1000,
          15000
        );
        
        if (!destTrustline.exists) {
          console.log(`Establishing trustline for ${destinationAsset.code}...`);
          const trustlineEstablished = await this.withRetry(
            () => this.establishTrustline(sourceSecret, destinationAsset),
            'establish trustline',
            3,
            2000,
            30000
          );
          
          if (!trustlineEstablished) {
            throw new Error(`Failed to establish trustline for ${destinationAsset.code}. Please try again.`);
          }
        }
      }

      // Only check destination trustline if it's a different account
      if (destinationPublicKey !== sourcePublicKey) {
        const destTrustline = await this.withRetry(
          () => this.checkTrustline(destinationPublicKey, destinationAsset),
          'check destination trustline for different account',
          3,
          1000,
          15000
        );
        
        if (!destTrustline.exists && destinationAsset.type !== 'native') {
          throw new Error(`Destination account does not have trustline for ${destinationAsset.code}`);
        }
      }

      // Check balance
      const sourceBalance = parseFloat(sourceTrustline.balance || '0');
      const requiredAmount = parseFloat(sourceAmount);
      
      if (sourceBalance < requiredAmount) {
        throw new Error(`Insufficient balance. Available: ${sourceBalance} ${sourceAsset.code}`);
      }

      // Load account and create transaction with retry
      const account = await this.withRetry(
        () => this.server.loadAccount(sourcePublicKey),
        'load account',
        3,
        1000,
        15000
      );

      const fee = await this.withRetry(
        () => this.server.fetchBaseFee(),
        'fetch base fee',
        3,
        1000,
        15000
      );

      const sourceAssetObj = this.createAsset(sourceAsset);
      const destAssetObj = this.createAsset(destinationAsset);

      const txBuilder = new TransactionBuilder(account, {
        fee: fee.toString(),
        networkPassphrase: STELLAR_CONFIG.networkPassphrase,
      });

      // Add path payment operation
      txBuilder.addOperation(
        Operation.pathPaymentStrictSend({
          sendAsset: sourceAssetObj,
          sendAmount: sourceAmount,
          destination: destinationPublicKey,
          destAsset: destAssetObj,
          destMin: destinationMin,
        })
      );

      if (memo) {
        txBuilder.addMemo(Memo.text(memo));
      }

      const transaction = txBuilder.setTimeout(180).build();
      transaction.sign(sourceKeypair);

      // Submit transaction with retry mechanism
      console.log('🚀 About to submit transaction...');
      console.log('📋 Transaction details:', {
        sourcePublicKey,
        destinationPublicKey,
        sourceAsset: sourceAsset.code,
        destinationAsset: destinationAsset.code,
        sourceAmount,
        destinationMin,
        memo
      });
      
      const response = await this.withRetry(
        () => {
          console.log('🔄 Attempting to submit transaction...');
          return this.server.submitTransaction(transaction);
        },
        'submit transaction',
        3, // max retries
        2000, // base delay of 2 seconds
        45000 // 45 second timeout for transaction submission
      );

      console.log('✅ Transaction submitted successfully:', response.hash);

      return {
        success: true,
        hash: response.hash
      };
    } catch (error: unknown) {
      console.error('Conversion failed:', error);
      
      // Enhanced error handling
      let errorMessage = 'Unknown error occurred';
      
      if (error instanceof Error) {
        if (error.message.includes('Network Error')) {
          errorMessage = 'Network connection issue. Please check your internet connection and try again.';
        } else if (error.message.includes('timeout')) {
          errorMessage = 'Request timed out. Please try again.';
        } else if (error.message.includes('insufficient_fee')) {
          errorMessage = 'Transaction fee too low. Please try again.';
        } else if (error.message.includes('bad_seq')) {
          errorMessage = 'Account sequence number mismatch. Please refresh and try again.';
        } else if (error.message.includes('tx_failed')) {
          errorMessage = 'Transaction failed. Please check your balance and try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  async getOrderBook(
    selling: StellarAsset,
    buying: StellarAsset,
    limit: number = 10
  ) {
    try {
      const sellingAsset = this.createAsset(selling);
      const buyingAsset = this.createAsset(buying);

      const orderbook = await this.server
        .orderbook(sellingAsset, buyingAsset)
        .limit(limit)
        .call();

      return {
        bids: orderbook.bids.map(bid => ({
          price: bid.price,
          amount: bid.amount
        })),
        asks: orderbook.asks.map(ask => ({
          price: ask.price,
          amount: ask.amount
        }))
      };
    } catch (error) {
      console.error('Error fetching order book:', error);
      return null;
    }
  }
}

export const stellarConversionService = new StellarConversionService();