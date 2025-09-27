// AppKit Wagmi configuration for zkETHer
import '@walletconnect/react-native-compat';
import { defaultWagmiConfig, createAppKit } from '@reown/appkit-wagmi-react-native';
import { mainnet, polygon, arbitrum, base, optimism, sepolia } from '@wagmi/core/chains';
import { defineChain } from 'viem';
import { QueryClient } from '@tanstack/react-query';

// Project ID from https://cloud.walletconnect.com
export const projectId = '10a7a0c3bff08e7c28df40c7c67eb0fa';

export const metadata = {
  name: 'zkETHer',
  description: 'Privacy-focused Ethereum wallet mobile app',
  url: 'https://zkether.com',
  icons: ['https://zkether.com/icon.png'],
  redirect: {
    native: 'zkether://',
    universal: 'https://zkether.com',
  },
};

// Define Anvil local chain
const anvil = defineChain({
  id: 31337,
  name: 'Anvil Local',
  network: 'anvil',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    public: { http: ['http://10.200.9.12:8545'] },
    default: { http: ['http://10.200.9.12:8545'] },
  },
  blockExplorers: {
    default: { name: 'Local', url: 'http://10.200.9.12:8545' },
  },
});

export const chains = [anvil, sepolia, mainnet, polygon, arbitrum, base, optimism] as const;

export const wagmiConfig = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
});

export const queryClient = new QueryClient();

// Initialize AppKit
export const initializeAppKit = () => {
  createAppKit({
    projectId,
    metadata,
    wagmiConfig,
    defaultChain: mainnet,
    enableAnalytics: true,
  });
};
