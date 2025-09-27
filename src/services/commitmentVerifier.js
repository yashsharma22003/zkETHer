import sodium from 'libsodium-wrappers';
import { hkdfSha256, poseidonHashBytes } from './libsodiumHelper.js';

/**
 * Bob's commitment verification logic
 * Checks if a commitment from a deposit event belongs to Bob
 */
export class CommitmentVerifier {
  constructor() {
    this.initialized = false;
  }

  async initialize() {
    if (!this.initialized) {
      await sodium.ready;
      this.initialized = true;
    }
  }

  /**
   * Bob derives secret and checks if commitment matches
   * @param {string} R_pub_hex - Alice's ephemeral public key from deposit
   * @param {string} bobX25519Priv - Bob's private key
   * @param {string} expectedCommitment - Commitment from deposit event
   * @returns {Object} - Verification result with secret, nullifier, and match status
   */
  async bobDerivesSecret(R_pub_hex, bobX25519Priv, expectedCommitment) {
    await this.initialize();

    try {
      const R_pub = Buffer.from(R_pub_hex, "hex");
      const bobPriv = Buffer.from(bobX25519Priv, "hex");

      // Recompute shared secret using ECDH
      const shared = sodium.crypto_scalarmult(bobPriv, R_pub);

      // Derive same secret & nullifier using HKDF
      const secret = await hkdfSha256(shared, "string1", 32);
      const nullifier = await hkdfSha256(shared, "string2", 32);

      // Compute Poseidon commitment
      const commitmentCheck = poseidonHashBytes(secret, nullifier);
      const commitmentHex = commitmentCheck.toString();

      // Check if this commitment belongs to Bob
      const isForBob = commitmentHex === expectedCommitment;

      console.log(`🔍 Commitment verification:`, {
        expectedCommitment,
        computedCommitment: commitmentHex,
        isForBob,
        secretPreview: secret.toString("hex").slice(0, 10) + '...',
        nullifierPreview: nullifier.toString("hex").slice(0, 10) + '...'
      });

      return {
        secret: secret.toString("hex"),
        nullifier: nullifier.toString("hex"),
        commitmentCheck: commitmentHex,
        isForBob,
        sharedSecret: shared.toString("hex")
      };
    } catch (error) {
      console.error('❌ Error in bobDerivesSecret:', error);
      return {
        secret: null,
        nullifier: null,
        commitmentCheck: null,
        isForBob: false,
        error: error.message
      };
    }
  }

  /**
   * Batch verify multiple commitments for Bob
   * @param {Array} commitments - Array of {commitment, R_pub_hex} objects
   * @param {string} bobPrivateKey - Bob's X25519 private key
   * @returns {Array} - Array of verification results for Bob's notes only
   */
  async verifyCommitmentsForBob(commitments, bobPrivateKey) {
    await this.initialize();
    
    const bobsNotes = [];
    
    for (const { commitment, R_pub_hex, leafIndex, timestamp, amount } of commitments) {
      const verification = await this.bobDerivesSecret(R_pub_hex, bobPrivateKey, commitment);
      
      if (verification.isForBob) {
        bobsNotes.push({
          commitment,
          secret: verification.secret,
          nullifier: verification.nullifier,
          leafIndex,
          timestamp,
          amount,
          receivedAt: new Date().toISOString(),
          status: 'available' // available, spent, pending
        });
        
        console.log(`✅ Found note for Bob: ${commitment.slice(0, 10)}... (${amount} ETH)`);
      }
    }
    
    return bobsNotes;
  }

  /**
   * Create withdrawal proof data for Bob's note
   * @param {Object} note - Bob's note with secret and nullifier
   * @returns {Object} - Withdrawal proof data
   */
  createWithdrawalProof(note) {
    // This would integrate with your ZK proof generation
    // For hackathon, return the necessary data
    return {
      nullifierHash: note.nullifier,
      secret: note.secret,
      commitment: note.commitment,
      leafIndex: note.leafIndex,
      // proof: generateZKProof(note) // TODO: Integrate with mopro
    };
  }
}

export const commitmentVerifier = new CommitmentVerifier();
