import { useEffect, useState } from "react";
import * as StellarSDK from "@stellar/stellar-sdk";
import { useWalletStore } from "@/store/wallet-store";
import { STELLAR_CONFIG } from "@/lib/stellar/config";

export function useWalletBalance() {
  const [balance, setBalance] = useState<number | null>(null);
  const publicKey = useWalletStore((state) => state.publicKey);

  useEffect(() => {
    const fetchBalance = async () => {
      if (!publicKey) return;

      try {
        const server = new StellarSDK.Horizon.Server(STELLAR_CONFIG.horizonURL);
        const account = await server.accounts().accountId(publicKey).call();
        const nativeBalance = account.balances.find((b) => b.asset_type === "native");
        setBalance(parseFloat(nativeBalance?.balance || "0"));
      } catch (error) {
        console.error("Error fetching balance:", error);
        setBalance(0);
      }
    };

    fetchBalance();
  }, [publicKey]);

  return balance;
}
