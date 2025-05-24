'use client';

import { useWallet } from '@aptos-labs/wallet-adapter-react';
import { useEffect, useState } from 'react';
import { FaucetButton } from './FaucetButton';

export function WalletTest() {
  const { connected, account, network } = useWallet();
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    const fetchBalance = async () => {
      if (connected && account?.address) {
        try {
          const response = await fetch(
            `https://fullnode.testnet.aptoslabs.com/v1/accounts/${account.address}/resources`
          );
          const resources = await response.json();
          const accountResource = resources.find(
            (r: any) => r.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
          );
          if (accountResource) {
            const balance = accountResource.data.coin.value;
            setBalance((parseInt(balance) / 100000000).toString()); // Convert from Octas
          }
        } catch (error) {
          console.error('Error fetching balance:', error);
        }
      }
    };

    fetchBalance();
  }, [connected, account]);

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm">
      <h2 className="text-lg font-semibold mb-4">Wallet Status</h2>
      <div className="space-y-2">
        <p>Connection Status: {connected ? '✅ Connected' : '❌ Disconnected'}</p>
        {connected && account && (
          <>
            <p>Network: {network?.name || 'Unknown'}</p>
            <p>Address: {account.address}</p>
            <p>Balance: {balance} APT</p>
            <div className="mt-4">
              <FaucetButton />
            </div>
          </>
        )}
      </div>
    </div>
  );
}
