import sodium from 'libsodium-wrappers';

/**
 * JavaScript wrapper for libsodium operations to avoid TypeScript type issues
 * This file handles all libsodium-specific cryptographic operations
 */

/**
 * Generate an X25519 key pair using libsodium
 * @returns {Promise<{publicKey: Uint8Array, privateKey: Uint8Array}>}
 */
export async function generateX25519KeyPair() {
  try {
    // Ensure sodium is ready
    await sodium.ready;
    
    // Generate ephemeral X25519 keypair using libsodium
    const keyPair = sodium.crypto_kx_keypair();
    
    return {
      publicKey: keyPair.publicKey,
      privateKey: keyPair.privateKey
    };
  } catch (error) {
    console.error('❌ Failed to generate X25519 key pair with libsodium:', error);
    throw new Error('Failed to generate X25519 key pair');
  }
}

/**
 * Convert Uint8Array to hex string with 0x prefix
 * @param {Uint8Array} bytes 
 * @returns {string}
 */
export function bytesToHex(bytes) {
  return '0x' + Buffer.from(bytes).toString('hex');
}

/**
 * Convert hex string (with or without 0x prefix) to Uint8Array
 * @param {string} hex 
 * @returns {Uint8Array}
 */
export function hexToBytes(hex) {
  const cleanHex = hex.startsWith('0x') ? hex.slice(2) : hex;
  return new Uint8Array(Buffer.from(cleanHex, 'hex'));
}

/**
 * Generate a complete X25519 key pair with hex encoding
 * @returns {Promise<{publicKey: string, privateKey: string}>}
 */
export async function generateHexKeyPair() {
  try {
    const keyPair = await generateX25519KeyPair();
    
    return {
      publicKey: bytesToHex(keyPair.publicKey),
      privateKey: bytesToHex(keyPair.privateKey)
    };
  } catch (error) {
    console.error('❌ Failed to generate hex key pair:', error);
    throw error;
  }
}
