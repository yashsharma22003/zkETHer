# zkETHer Protocol Deployment Guide

## Local Development (Anvil)

### Prerequisites
- Foundry installed (`curl -L https://foundry.paradigm.xyz | bash`)
- Node.js and npm

### Quick Start

1. **Start Anvil**:
```bash
anvil --host 0.0.0.0 --port 8545
```

2. **Deploy Contracts**:
```bash
cd zkETHer-Protocol
forge script script/DeployToAnvil.s.sol --rpc-url http://localhost:8545 --broadcast
```

3. **Verify Deployment**:
```bash
forge script script/DeployToAnvil.s.sol --rpc-url http://localhost:8545
```

## Contract Addresses

After deployment, update these addresses in your app:
- ClaimIssuer: 0x5FbDB2315678afecb367f032d93F642f64180aa3
- zkETHer Token: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512

## Testing

```bash
# Compile contracts
forge build

# Run tests
forge test

# Run specific test
forge test --match-test testCreateIdentity
```

## Production Deployment

Use DeployProduction.s.sol for mainnet/testnet deployment with proper configuration.

## Contract Interaction

The mobile app uses the following services for contract interaction:
- `contractService.ts` - Low-level contract interactions
- `zkETHerProtocol.ts` - High-level protocol operations
- `onchainIdService.ts` - Identity and claims management

## Environment Setup

1. **Install Dependencies**:
```bash
npm install viem@^1.0.0
```

2. **Configure Network**:
Update `contractService.ts` with your network configuration.

3. **Deploy and Test**:
```bash
# Start local blockchain
anvil

# Deploy contracts
cd zkETHer-Protocol
forge script script/DeployToAnvil.s.sol --rpc-url http://localhost:8545 --broadcast

# Start mobile app
npx expo start
```

## Troubleshooting

### Common Issues

1. **Contract compilation fails**:
   - Check Solidity version compatibility
   - Ensure all dependencies are installed

2. **Deployment fails**:
   - Verify Anvil is running
   - Check gas limits and account balances

3. **Mobile app can't connect**:
   - Verify contract addresses are updated
   - Check network configuration in contractService.ts

### Debug Commands

```bash
# Check contract deployment
forge script script/DeployToAnvil.s.sol --rpc-url http://localhost:8545

# View contract state
cast call <CONTRACT_ADDRESS> "function_name()" --rpc-url http://localhost:8545

# Check account balance
cast balance <ADDRESS> --rpc-url http://localhost:8545
```
