import sodium from "libsodium-wrappers";
import CryptoJS from "crypto-js";
import { poseidon2Hash } from "@zkpassport/poseidon2";

/**
 * Commitment Service for zkETHer
 * Creates Poseidon-based commitments for private note transfers
 * EXACT implementation matching the original note-derive-poseidon.js
 */

// Simple HKDF-Extract+Expand (SHA256) - EXACT replica of original
async function hkdfSha256(secret, info, length = 32) {
  const salt = Buffer.alloc(32, 0);
  
  // HKDF Extract: PRK = HMAC-SHA256(salt, secret) - using CryptoJS equivalent
  const saltWords = CryptoJS.lib.WordArray.create(Array.from(salt));
  const secretWords = CryptoJS.lib.WordArray.create(Array.from(secret));
  const prk = CryptoJS.HmacSHA256(secretWords, saltWords);
  
  // HKDF Expand - exactly like original
  let prev = Buffer.alloc(0);
  const output = Buffer.alloc(length);
  const blocks = Math.ceil(length / 32);
  let outPos = 0;

  for (let i = 0; i < blocks; i++) {
    // T(i) = HMAC-SHA256(PRK, T(i-1) || info || i)
    const prevWords = CryptoJS.lib.WordArray.create(Array.from(prev));
    const infoWords = CryptoJS.lib.WordArray.create(Array.from(Buffer.from(info)));
    const counterWords = CryptoJS.lib.WordArray.create([i + 1]);
    const input = prevWords.concat(infoWords).concat(counterWords);
    
    const hmacResult = CryptoJS.HmacSHA256(input, prk);
    prev = Buffer.from(hmacResult.toString(), 'hex');
    
    const take = Math.min(32, length - outPos);
    prev.copy(output, outPos, 0, take);
    outPos += take;
  }
  return output;
}

// Poseidon wrapper to hash bytes (Buffer) -> BigInt array
function poseidonHashBytes(...buffers) {
  const flat = buffers.map((b) => [...b].map((x) => BigInt(x))).flat();
  return poseidon2Hash(flat);
}

/**
 * Creates a commitment for Alice to send to Bob
 * @param {string|Buffer} bobX25519Pub - Bob's X25519 public key (hex string or Buffer)
 * @returns {Promise<{commitment: string, R_pub_hex: string}>}
 */
export async function createCommitmentForRecipient(bobX25519Pub) {
  console.log('🔐 [CommitmentService] Starting commitment creation...');
  console.log('📋 [CommitmentService] Bob\'s public key:', bobX25519Pub);
  
  await sodium.ready;

  // Convert hex string to Buffer if needed
  const bobPubKey = typeof bobX25519Pub === 'string' 
    ? Buffer.from(bobX25519Pub.replace('0x', ''), 'hex')
    : Buffer.from(bobX25519Pub);

  console.log('🔑 [CommitmentService] Bob\'s key length:', bobPubKey.length, 'bytes');

  // 1) Ephemeral X25519 keypair
  console.log('⚡ [CommitmentService] Generating ephemeral keypair...');
  const eph = sodium.crypto_kx_keypair();
  const R_pub = Buffer.from(eph.publicKey); // to publish
  const R_priv = Buffer.from(eph.privateKey); // ephemeral secret

  console.log('📤 [CommitmentService] Ephemeral public key (R):', R_pub.toString('hex'));

  // 2) Compute shared secret
  console.log('🤝 [CommitmentService] Computing shared secret...');
  const shared = sodium.crypto_scalarmult(R_priv, bobPubKey);
  console.log('🔒 [CommitmentService] Shared secret computed, length:', shared.length, 'bytes');

  // 3) Derive secret and nullifier
  console.log('🧮 [CommitmentService] Deriving secret and nullifier using HKDF...');
  const secret = await hkdfSha256(shared, "string1", 32);
  const nullifier = await hkdfSha256(shared, "string2", 32);

  console.log('🎯 [CommitmentService] Secret derived:', secret.toString('hex').substring(0, 16) + '...');
  console.log('🎯 [CommitmentService] Nullifier derived:', nullifier.toString('hex').substring(0, 16) + '...');

  // 4) Poseidon commitment
  console.log('🌀 [CommitmentService] Computing Poseidon hash...');
  const commitment = poseidonHashBytes(secret, nullifier);
  console.log('✅ [CommitmentService] Commitment created:', commitment.toString());

  const result = {
    commitment: commitment.toString(),
    R_pub_hex: Buffer.from(R_pub).toString("hex"),
    // Additional data for debugging/verification
    secret_hex: secret.toString("hex"),
    nullifier_hex: nullifier.toString("hex")
  };

  console.log('🎉 [CommitmentService] Commitment generation completed successfully!');
  console.log('📊 [CommitmentService] Result summary:', {
    commitment: result.commitment.substring(0, 20) + '...',
    R_pub_hex: result.R_pub_hex.substring(0, 20) + '...',
    secretLength: result.secret_hex.length,
    nullifierLength: result.nullifier_hex.length
  });

  // 5) Return commitment data for on-chain publishing
  return result;
}

