'use client';

import { useState, FormEvent } from 'react';
import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

const config = new AptosConfig({ network: Network.TESTNET });
const client = new Aptos(config);

export function CreateGiftForm() {
  const { account, signAndSubmitTransaction } = useWallet();
  const [amount, setAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!account) {
      setError('Please connect your wallet first');
      setLoading(false);
      return;
    }

    try {
      const response = await signAndSubmitTransaction({
        data: {
          function: `${account.address}::gift::create_gift`,
          typeArguments: [],
          functionArguments: [
            recipient,
            parseInt(amount),
            message || ""
          ]
        }
      });

      console.log('Transaction submitted:', response);
      
      // Reset form
      setAmount('');
      setRecipient('');
      setMessage('');
    } catch (error) {
      console.error('Error creating gift:', error);
      setError(error instanceof Error ? error.message : 'Failed to create gift');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
          Amount (GUI)
        </label>
        <input
          type="number"
          id="amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          required
          min="0"
        />
      </div>

      <div>
        <label htmlFor="recipient" className="block text-sm font-medium text-gray-700">
          Recipient Address
        </label>
        <input
          type="text"
          id="recipient"
          value={recipient}
          onChange={(e) => setRecipient(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          required
          placeholder="0x..."
        />
      </div>

      <div>
        <label htmlFor="message" className="block text-sm font-medium text-gray-700">
          Message (Optional)
        </label>
        <textarea
          id="message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="mt-1 block w-full rounded-md border border-gray-300 bg-white py-2 px-3 shadow-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          rows={3}
          placeholder="Add a personal message..."
        />
      </div>

      <button
        type="submit"
        disabled={loading || !account}
        className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400"
      >
        {loading ? 'Creating...' : 'Create Gift'}
      </button>
    </form>
  );
}
