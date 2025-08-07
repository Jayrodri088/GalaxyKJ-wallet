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
    this.server = new StellarSdk.Horizon.Server(STELLAR_CONFIG.horizonURL);
  }

  private createAsset(stellarAsset: StellarAsset): Asset {
    if (stellarAsset.type === 'native') {
      return Asset.native();
    }
    return new Asset(stellarAsset.code, stellarAsset.issuer!);
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
        limit: trustline && 'limit' in trustline ? (trustline as unknown as { limit: string }).limit : undefined
      };
    } catch {
      return {
        asset,
        exists: false,
        balance: '0'
      };
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

      const pathsCallBuilder = this.server
        .strictSendPaths(source, sourceAmount, [destination]);
      
      const pathsResponse = await pathsCallBuilder.call();
      
      if (pathsResponse.records.length === 0) {
        return null;
      }

      const bestPath = pathsResponse.records[0];
      const rate = (parseFloat(bestPath.destination_amount) / parseFloat(sourceAmount)).toString();
      
      const path = bestPath.path.map(pathAsset => ({
        code: pathAsset.asset_code || 'XLM',
        issuer: pathAsset.asset_issuer,
        type: pathAsset.asset_type === 'native' ? 'native' as const : 'credit_alphanum4' as const
      }));

      return {
        rate,
        path: path.length > 0 ? path : undefined,
        updated: new Date()
      };
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

      const fee = await this.server.fetchBaseFee();
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

      // Check trustlines
      const sourceTrustline = await this.checkTrustline(sourcePublicKey, sourceAsset);
      const destTrustline = await this.checkTrustline(destinationPublicKey, destinationAsset);

      if (!sourceTrustline.exists) {
        throw new Error(`Source account does not have trustline for ${sourceAsset.code}`);
      }

      if (!destTrustline.exists && destinationAsset.type !== 'native') {
        throw new Error(`Destination account does not have trustline for ${destinationAsset.code}`);
      }

      // Check balance
      const sourceBalance = parseFloat(sourceTrustline.balance || '0');
      const requiredAmount = parseFloat(sourceAmount);
      
      if (sourceBalance < requiredAmount) {
        throw new Error(`Insufficient balance. Available: ${sourceBalance} ${sourceAsset.code}`);
      }

      // Load account and create transaction
      const account = await this.server.loadAccount(sourcePublicKey);
      const fee = await this.server.fetchBaseFee();

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

      const response = await this.server.submitTransaction(transaction);

      return {
        success: true,
        hash: response.hash
      };
    } catch (error: unknown) {
      console.error('Conversion failed:', error);
      const message = error instanceof Error ? error.message : 'Unknown error occurred';
      return {
        success: false,
        error: message
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