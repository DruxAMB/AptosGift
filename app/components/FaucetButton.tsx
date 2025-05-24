'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useState } from 'react';

export function FaucetButton() {
  const { account } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestFaucet = async () => {
    if (!account?.address) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('https://faucet.testnet.aptoslabs.com/v1/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address: account.address,
          amount: 100000000, // 1 APT = 100000000 Octas
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get tokens from faucet');
      }

      // Wait for 2 seconds to allow transaction to process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Reload the page to update balance
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to request tokens');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-start gap-2">
      <button
        onClick={requestFaucet}
        disabled={loading || !account}
        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400"
      >
        {loading ? 'Requesting...' : 'Get Test Tokens'}
      </button>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
