#!/bin/bash

# zkETHer Circom Circuit Compilation Script
set -e

echo "🔧 Starting Circom circuit compilation..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if circom is installed
if ! command -v circom &> /dev/null; then
    print_error "Circom not found. Please install circom first:"
    echo "curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh"
    echo "git clone https://github.com/iden3/circom.git"
    echo "cd circom && cargo build --release && cargo install --path circomlib"
    exit 1
fi

# Create build directory
mkdir -p build

# Compile multiplier circuit
print_status "Compiling multiplier.circom..."
circom circuits/multiplier.circom --r1cs --wasm --sym -o build

if [ $? -eq 0 ]; then
    print_success "Circuit compiled successfully!"
else
    print_error "Circuit compilation failed!"
    exit 1
fi

# Check if trusted setup files exist
if [ ! -f "pot12_final.ptau" ]; then
    print_status "Generating trusted setup (this may take a while)..."
    
    # Powers of Tau ceremony
    snarkjs powersoftau new bn128 12 pot12_0000.ptau
    snarkjs powersoftau contribute pot12_0000.ptau pot12_0001.ptau --name="First contribution" -v
    snarkjs powersoftau prepare phase2 pot12_0001.ptau pot12_final.ptau -v
    
    print_success "Trusted setup generated!"
fi

# Generate proving and verification keys
if [ ! -f "multiplier_final.zkey" ]; then
    print_status "Generating zkey files..."
    
    snarkjs groth16 setup build/multiplier.r1cs pot12_final.ptau multiplier_0000.zkey
    snarkjs zkey contribute multiplier_0000.zkey multiplier_final.zkey --name="First contribution" -v
    
    print_success "zkey files generated!"
fi

# Export verification key
print_status "Exporting verification key..."
snarkjs zkey export verificationkey multiplier_final.zkey verification_key.json

# Generate Solidity verifier
print_status "Generating Solidity verifier..."
snarkjs zkey export solidityverifier multiplier_final.zkey ../zkETHer-Protocol/src/MultiplierVerifier.sol

print_success "🎉 Circuit compilation complete!"
echo ""
echo "Generated files:"
echo "- build/multiplier.r1cs (R1CS constraint system)"
echo "- build/multiplier_js/ (WASM witness generator)"
echo "- multiplier_final.zkey (Proving key)"
echo "- verification_key.json (Verification key)"
echo "- MultiplierVerifier.sol (Solidity verifier contract)"
