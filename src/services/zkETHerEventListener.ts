import { createPublicClient, http, parseAbi, formatEther, keccak256, stringToHex, type PublicClient, type Log } from 'viem';
import { sepolia } from 'viem/chains';
import { commitmentVerifier } from './commitmentVerifier.js';
import { secureKeyService } from './secureKeyService';
import { noteStorageService } from './noteStorageService';

// zkETHer contract ABI - focusing on Deposit event
const ZKETHER_ABI = parseAbi([
  'event Deposit(bytes32 indexed commitment, uint32 leafIndex, uint256 timestamp)',
  'function getContractBalance() external view returns (uint256)'
]);

export interface DepositEvent {
  commitment: string;
  leafIndex: number;
  timestamp: number;
  blockNumber: number;
  transactionHash: string;
  amount?: string; // Will be extracted from transaction value
}

export interface BobsNote {
  commitment: string;
  secret: string;
  nullifier: string;
  leafIndex: number;
  timestamp: number;
  amount: string;
  receivedAt: string;
  status: 'available' | 'spent' | 'pending';
  transactionHash: string;
}

export class ZkETHerEventListener {
  private client: PublicClient;
  public isListening: boolean = false;
  private bobsNotes: BobsNote[] = [];
  private maxNotes: number = 2; // Hackathon limit
  private listeners: ((notes: BobsNote[]) => void)[] = [];
  private unwatch?: () => void;

  constructor(
    private contractAddress: `0x${string}` = '0xf14042705C90aF524CB75d1c90A2Eb567F74eC60', // zkETHer contract deployed address
    private rpcUrl: string = 'https://eth-sepolia.public.blastapi.io' // Ethereum Sepolia testnet
  ) {
    this.client = createPublicClient({
      chain: sepolia,
      transport: http(rpcUrl)
    });
  }

