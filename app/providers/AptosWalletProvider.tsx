'use client';

import { AptosWalletAdapterProvider, NetworkName } from '@aptos-labs/wallet-adapter-react';
import { PetraWallet } from "petra-plugin-wallet-adapter";
import { ReactNode } from 'react';

export function AptosWalletProvider({ children }: { children: ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      network={NetworkName.Testnet}
      primaryWalletPlugins={[new PetraWallet()]}
      autoConnect={true}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
