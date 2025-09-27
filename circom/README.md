# zkETHer Circom Circuits

Zero-knowledge circuits for the zkETHer privacy protocol.

## Setup

### Prerequisites

1. **Install Rust and Circom**:
```bash
curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh
git clone https://github.com/iden3/circom.git
cd circom && cargo build --release && cargo install --path circomlib
```

2. **Install Node.js dependencies**:
```bash
npm install
```

## Circuits

### 1. Multiplier Circuit (multiplier.circom)
Basic circuit for testing the zkSNARK pipeline.
- **Inputs**: a, b (private)
- **Output**: c = a * b (public)

### 2. zkETHer Circuit (zkether.circom)
Advanced circuit for privacy-preserving transactions.
- **Inputs**: secret, nullifier, amount (private)
- **Outputs**: commitment, nullifierHash (public)

## Commands

### Compile Circuits
```bash
npm run compile
# or
./scripts/compile-circuits.sh
```

### Run Tests
```bash
node scripts/test-circuit.js
```

### Full Build (includes trusted setup)
```bash
npm run build
```

## Generated Files

- `build/multiplier.r1cs` - R1CS constraint system
- `build/multiplier_js/` - WASM witness generator
- `multiplier_final.zkey` - Proving key
- `verification_key.json` - Verification key
- `MultiplierVerifier.sol` - Solidity verifier contract

## Integration

The generated Solidity verifier can be deployed alongside zkETHer contracts for on-chain proof verification.

## Security Note

The trusted setup files (*.ptau, *.zkey) in this repository are for development only. Production deployments require a proper trusted setup ceremony.
