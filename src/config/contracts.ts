export interface ContractConfig {
  address: `0x${string}`;
  abi: any[];
}

export interface NetworkConfig {
  chainId: number;
  name: string;
  rpcUrl: string;
  blockExplorer?: string;
}

// Network configurations
export const NETWORKS: Record<string, NetworkConfig> = {
  anvil: {
    chainId: 31337,
    name: 'Anvil Local',
    rpcUrl: 'http://localhost:8545',
  },
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia Testnet',
    rpcUrl: 'https://sepolia.infura.io/v3/YOUR_INFURA_KEY',
    blockExplorer: 'https://sepolia.etherscan.io',
  },
};

// Contract addresses per network
export const CONTRACT_ADDRESSES: Record<string, Record<string, `0x${string}`>> = {
  anvil: {
    CLAIM_ISSUER: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
    ZKETHER_TOKEN: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  },
  sepolia: {
    CLAIM_ISSUER: '0x0000000000000000000000000000000000000000', // Deploy to Sepolia
    ZKETHER_TOKEN: '0x0000000000000000000000000000000000000000', // Deploy to Sepolia
  },
};

// Get contract address for current network
export function getContractAddress(network: string, contract: string): `0x${string}` {
  const addresses = CONTRACT_ADDRESSES[network];
  if (!addresses || !addresses[contract]) {
    throw new Error(`Contract ${contract} not found for network ${network}`);
  }
  return addresses[contract];
}

// Get network config
export function getNetworkConfig(network: string): NetworkConfig {
  const config = NETWORKS[network];
  if (!config) {
    throw new Error(`Network ${network} not configured`);
  }
  return config;
}

// Auto-detect network from chain ID
export function getNetworkFromChainId(chainId: number): string {
  for (const [network, config] of Object.entries(NETWORKS)) {
    if (config.chainId === chainId) {
      return network;
    }
  }
  return 'unknown';
}