/**
 * Derives secret from published commitment data (for Bob)
 * @param {string} R_pub_hex - Ephemeral public key from Alice
 * @param {string|Buffer} bobX25519Priv - Bob's X25519 private key
 * @returns {Promise<{secret: string, nullifier: string, commitmentCheck: string}>}
 */
export async function deriveSecretFromCommitment(R_pub_hex, bobX25519Priv) {
  await sodium.ready;

  const R_pub = Buffer.from(R_pub_hex, "hex");
  const bobPriv = typeof bobX25519Priv === 'string'
    ? Buffer.from(bobX25519Priv.replace('0x', ''), 'hex')
    : Buffer.from(bobX25519Priv);

  // Recompute shared secret
  const shared = sodium.crypto_scalarmult(bobPriv, R_pub);

  // Derive same secret & nullifier
  const secret = await hkdfSha256(shared, "string1", 32);
  const nullifier = await hkdfSha256(shared, "string2", 32);

  // Compute Poseidon commitment for verification
  const commitmentCheck = poseidonHashBytes(secret, nullifier);

  return {
    secret: secret.toString("hex"),
    nullifier: nullifier.toString("hex"),
    commitmentCheck: commitmentCheck.toString(),
  };
}

/**
 * Generates a demo commitment (for testing without real keys)
 * @param {string} recipientAddress - Recipient's address for display
 * @returns {Promise<{commitment: string, R_pub_hex: string, demo: boolean}>}
 */
export async function createDemoCommitment(recipientAddress) {
  await sodium.ready;

  // Generate demo keys
  const bob = sodium.crypto_kx_keypair();
  const bobPubHex = Buffer.from(bob.publicKey).toString("hex");

  // Create commitment using demo keys
  const commitmentData = await createCommitmentForRecipient(bobPubHex);

  return {
    ...commitmentData,
    demo: true,
    recipientAddress,
    demoNote: "This is a demo commitment for testing purposes"
  };
}

/**
 * Validates if a string is a valid X25519 public key
 * @param {string} publicKey - Public key to validate
 * @returns {boolean}
 */
export function isValidX25519PublicKey(publicKey) {
  try {
    const cleaned = publicKey.replace('0x', '');
    if (cleaned.length !== 64) return false; // 32 bytes = 64 hex chars
    
    const buffer = Buffer.from(cleaned, 'hex');
    return buffer.length === 32;
  } catch (error) {
    return false;
  }
}

// Demo function for testing
export async function runCommitmentDemo() {
  await sodium.ready;

  console.log("🔐 zkETHer Commitment Demo");
  
  // Bob generates long-term X25519 keys
  const bob = sodium.crypto_kx_keypair();
  const bobPubHex = Buffer.from(bob.publicKey).toString("hex");
  const bobPrivHex = Buffer.from(bob.privateKey).toString("hex");

  console.log("👤 Bob's public key:", bobPubHex);

  // Alice creates commitment for Bob
  const aliceCommitment = await createCommitmentForRecipient(bobPubHex);
  console.log("📝 Alice's commitment:", aliceCommitment);

  // Bob derives secret from commitment
  const bobSecret = await deriveSecretFromCommitment(aliceCommitment.R_pub_hex, bobPrivHex);
  console.log("🔓 Bob's derived data:", bobSecret);

  // Verify commitments match
  const commitmentsMatch = aliceCommitment.commitment === bobSecret.commitmentCheck;
  console.log("✅ Commitments match:", commitmentsMatch);

  return {
    success: commitmentsMatch,
    aliceCommitment,
    bobSecret
  };
}
