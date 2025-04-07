import { useState } from 'react';
import { createStellarAccount } from '@/lib/stellar/create-account';

export function useCreateWallet() {
  const [isCreating, setIsCreating] = useState(false);

  const createWallet = async () => {
    setIsCreating(true);
    try {
      const wallet = await createStellarAccount();
      return wallet;
    } catch (err) {
      return null;
    } finally {
      setIsCreating(false);
    }
  };

  return { createWallet, isCreating };
}
