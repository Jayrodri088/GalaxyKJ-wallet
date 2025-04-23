import { useState } from "react";
import { createStellarAccount } from "@/lib/stellar/create-account";
import { useWalletStore } from "@/store/wallet-store";

export function useCreateWallet() {
  const [isCreating, setIsCreating] = useState(false);
  const setPublicKey = useWalletStore((state) => state.setPublicKey); 

  const createWallet = async () => {
    setIsCreating(true);
    try {
      const wallet = await createStellarAccount();
      setPublicKey(wallet.publicKey); 
      return wallet;
    } catch (err) {
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createWallet, isCreating };
}
