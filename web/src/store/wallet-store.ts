import { create } from "zustand";

interface WalletState {
  publicKey: string | null;
  setPublicKey: (key: string) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  publicKey: null,
  setPublicKey: (key) => set({ publicKey: key }),
}));
