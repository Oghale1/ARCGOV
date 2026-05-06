'use client';
// ArcGov — Built by Gemini — arcgov.xyz

import * as React from 'react';
import {
  RainbowKitProvider,
  getDefaultConfig,
  Chain,
  lightTheme,
  darkTheme,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider, http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from 'next-themes';
import '@rainbow-me/rainbowkit/styles.css';

const arcTestnet: Chain = {
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: {
    default: { http: ['https://rpc.testnet.arc.network'] },
  },
  blockExplorers: {
    default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' },
  },
  testnet: true,
};

const config = getDefaultConfig({
  appName: 'ArcGov',
  projectId: 'YOUR_PROJECT_ID', // Placeholder, user should provide or it works with limited features
  chains: [arcTestnet],
  transports: {
    [arcTestnet.id]: http(),
  },
});

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <RainbowKitProvider
            theme={{
              lightMode: lightTheme({
                accentColor: '#1D9E75',
                borderRadius: 'large',
              }),
              darkMode: darkTheme({
                accentColor: '#1D9E75',
                borderRadius: 'large',
              }),
            }}
          >
            {children}
          </RainbowKitProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
