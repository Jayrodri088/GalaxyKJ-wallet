import { Asset } from '@stellar/stellar-sdk';

export type NetworkType = 'mainnet' | 'testnet';

export interface AssetBalance {
  asset: Asset;
  balance: string;
  buying_liabilities: string;
  selling_liabilities: string;
  authorized: boolean;
  last_modified_ledger: number;
}

export interface XLMBalance {
  balance: string;
  buying_liabilities: string;
  selling_liabilities: string;
}

export interface WalletBalance {
  xlm: XLMBalance;
  assets: AssetBalance[];
  totalXLMValue: string;
}

export interface TransactionRecord {
  id: string;
  hash: string;
  created_at: string;
  source_account: string;
  type: string;
  type_i: number;
  successful: boolean;
  operation_count: number;
  envelope_xdr: string;
  result_xdr: string;
  result_meta_xdr: string;
  fee_charged: string;
  max_fee: string;
  memo?: string;
  memo_type?: string;
  signatures: string[];
}

export interface WalletTransaction {
  id: string;
  hash: string;
  type: 'send' | 'receive' | 'trade' | 'create_account' | 'other';
  amount: string;
  asset: string;
  from: string;
  to: string;
  timestamp: Date;
  fee: string;
  successful: boolean;
  memo?: string;
}

export interface NetworkConfig {
  type: NetworkType;
  horizonUrl: string;
  passphrase: string;
}

export interface ConnectionStatus {
  isConnected: boolean;
  isLoading: boolean;
  lastSyncTime: Date | null;
  error: string | null;
}

export interface WalletAccount {
  publicKey: string;
  secretKey?: string;
  sequence: string;
  subentry_count: number;
  home_domain?: string;
  inflation_destination?: string;
  last_modified_ledger: number;
  last_modified_time: string;
  thresholds: {
    low_threshold: number;
    med_threshold: number;
    high_threshold: number;
  };
  flags: {
    auth_required: boolean;
    auth_revocable: boolean;
    auth_immutable: boolean;
    auth_clawback_enabled: boolean;
  };
  signers: Array<{
    weight: number;
    key: string;
    type: string;
  }>;
  data: Record<string, string>;
}

export interface WalletState {
  publicKey: string | null;
  account: WalletAccount | null;
  balance: WalletBalance | null;
  transactions: WalletTransaction[];
  networkConfig: NetworkConfig;
  connectionStatus: ConnectionStatus;
  isInitialized: boolean;
}

export interface WalletActions {
  setPublicKey: (key: string | null) => void;
  setAccount: (account: WalletAccount | null) => void;
  setBalance: (balance: WalletBalance | null) => void;
  setTransactions: (transactions: WalletTransaction[]) => void;
  addTransaction: (transaction: WalletTransaction) => void;
  setNetworkConfig: (config: NetworkConfig) => void;
  setConnectionStatus: (status: Partial<ConnectionStatus>) => void;
  syncWallet: () => Promise<void>;
  initialize: () => Promise<void>;
  reset: () => void;
}

export type WalletStore = WalletState & WalletActions;