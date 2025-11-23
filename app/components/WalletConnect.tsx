'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { MouseEvent } from 'react';

export function WalletConnect() {
  const { connect, disconnect, account, connected } = useWallet();

  const handleConnect = async (e: MouseEvent) => {
    try {
      await connect('petra');
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  if (!connected) {
    return (
      <button
        onClick={handleConnect}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Connect Wallet
      </button>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-gray-600">
        {account?.address?.toString().slice(0, 6)}...
        {account?.address?.toString().slice(-4)}
      </span>
      <button
        onClick={() => disconnect()}
        className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        Disconnect
      </button>
    </div>
  );
}
