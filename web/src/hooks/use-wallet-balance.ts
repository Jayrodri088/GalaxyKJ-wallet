import { useEffect, useState } from "react";
import * as StellarSDK from "@stellar/stellar-sdk";
import { useWalletStore } from "@/store/wallet-store";

export function useWalletBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const publicKey = useWalletStore((state) => state.publicKey);
  const networkConfig = useWalletStore((state) => state.networkConfig);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) {
        setBalance(null);
        setError(null);
        return;
      }

      try {
        setError(null);
        const server = new StellarSDK.Horizon.Server(networkConfig.horizonUrl);
        const account = await server.accounts().accountId(publicKey).call();
        const nativeBalance = account.balances.find((b) => b.asset_type === "native");
        setBalance(parseFloat(nativeBalance?.balance || "0"));
      } catch (error) {
        // Handle specific error types
        if (error instanceof Error) {
          if (error.message.includes('404') || error.message.includes('not found')) {
            // Account doesn't exist yet - this is normal for new wallets
            setBalance(0);
            setError(null);
          } else if (error.message.includes('Network Error') || error.message.includes('timeout')) {
            // Network issues - don't update balance, keep previous value
            setError('Network connection failed');
          } else {
            // Other errors
            setError(error.message);
          }
        } else {
          setError('Unknown error occurred');
        }
        
        // Only log in development
        if (process.env.NODE_ENV === 'development') {
          console.warn("Error fetching balance:", error);
        }
      }
    };

    fetchBalance();
  }, [publicKey, networkConfig.horizonUrl]);

  return { balance, error };
}
