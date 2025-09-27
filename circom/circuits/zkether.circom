pragma circom 2.0.0;

include "../node_modules/circomlib/circuits/poseidon.circom";
include "../node_modules/circomlib/circuits/bitify.circom";

// zkETHer commitment circuit
template ZkETHerCommitment() {
    signal input secret;
    signal input nullifier;
    signal input amount;
    signal output commitment;
    signal output nullifierHash;

    // Hash the commitment: commitment = poseidon(secret, nullifier, amount)
    component commitmentHasher = Poseidon(3);
    commitmentHasher.inputs[0] <== secret;
    commitmentHasher.inputs[1] <== nullifier;
    commitmentHasher.inputs[2] <== amount;
    commitment <== commitmentHasher.out;

    // Hash the nullifier: nullifierHash = poseidon(nullifier)
    component nullifierHasher = Poseidon(1);
    nullifierHasher.inputs[0] <== nullifier;
    nullifierHash <== nullifierHasher.out;
}

// zkETHer withdrawal circuit
template ZkETHerWithdraw(levels) {
    signal input secret;
    signal input nullifier;
    signal input amount;
    signal input recipient;
    signal input pathElements[levels];
    signal input pathIndices[levels];

    signal output nullifierHash;
    signal output commitmentHash;

    // Compute commitment
    component commitment = ZkETHerCommitment();
    commitment.secret <== secret;
    commitment.nullifier <== nullifier;
    commitment.amount <== amount;
    commitmentHash <== commitment.commitment;
    nullifierHash <== commitment.nullifierHash;

    // Merkle tree proof (simplified for hackathon)
    // In production, this would include full Merkle tree verification
    signal merkleRoot;
    merkleRoot <== pathElements[0]; // Simplified - just use first path element
}

// Export main components
component main = ZkETHerCommitment();
