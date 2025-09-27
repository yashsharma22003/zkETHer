import { createPublicClient, http, parseAbiItem } from 'viem';
import { localhost } from 'viem/chains';
import { DEPLOYED_CONTRACTS } from '../config/deployedContracts';
import { networkService } from './networkService';

export interface DepositEvent {
  user: string;
  amount: string;
  commitment: string;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export interface WithdrawalEvent {
  user: string;
  amount: string;
  nullifierHash: string;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

export interface ClaimEvent {
  identity: string;
  claimType: number;
  blockNumber: bigint;
  transactionHash: string;
  timestamp: number;
}

class ZkETHerEventListener {
  private client: any;
  private isListening: boolean = false;
  private eventCallbacks: Map<string, Function[]> = new Map();

  constructor() {
    this.client = createPublicClient({
      chain: localhost,
      transport: http(DEPLOYED_CONTRACTS.anvil.RPC_URL)
    });
    this.setupEventCallbacks();
  }

  private setupEventCallbacks() {
    this.eventCallbacks.set('deposit', []);
    this.eventCallbacks.set('withdrawal', []);
    this.eventCallbacks.set('claim', []);
    this.eventCallbacks.set('identity', []);
  }

  async startListening(): Promise<void> {
    if (this.isListening) {
      console.log('⚠️ Event listener already running');
      return;
    }

    try {
      console.log('🎧 Starting zkETHer event listener...');
      this.isListening = true;
      this.listenForDeposits();
      this.listenForWithdrawals();
      this.listenForClaims();
      this.listenForIdentityEvents();
      console.log('✅ zkETHer event listener started successfully');
    } catch (error) {
      console.error('❌ Failed to start event listener:', error);
      this.isListening = false;
    }
  }

  stopListening(): void {
    this.isListening = false;
    console.log('🛑 zkETHer event listener stopped');
  }

  private async listenForDeposits() {
    try {
      const unwatch = this.client.watchEvent({
        address: DEPLOYED_CONTRACTS.anvil.ZKETHER_TOKEN as `0x${string}`,
        event: parseAbiItem('event Deposit(address indexed user, uint256 amount, bytes32 commitment)'),
        onLogs: async (logs: any[]) => {
          for (const log of logs) {
            const depositEvent: DepositEvent = {
              user: log.args.user,
              amount: log.args.amount.toString(),
              commitment: log.args.commitment,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              timestamp: Date.now()
            };
            console.log('💰 Deposit detected:', depositEvent);
            this.triggerCallbacks('deposit', depositEvent);
          }
        }
      });
      if (!this.isListening) unwatch();
    } catch (error) {
      console.error('❌ Failed to listen for deposits:', error);
    }
  }

  private async listenForWithdrawals() {
    try {
      const unwatch = this.client.watchEvent({
        address: DEPLOYED_CONTRACTS.anvil.ZKETHER_TOKEN as `0x${string}`,
        event: parseAbiItem('event Withdrawal(address indexed user, uint256 amount, bytes32 nullifierHash)'),
        onLogs: async (logs: any[]) => {
          for (const log of logs) {
            const withdrawalEvent: WithdrawalEvent = {
              user: log.args.user,
              amount: log.args.amount.toString(),
              nullifierHash: log.args.nullifierHash,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              timestamp: Date.now()
            };
            console.log('💸 Withdrawal detected:', withdrawalEvent);
            this.triggerCallbacks('withdrawal', withdrawalEvent);
          }
        }
      });
      if (!this.isListening) unwatch();
    } catch (error) {
      console.error('❌ Failed to listen for withdrawals:', error);
    }
  }

  private async listenForClaims() {
    try {
      const unwatch = this.client.watchEvent({
        address: DEPLOYED_CONTRACTS.anvil.CLAIM_ISSUER as `0x${string}`,
        event: parseAbiItem('event ClaimAdded(address indexed identity, uint256 indexed claimType)'),
        onLogs: async (logs: any[]) => {
          for (const log of logs) {
            const claimEvent: ClaimEvent = {
              identity: log.args.identity,
              claimType: Number(log.args.claimType),
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              timestamp: Date.now()
            };
            console.log('🆔 Claim added:', claimEvent);
            this.triggerCallbacks('claim', claimEvent);
          }
        }
      });
      if (!this.isListening) unwatch();
    } catch (error) {
      console.error('❌ Failed to listen for claims:', error);
    }
  }

  private async listenForIdentityEvents() {
    try {
      const unwatch = this.client.watchEvent({
        address: DEPLOYED_CONTRACTS.anvil.CLAIM_ISSUER as `0x${string}`,
        event: parseAbiItem('event IdentityCreated(address indexed identity)'),
        onLogs: async (logs: any[]) => {
          for (const log of logs) {
            const identityEvent = {
              identity: log.args.identity,
              blockNumber: log.blockNumber,
              transactionHash: log.transactionHash,
              timestamp: Date.now()
            };
            console.log('🆔 Identity created:', identityEvent);
            this.triggerCallbacks('identity', identityEvent);
          }
        }
      });
      if (!this.isListening) unwatch();
    } catch (error) {
      console.error('❌ Failed to listen for identity events:', error);
    }
  }

  onDeposit(callback: (event: DepositEvent) => void): void {
    this.addEventListener('deposit', callback);
  }

  onWithdrawal(callback: (event: WithdrawalEvent) => void): void {
    this.addEventListener('withdrawal', callback);
  }

  onClaim(callback: (event: ClaimEvent) => void): void {
    this.addEventListener('claim', callback);
  }

  onIdentityCreated(callback: (event: any) => void): void {
    this.addEventListener('identity', callback);
  }

  private addEventListener(eventType: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(eventType) || [];
    callbacks.push(callback);
    this.eventCallbacks.set(eventType, callbacks);
  }

  removeEventListener(eventType: string, callback: Function): void {
    const callbacks = this.eventCallbacks.get(eventType) || [];
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
      this.eventCallbacks.set(eventType, callbacks);
    }
  }

  private triggerCallbacks(eventType: string, eventData: any): void {
    const callbacks = this.eventCallbacks.get(eventType) || [];
    callbacks.forEach(callback => {
      try {
        callback(eventData);
      } catch (error) {
        console.error(`❌ Error in ${eventType} callback:`, error);
      }
    });
  }

  async getPastDeposits(fromBlock?: bigint, toBlock?: bigint): Promise<DepositEvent[]> {
    try {
      const logs = await this.client.getLogs({
        address: DEPLOYED_CONTRACTS.anvil.ZKETHER_TOKEN as `0x${string}`,
        event: parseAbiItem('event Deposit(address indexed user, uint256 amount, bytes32 commitment)'),
        fromBlock: fromBlock || BigInt(0),
        toBlock: toBlock || 'latest'
      });

      return logs.map((log: any) => ({
        user: log.args.user,
        amount: log.args.amount.toString(),
        commitment: log.args.commitment,
        blockNumber: log.blockNumber,
        transactionHash: log.transactionHash,
        timestamp: Date.now()
      }));
    } catch (error) {
      console.error('❌ Failed to get past deposits:', error);
      return [];
    }
  }

  isEventListenerActive(): boolean {
    return this.isListening;
  }

  updateContractAddresses(claimIssuer: string, zkETHerToken: string): void {
    console.log('🔄 Updating contract addresses in event listener...');
    this.stopListening();
    console.log(`📍 New Claim Issuer: ${claimIssuer}`);
    console.log(`🪙 New zkETHer Token: ${zkETHerToken}`);
    setTimeout(() => {
      this.startListening();
    }, 1000);
  }
}

export const zkETHerEventListener = new ZkETHerEventListener();
