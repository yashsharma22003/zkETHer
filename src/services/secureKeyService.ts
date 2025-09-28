import * as SecureStore from 'expo-secure-store';
import 'react-native-get-random-values';
import { generateHexKeyPair } from './libsodiumHelper.js';

// React Native crypto is available via the polyfill
// No need to import Node.js crypto module

export interface ZkETHerKeyPair {
  publicKey: string;
  privateKey: string;
  keyId: string;
  createdAt: string;
}

export interface StoredKeyInfo {
  keyId: string;
  publicKey: string;
  createdAt: string;
  onchainId?: string;
}

class SecureKeyService {
  private readonly PRIVATE_KEY_PREFIX = 'zkether_private_';
  private readonly PUBLIC_KEY_PREFIX = 'zkether_public_';
  private readonly KEY_INFO_KEY = 'zkether_key_info';

  /**
   * Generate a cryptographically secure X25519 key pair for zkETHer protocol
   * Uses libsodium for ephemeral X25519 keypair generation
   */
  async generateKeyPair(): Promise<ZkETHerKeyPair> {
    try {
      console.log('🔐 Generating secure zkETHer X25519 key pair...');

      // Generate ephemeral X25519 keypair using libsodium helper
      const cryptoKeyPair = await generateHexKeyPair();
      const publicKey = cryptoKeyPair.publicKey; // this is published on-chain
      const privateKey = cryptoKeyPair.privateKey;

      // Generate unique key ID
      const keyIdBytes = new Uint8Array(16);
      crypto.getRandomValues(keyIdBytes);
      const keyId = Array.from(keyIdBytes)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      const createdAt = new Date().toISOString();

      const zkETHerKeyPair: ZkETHerKeyPair = {
        publicKey,
        privateKey,
        keyId,
        createdAt
      };

      console.log('✅ X25519 key pair generated successfully', {
        keyId,
        publicKey: publicKey.slice(0, 10) + '...',
        createdAt
      });

      return zkETHerKeyPair;
    } catch (error) {
      console.error('❌ Failed to generate X25519 key pair:', error);
      throw new Error('Failed to generate secure X25519 key pair');
    }
  }

  /**
   * Store key pair securely using Android Keystore (via Expo SecureStore)
   * Private key is stored with hardware-backed security
   * Public key info is stored for easy retrieval
   */
  async storeKeyPair(keyPair: ZkETHerKeyPair, onchainId?: string): Promise<void> {
    try {
      console.log('🔒 Storing key pair securely...', { keyId: keyPair.keyId });

      // Store private key with maximum security
      await SecureStore.setItemAsync(
        `${this.PRIVATE_KEY_PREFIX}${keyPair.keyId}`,
        keyPair.privateKey,
        {
          requireAuthentication: true, // Require biometric/PIN authentication
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );

      // Store public key (less sensitive, but still secure)
      await SecureStore.setItemAsync(
        `${this.PUBLIC_KEY_PREFIX}${keyPair.keyId}`,
        keyPair.publicKey,
        {
          keychainAccessible: SecureStore.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
        }
      );

      // Store key metadata for easy retrieval
      const keyInfo: StoredKeyInfo = {
        keyId: keyPair.keyId,
        publicKey: keyPair.publicKey,
        createdAt: keyPair.createdAt,
        onchainId
      };

      await SecureStore.setItemAsync(
        this.KEY_INFO_KEY,
        JSON.stringify(keyInfo)
      );

      console.log('✅ Key pair stored securely in Android Keystore');
    } catch (error) {
      console.error('❌ Failed to store key pair:', error);
      throw new Error('Failed to store key pair securely');
    }
  }

  /**
   * Retrieve public key (doesn't require authentication)
   */
  async getPublicKey(): Promise<string | null> {
    try {
      const keyInfo = await this.getKeyInfo();
      return keyInfo?.publicKey || null;
    } catch (error) {
      console.error('❌ Failed to get public key:', error);
      return null;
    }
  }

  /**
   * Retrieve private key (requires biometric/PIN authentication)
   */
  async getPrivateKey(): Promise<string | null> {
    try {
      const keyInfo = await this.getKeyInfo();
      if (!keyInfo) return null;

      const privateKey = await SecureStore.getItemAsync(
        `${this.PRIVATE_KEY_PREFIX}${keyInfo.keyId}`
      );

      return privateKey;
    } catch (error) {
      console.error('❌ Failed to get private key:', error);
      return null;
    }
  }

  /**
   * Get key information without accessing private key
   */
  async getKeyInfo(): Promise<StoredKeyInfo | null> {
    try {
      const keyInfoJson = await SecureStore.getItemAsync(this.KEY_INFO_KEY);
      return keyInfoJson ? JSON.parse(keyInfoJson) : null;
    } catch (error) {
      console.error('❌ Failed to get key info:', error);
      return null;
    }
  }

  /**
   * Check if user has generated keys
   */
  async hasKeys(): Promise<boolean> {
    try {
      const keyInfo = await this.getKeyInfo();
      return keyInfo !== null;
    } catch (error) {
      console.error('❌ Failed to check if keys exist:', error);
      return false;
    }
  }

  /**
   * Generate and store new key pair
   */
  async generateAndStoreKeys(onchainId?: string): Promise<StoredKeyInfo> {
    try {
      console.log('🚀 Starting secure key generation process...');
      
      // Check if keys already exist
      const existingKeys = await this.hasKeys();
      if (existingKeys) {
        console.log('⚠️ Keys already exist, retrieving existing keys');
        const keyInfo = await this.getKeyInfo();
        if (keyInfo) return keyInfo;
      }

      // Generate new key pair
      const keyPair = await this.generateKeyPair();
      
      // Store securely
      await this.storeKeyPair(keyPair, onchainId);

      // Return key info
      return {
        keyId: keyPair.keyId,
        publicKey: keyPair.publicKey,
        createdAt: keyPair.createdAt,
        onchainId
      };
    } catch (error) {
      console.error('❌ Failed to generate and store keys:', error);
      throw error;
    }
  }

  /**
   * Delete all stored keys (for testing or reset)
   */
  async deleteKeys(): Promise<void> {
    try {
      const keyInfo = await this.getKeyInfo();
      if (keyInfo) {
        await SecureStore.deleteItemAsync(`${this.PRIVATE_KEY_PREFIX}${keyInfo.keyId}`);
        await SecureStore.deleteItemAsync(`${this.PUBLIC_KEY_PREFIX}${keyInfo.keyId}`);
      }
      await SecureStore.deleteItemAsync(this.KEY_INFO_KEY);
      console.log('✅ All keys deleted successfully');
    } catch (error) {
      console.error('❌ Failed to delete keys:', error);
      throw error;
    }
  }
}

export const secureKeyService = new SecureKeyService();
