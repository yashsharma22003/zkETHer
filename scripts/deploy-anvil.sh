#!/bin/bash

# zkETHer Anvil Deployment Script
# Automates the entire deployment process

set -e

echo "🚀 Starting zkETHer Anvil Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Foundry is installed
if ! command -v forge &> /dev/null; then
    print_error "Foundry not found. Installing..."
    curl -L https://foundry.paradigm.xyz | bash
    source ~/.bashrc
    foundryup
fi

# Get machine IP for external access
MACHINE_IP=$(ip addr show | grep 'inet ' | grep -v '127.0.0.1' | awk '{print $2}' | cut -d'/' -f1 | head -1)
print_status "Machine IP detected: $MACHINE_IP"

# Kill existing Anvil process
print_status "Stopping any existing Anvil processes..."
pkill anvil || true

# Start Anvil in background
print_status "Starting Anvil blockchain..."
anvil --host 0.0.0.0 --port 8545 > anvil.log 2>&1 &
ANVIL_PID=$!

# Wait for Anvil to start
sleep 3

# Check if Anvil is running
if ! curl -s http://localhost:8545 > /dev/null; then
    print_error "Failed to start Anvil. Check anvil.log for details."
    exit 1
fi

print_success "Anvil started successfully (PID: $ANVIL_PID)"

# Deploy contracts
print_status "Deploying zkETHer contracts..."
cd zkETHer-Protocol

export POLYGONSCAN_API_KEY=dummy
forge script script/DeployToAnvil.s.sol \
    --rpc-url http://localhost:8545 \
    --broadcast \
    --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
    --tc DeployToAnvil

if [ $? -eq 0 ]; then
    print_success "Contracts deployed successfully!"
else
    print_error "Contract deployment failed!"
    exit 1
fi

# Extract contract addresses from broadcast logs
BROADCAST_DIR="broadcast/DeployToAnvil.s.sol/31337"
if [ -d "$BROADCAST_DIR" ]; then
    LATEST_RUN=$(ls -t "$BROADCAST_DIR" | head -1)
    BROADCAST_FILE="$BROADCAST_DIR/$LATEST_RUN"
    
    if [ -f "$BROADCAST_FILE" ]; then
        print_status "Extracting contract addresses..."
        
        # Parse contract addresses (this is a simplified extraction)
        CLAIM_ISSUER=$(grep -o '"contractAddress":"0x[a-fA-F0-9]*"' "$BROADCAST_FILE" | head -1 | cut -d'"' -f4)
        ZKETHER_TOKEN=$(grep -o '"contractAddress":"0x[a-fA-F0-9]*"' "$BROADCAST_FILE" | tail -1 | cut -d'"' -f4)
        
        echo ""
        print_success "=== DEPLOYMENT COMPLETE ==="
        echo "📍 Claim Issuer: $CLAIM_ISSUER"
        echo "🪙 zkETHer Token: $ZKETHER_TOKEN"
        echo "🌐 RPC URL: http://$MACHINE_IP:8545"
        echo "⛓️  Chain ID: 31337"
        echo ""
        
        # Update contract configuration
        print_status "Updating contract configuration..."
        cd ..
        
        # Create/update contract config file
        cat > src/config/deployedContracts.ts << EOF
// Auto-generated contract addresses from deployment
export const DEPLOYED_CONTRACTS = {
  anvil: {
    CLAIM_ISSUER: '$CLAIM_ISSUER' as const,
    ZKETHER_TOKEN: '$ZKETHER_TOKEN' as const,
    RPC_URL: 'http://$MACHINE_IP:8545' as const,
    CHAIN_ID: 31337 as const,
  }
};

export const CURRENT_NETWORK = 'anvil';
EOF
        
        print_success "Contract configuration updated!"
        
        # Update zkETHerProtocol service
        if [ -f "src/services/zkETHerProtocol.ts" ]; then
            print_status "Updating zkETHer protocol service..."
            sed -i "s/CLAIM_ISSUER: '0x[a-fA-F0-9]*'/CLAIM_ISSUER: '$CLAIM_ISSUER'/g" src/services/zkETHerProtocol.ts
            sed -i "s/ZKETHER_TOKEN: '0x[a-fA-F0-9]*'/ZKETHER_TOKEN: '$ZKETHER_TOKEN'/g" src/services/zkETHerProtocol.ts
            sed -i "s|ANVIL_RPC: 'http://[^']*'|ANVIL_RPC: 'http://$MACHINE_IP:8545'|g" src/services/zkETHerProtocol.ts
            print_success "zkETHer protocol service updated!"
        fi
        
        # Update event listener
        if [ -f "src/services/zkETHerEventListener.ts" ]; then
            print_status "Updating event listener..."
            sed -i "s/0x0000000000000000000000000000000000000000/$ZKETHER_TOKEN/g" src/services/zkETHerEventListener.ts
            sed -i "s|http://localhost:8545|http://$MACHINE_IP:8545|g" src/services/zkETHerEventListener.ts
            print_success "Event listener updated!"
        fi
        
    else
        print_warning "Could not find broadcast file for address extraction"
    fi
else
    print_warning "Could not find broadcast directory"
fi

echo ""
print_success "🎉 zkETHer deployment complete!"
echo ""
echo "Next steps:"
echo "1. Start your mobile app: npx expo start -c"
echo "2. Connect your wallet to Anvil network (Chain ID: 31337)"
echo "3. Use RPC URL: http://$MACHINE_IP:8545"
echo ""
echo "To stop Anvil: kill $ANVIL_PID"
echo "Anvil logs: tail -f anvil.log"
