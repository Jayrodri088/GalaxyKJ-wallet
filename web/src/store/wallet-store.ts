import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Server, Horizon } from "@stellar/stellar-sdk";
import { 
  WalletStore, 
  WalletAccount, 
  WalletBalance, 
  WalletTransaction, 
  NetworkConfig, 
  ConnectionStatus,
  TransactionRecord,
  AssetBalance
} from "@/types/wallet";

const DEFAULT_NETWORK_CONFIG: NetworkConfig = {
  type: 'testnet',
  horizonUrl: 'https://horizon-testnet.stellar.org',
  passphrase: 'Test SDF Network ; September 2015'
};

const DEFAULT_CONNECTION_STATUS: ConnectionStatus = {
  isConnected: false,
  isLoading: false,
  lastSyncTime: null,
  error: null
};

export const useWalletStore = create<WalletStore>()(
  persist(
    (set, get) => ({
      // State
      publicKey: null,
      account: null,
      balance: null,
      transactions: [],
      networkConfig: DEFAULT_NETWORK_CONFIG,
      connectionStatus: DEFAULT_CONNECTION_STATUS,
      isInitialized: false,

      // Actions
      setPublicKey: (key: string | null) => {
        set({ publicKey: key });
        if (!key) {
          get().reset();
        }
      },

      setAccount: (account: WalletAccount | null) => {
        set({ account });
      },

      setBalance: (balance: WalletBalance | null) => {
        set({ balance });
      },

      setTransactions: (transactions: WalletTransaction[]) => {
        set({ transactions });
      },

      addTransaction: (transaction: WalletTransaction) => {
        set((state) => ({
          transactions: [transaction, ...state.transactions].slice(0, 100) // Keep only latest 100
        }));
      },

      setNetworkConfig: (config: NetworkConfig) => {
        set({ networkConfig: config });
        // Reset connection status when network changes
        set({ connectionStatus: DEFAULT_CONNECTION_STATUS });
      },

      setConnectionStatus: (status: Partial<ConnectionStatus>) => {
        set((state) => ({
          connectionStatus: { ...state.connectionStatus, ...status }
        }));
      },

      syncWallet: async () => {
        const { publicKey, networkConfig, setConnectionStatus, setAccount, setBalance, setTransactions } = get();
        
        if (!publicKey) {
          setConnectionStatus({ error: 'No public key set' });
          return;
        }

        setConnectionStatus({ isLoading: true, error: null });

        try {
          const server = new Server(networkConfig.horizonUrl);
          
          // Load account
          const accountResponse = await server.loadAccount(publicKey);
          
          const account: WalletAccount = {
            publicKey: accountResponse.id,
            sequence: accountResponse.sequence,
            subentry_count: accountResponse.subentry_count,
            home_domain: accountResponse.home_domain,
            inflation_destination: accountResponse.inflation_destination,
            last_modified_ledger: accountResponse.last_modified_ledger,
            last_modified_time: accountResponse.last_modified_time,
            thresholds: {
              low_threshold: accountResponse.thresholds.low_threshold,
              med_threshold: accountResponse.thresholds.med_threshold,
              high_threshold: accountResponse.thresholds.high_threshold,
            },
            flags: {
              auth_required: accountResponse.flags.auth_required,
              auth_revocable: accountResponse.flags.auth_revocable,
              auth_immutable: accountResponse.flags.auth_immutable,
              auth_clawback_enabled: accountResponse.flags.auth_clawback_enabled,
            },
            signers: accountResponse.signers.map(signer => ({
              weight: signer.weight,
              key: signer.key,
              type: signer.type,
            })),
            data: accountResponse.data_attr,
          };

          setAccount(account);

          // Process balances
          const xlmBalance = accountResponse.balances.find(
            (balance) => balance.asset_type === 'native'
          ) as Horizon.HorizonApi.BalanceLineNative;

          const assetBalances: AssetBalance[] = accountResponse.balances
            .filter((balance) => balance.asset_type !== 'native')
            .map((balance) => {
              const assetBalance = balance as Horizon.HorizonApi.BalanceLineAsset;
              return {
                asset: {
                  code: assetBalance.asset_code,
                  issuer: assetBalance.asset_issuer,
                  isNative: () => false,
                  getCode: () => assetBalance.asset_code,
                  getIssuer: () => assetBalance.asset_issuer,
                },
                balance: assetBalance.balance,
                buying_liabilities: assetBalance.buying_liabilities,
                selling_liabilities: assetBalance.selling_liabilities,
                authorized: assetBalance.is_authorized || false,
                last_modified_ledger: assetBalance.last_modified_ledger || 0,
              };
            });

          const walletBalance: WalletBalance = {
            xlm: {
              balance: xlmBalance?.balance || '0',
              buying_liabilities: xlmBalance?.buying_liabilities || '0',
              selling_liabilities: xlmBalance?.selling_liabilities || '0',
            },
            assets: assetBalances,
            totalXLMValue: xlmBalance?.balance || '0', // Simplified for now
          };

          setBalance(walletBalance);

          // Load transactions
          const transactionResponse = await server.transactions()
            .forAccount(publicKey)
            .order('desc')
            .limit(50)
            .call();

          const transactions: WalletTransaction[] = transactionResponse.records.map((record: TransactionRecord) => ({
            id: record.id,
            hash: record.hash,
            type: 'other' as const, // Simplified for now, would need operation parsing
            amount: record.fee_charged,
            asset: 'XLM',
            from: record.source_account,
            to: record.source_account, // Simplified
            timestamp: new Date(record.created_at),
            fee: record.fee_charged,
            successful: record.successful,
            memo: record.memo,
          }));

          setTransactions(transactions);

          setConnectionStatus({
            isConnected: true,
            isLoading: false,
            lastSyncTime: new Date(),
            error: null
          });

        } catch (error) {
          setConnectionStatus({
            isConnected: false,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to sync wallet'
          });
        }
      },

      initialize: async () => {
        set({ isInitialized: true });
        const { publicKey } = get();
        if (publicKey) {
          await get().syncWallet();
        }
      },

      reset: () => {
        set({
          account: null,
          balance: null,
          transactions: [],
          connectionStatus: DEFAULT_CONNECTION_STATUS,
        });
      },
    }),
    {
      name: 'wallet-storage',
      partialize: (state) => ({
        publicKey: state.publicKey,
        networkConfig: state.networkConfig,
        // Don't persist dynamic data like balance, transactions, etc.
      }),
    }
  )
);