  /**
   * Start listening to zkETHer deposit events
   */
  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ Already listening to zkETHer events');
      return;
    }

    try {
      console.log('🚀 Starting zkETHer event listener...');
      console.log('📍 Contract:', this.contractAddress);
      console.log('🌐 RPC:', this.rpcUrl);
      
      // Test RPC connection
      try {
        const blockNumber = await this.client.getBlockNumber();
        console.log('✅ RPC connection successful, current block:', blockNumber.toString());
      } catch (rpcError) {
        console.error('❌ RPC connection failed:', rpcError);
        throw new Error(`RPC connection failed: ${rpcError}`);
      }

      // Get Bob's private key for commitment verification
      console.log('🔑 Retrieving Bob\'s private key for commitment verification...');
      const bobPrivateKey = await secureKeyService.getPrivateKey();
      if (!bobPrivateKey) {
        console.error('❌ Bob private key not found');
        throw new Error('Bob private key not found. Generate keys first.');
      }
      console.log('✅ Bob private key retrieved successfully');

      // Listen to new Deposit events using viem
      this.unwatch = this.client.watchContractEvent({
        address: this.contractAddress,
        abi: ZKETHER_ABI,
        eventName: 'Deposit',
        onLogs: async (logs: any[]) => {
          console.log(`🎯 Received ${logs.length} Deposit event(s) from zkETHer contract`);
          
          for (const log of logs) {
            const { args, blockNumber, transactionHash } = log;
            if (!args) {
              console.warn('⚠️ Deposit event missing args, skipping');
              continue;
            }
            
            const { commitment, leafIndex, timestamp } = args as {
              commitment: `0x${string}`;
              leafIndex: number;
              timestamp: bigint;
            };

            console.log('📥 Processing Deposit event:', {
              commitment: commitment.slice(0, 10) + '...',
              leafIndex: leafIndex.toString(),
              timestamp: new Date(Number(timestamp) * 1000).toISOString(),
              blockNumber: blockNumber?.toString(),
              txHash: transactionHash
            });

            console.log('🔍 Starting commitment verification for Bob...');

            await this.processDepositEvent({
              commitment,
              leafIndex,
              timestamp: Number(timestamp),
              blockNumber: Number(blockNumber || 0),
              transactionHash: transactionHash || '0x'
            }, bobPrivateKey);
          }
        }
      });

      this.isListening = true;
      console.log('✅ zkETHer event listener started successfully');

    } catch (error) {
      console.error('❌ Failed to start zkETHer event listener:', error);
      throw error;
    }
  }

  /**
   * Stop listening to events
   */
  stopListening(): void {
    if (this.isListening && this.unwatch) {
      this.unwatch();
      this.isListening = false;
      console.log('🛑 zkETHer event listener stopped');
    }
  }

  /**
   * Process a deposit event and check if it belongs to Bob
   */
  private async processDepositEvent(event: DepositEvent, bobPrivateKey: string): Promise<void> {
    try {
      // Check if we've reached the hackathon limit
      if (this.bobsNotes.length >= this.maxNotes) {
        console.log(`⚠️ Reached hackathon limit of ${this.maxNotes} notes. Ignoring new deposits.`);
        return;
      }

      // Get transaction details to extract amount and Alice's public key
      const tx = await this.client.getTransaction({ hash: event.transactionHash as `0x${string}` });
      const txReceipt = await this.client.getTransactionReceipt({ hash: event.transactionHash as `0x${string}` });
      
      if (!tx || !txReceipt) {
        console.error('❌ Could not fetch transaction details');
        return;
      }

      // Extract amount from transaction value
      const amount = formatEther(tx.value || 0n);
      console.log('💰 Transaction amount:', amount, 'ETH');
      
      // For hackathon: Mock Alice's ephemeral public key
      // In real implementation, this would be extracted from the deposit transaction
      const mockAliceEphemeralPubKey = '0x' + Array(64).fill('a').join(''); // Mock 32-byte hex
      console.log('🔑 Using mock Alice ephemeral public key for testing');
      
      // Verify if this commitment belongs to Bob
      console.log('🧮 Running commitment verification algorithm...');
      const verificationResult = await commitmentVerifier.bobDerivesSecret(
        mockAliceEphemeralPubKey,
        bobPrivateKey,
        event.commitment
      ) as any;
      
      console.log('✅ Commitment verification completed:', {
        isForBob: verificationResult.isForBob,
        computedCommitment: verificationResult.commitmentCheck?.slice(0, 10) + '...',
        expectedCommitment: event.commitment.slice(0, 10) + '...'
      });

      if (verificationResult.isForBob) {
        console.log('🎯 This commitment belongs to Bob! Creating withdrawable note...');
        
        const bobsNote: BobsNote = {
          commitment: event.commitment,
          secret: verificationResult.secret,
          nullifier: verificationResult.nullifier,
          leafIndex: event.leafIndex,
          timestamp: event.timestamp,
          amount,
          receivedAt: new Date().toISOString(),
          status: 'available',
          transactionHash: event.transactionHash
        };

        this.bobsNotes.push(bobsNote);
        console.log(`🎉 New note for Bob! Total notes: ${this.bobsNotes.length}/${this.maxNotes}`);
        console.log('📝 Note details:', {
          amount: bobsNote.amount + ' ETH',
          leafIndex: bobsNote.leafIndex,
          status: bobsNote.status,
          receivedAt: bobsNote.receivedAt
        });

        // Store note securely
        console.log('💾 Storing note securely...');
        await noteStorageService.addNote(bobsNote);
        console.log('✅ Note stored successfully');
        
        // Notify listeners
        console.log('📢 Notifying UI listeners of new note...');
        this.notifyListeners();
        
        // Check hackathon limit
        if (this.bobsNotes.length >= this.maxNotes) {
          console.log('⚠️ Hackathon limit reached: stopping event listener');
          this.stopListening();
        }
      } else {
        console.log('❌ Commitment does not belong to Bob - skipping');
      }
    } catch (error) {
      console.error('❌ Error processing deposit event:', error);
    }
  }

  /**
   * Generate mock ephemeral key for hackathon
   * In real implementation, Alice would include her ephemeral public key in transaction data
   */
  private generateMockEphemeralKey(commitment: string): string {
    // Create deterministic mock key based on commitment for testing
    const hash = keccak256(stringToHex(commitment + 'alice_ephemeral'));
    return hash.slice(0, 66); // 32 bytes hex
  }

  /**
   * Get Bob's available notes for withdrawal
   */
  getBobsNotes(): BobsNote[] {
    return this.bobsNotes.filter(note => note.status === 'available');
  }

  /**
   * Mark a note as spent
   */
  markNoteAsSpent(commitment: string): void {
    const note = this.bobsNotes.find(n => n.commitment === commitment);
    if (note) {
      note.status = 'spent';
      this.notifyListeners();
      console.log('✅ Note marked as spent:', commitment.slice(0, 10) + '...');
    }
  }

  /**
   * Subscribe to note updates
   */
  onNotesUpdated(callback: (notes: BobsNote[]) => void): void {
    this.listeners.push(callback);
  }

  /**
   * Unsubscribe from note updates
   */
  removeListener(callback: (notes: BobsNote[]) => void): void {
    const index = this.listeners.indexOf(callback);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of note updates
   */
  private notifyListeners(): void {
    const availableNotes = this.getBobsNotes();
    this.listeners.forEach(callback => callback(availableNotes));
  }

  /**
   * Get listening status
   */
  getStatus(): { isListening: boolean; notesCount: number; maxNotes: number } {
    return {
      isListening: this.isListening,
      notesCount: this.bobsNotes.length,
      maxNotes: this.maxNotes
    };
  }

  /**
   * Clear all notes (for testing)
   */
  clearNotes(): void {
    this.bobsNotes = [];
    this.notifyListeners();
    console.log('🗑️ All notes cleared');
  }
}

// Create a singleton instance with deployed contract address
export const zkETHerEventListener = new ZkETHerEventListener(
  '0xf14042705C90aF524CB75d1c90A2Eb567F74eC60' // zkETHer contract deployed address
);
