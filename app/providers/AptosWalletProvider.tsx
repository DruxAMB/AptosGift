'use client';

import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from 'petra-plugin-wallet-adapter';
import { ReactNode } from 'react';

export function AptosWalletProvider({ children }: { children: ReactNode }) {
  const walletAdapters = [new PetraWallet()];

  return (
    <AptosWalletAdapterProvider
      walletAdapters={walletAdapters}
      autoConnect={true}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
