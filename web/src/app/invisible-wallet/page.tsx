/**
 * Invisible Wallet Demo Page
 * 
 * A dedicated page to showcase and test the Invisible Wallet system
 */

import { InvisibleWalletDemo } from '@/components/invisible-wallet/invisible-wallet-demo';

export default function InvisibleWalletPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <InvisibleWalletDemo />
      </div>
    </div>
  );
}

export const metadata = {
  title: 'Invisible Wallet Demo - Galaxy Smart Wallet',
  description: 'Test the Invisible Wallet system that abstracts Stellar blockchain complexity for seamless user experience.',
};
