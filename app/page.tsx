'use client';

import { WalletConnect } from './components/WalletConnect';
import { GiftCard } from './components/GiftCard';
import { CreateGiftForm } from './components/CreateGiftForm';
import { WalletTest } from './components/WalletTest';
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export default function Home() {
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AptosGifts</h1>
          <WalletConnect />
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {!connected ? (
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Connect your wallet to start sending gifts
            </h2>
          </div>
        ) : (
          <div className="space-y-8">
            <WalletTest />
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              <GiftCard
                amount={100}
                message="Happy Birthday!"
                sender="0x1234567890abcdef"
              />
              <GiftCard
                amount={50}
                recipient="0xabcdef1234567890"
              />
            </div>
            
            <div className="mt-8 p-6 bg-white rounded-xl shadow-lg">
              <h3 className="text-lg font-semibold mb-4">Create New Gift</h3>
              <CreateGiftForm />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
