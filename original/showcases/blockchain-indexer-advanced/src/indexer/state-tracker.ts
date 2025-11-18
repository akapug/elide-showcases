import { Pool, PoolClient } from 'pg';
import { ethers } from 'ethers';
import { TimeSeriesDB } from '../storage/time-series-db';
import { logger } from '../utils/logger';
import { LRUCache } from 'lru-cache';

interface AddressState {
  address: string;
  balance: bigint;
  nonce: number;
  isContract: boolean;
  code?: string;
  storage: Map<string, string>;
  lastUpdated: number;
}

interface TokenBalance {
  address: string;
  token: string;
  balance: bigint;
  tokenType: 'ERC20' | 'ERC721' | 'ERC1155';
  lastUpdated: number;
}

interface ERC721Token {
  tokenAddress: string;
  tokenId: bigint;
  owner: string;
  metadata?: any;
  lastUpdated: number;
}

interface ERC1155Balance {
  address: string;
  tokenAddress: string;
  tokenId: bigint;
  balance: bigint;
  lastUpdated: number;
}

interface StateSnapshot {
  blockNumber: number;
  timestamp: number;
  states: Map<string, AddressState>;
}

interface BalanceChange {
  address: string;
  previousBalance: bigint;
  newBalance: bigint;
  delta: bigint;
  blockNumber: number;
  transactionHash: string;
}

export class StateTracker {
  private pgPool: Pool;
  private timeSeriesDB: TimeSeriesDB;
  private stateCache: LRUCache<string, AddressState>;
  private tokenBalanceCache: LRUCache<string, TokenBalance>;
  private checkpointInterval: number;
  private lastCheckpoint: number;
  private pendingUpdates: Map<string, AddressState>;
  private balanceChanges: BalanceChange[];

  constructor(pgPool: Pool, timeSeriesDB: TimeSeriesDB) {
    this.pgPool = pgPool;
    this.timeSeriesDB = timeSeriesDB;

    this.checkpointInterval = parseInt(process.env.STATE_CHECKPOINT_INTERVAL || '10000', 10);
    this.lastCheckpoint = 0;
    this.pendingUpdates = new Map();
    this.balanceChanges = [];

    // Cache configuration
    this.stateCache = new LRUCache<string, AddressState>({
      max: 100000,
      ttl: 1000 * 60 * 5, // 5 minutes
      updateAgeOnGet: true,
    });

    this.tokenBalanceCache = new LRUCache<string, TokenBalance>({
      max: 50000,
      ttl: 1000 * 60 * 5,
      updateAgeOnGet: true,
    });
  }

  async updateFromBlock(
    client: PoolClient,
    block: ethers.Block,
    transactions: ethers.TransactionResponse[]
  ): Promise<void> {
    const blockNumber = block.number;

    // Track all addresses involved in this block
    const affectedAddresses = new Set<string>();

    for (const tx of transactions) {
      affectedAddresses.add(tx.from.toLowerCase());
      if (tx.to) {
        affectedAddresses.add(tx.to.toLowerCase());
      }

      // Update state for transaction participants
      await this.updateAddressFromTransaction(client, block, tx);
    }

    // Batch update states
    await this.flushPendingUpdates(client, blockNumber);

    // Create checkpoint if needed
    if (blockNumber - this.lastCheckpoint >= this.checkpointInterval) {
      await this.createStateCheckpoint(client, blockNumber, block.timestamp);
      this.lastCheckpoint = blockNumber;
    }

    // Record balance changes
    await this.recordBalanceChanges(client, blockNumber);
  }

  private async updateAddressFromTransaction(
    client: PoolClient,
    block: ethers.Block,
    tx: ethers.TransactionResponse
  ): Promise<void> {
    const blockNumber = block.number;

    // Update sender
    const sender = tx.from.toLowerCase();
    const senderState = await this.getOrCreateState(client, sender, blockNumber);

    // Deduct value sent
    senderState.balance -= tx.value;
    senderState.nonce = tx.nonce + 1;
    senderState.lastUpdated = blockNumber;

    this.pendingUpdates.set(sender, senderState);

    // Track balance change
    this.balanceChanges.push({
      address: sender,
      previousBalance: senderState.balance + tx.value,
      newBalance: senderState.balance,
      delta: -tx.value,
      blockNumber,
      transactionHash: tx.hash,
    });

    // Update receiver if exists
    if (tx.to) {
      const receiver = tx.to.toLowerCase();
      const receiverState = await this.getOrCreateState(client, receiver, blockNumber);

      receiverState.balance += tx.value;
      receiverState.lastUpdated = blockNumber;

      this.pendingUpdates.set(receiver, receiverState);

      // Track balance change
      this.balanceChanges.push({
        address: receiver,
        previousBalance: receiverState.balance - tx.value,
        newBalance: receiverState.balance,
        delta: tx.value,
        blockNumber,
        transactionHash: tx.hash,
      });
    }

    // Handle contract creation
    if (!tx.to) {
      const contractAddress = ethers.getCreateAddress({
        from: tx.from,
        nonce: tx.nonce,
      }).toLowerCase();

      const contractState = await this.getOrCreateState(client, contractAddress, blockNumber);
      contractState.isContract = true;
      contractState.balance = tx.value;
      contractState.lastUpdated = blockNumber;

      this.pendingUpdates.set(contractAddress, contractState);
    }
  }

  private async getOrCreateState(
    client: PoolClient,
    address: string,
    blockNumber: number
  ): Promise<AddressState> {
    // Check cache
    const cached = this.stateCache.get(address);
    if (cached) {
      return { ...cached }; // Return copy to avoid mutation
    }

    // Check database
    const result = await client.query(
      `SELECT balance, nonce, is_contract, code
       FROM address_states
       WHERE address = $1
       ORDER BY block_number DESC
       LIMIT 1`,
      [address]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      const state: AddressState = {
        address,
        balance: BigInt(row.balance || 0),
        nonce: row.nonce || 0,
        isContract: row.is_contract || false,
        code: row.code,
        storage: new Map(),
        lastUpdated: blockNumber,
      };

      this.stateCache.set(address, state);
      return { ...state };
    }

    // Create new state
    const newState: AddressState = {
      address,
      balance: 0n,
      nonce: 0,
      isContract: false,
      storage: new Map(),
      lastUpdated: blockNumber,
    };

    return newState;
  }

  private async flushPendingUpdates(client: PoolClient, blockNumber: number): Promise<void> {
    if (this.pendingUpdates.size === 0) return;

    const updates = Array.from(this.pendingUpdates.entries());

    // Batch insert/update
    for (const [address, state] of updates) {
      await client.query(
        `INSERT INTO address_states (
          address, block_number, balance, nonce, is_contract, code
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (address, block_number) DO UPDATE SET
          balance = EXCLUDED.balance,
          nonce = EXCLUDED.nonce,
          is_contract = EXCLUDED.is_contract,
          code = EXCLUDED.code`,
        [
          address,
          blockNumber,
          state.balance.toString(),
          state.nonce,
          state.isContract,
          state.code || null,
        ]
      );

      // Update current state table
      await client.query(
        `INSERT INTO current_states (
          address, balance, nonce, is_contract, code, last_updated
        ) VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (address) DO UPDATE SET
          balance = EXCLUDED.balance,
          nonce = EXCLUDED.nonce,
          is_contract = EXCLUDED.is_contract,
          code = EXCLUDED.code,
          last_updated = EXCLUDED.last_updated`,
        [
          address,
          state.balance.toString(),
          state.nonce,
          state.isContract,
          state.code || null,
          blockNumber,
        ]
      );

      // Update cache
      this.stateCache.set(address, state);
    }

    this.pendingUpdates.clear();

    logger.debug('Flushed state updates', {
      blockNumber,
      updatesCount: updates.length,
    });
  }

  private async recordBalanceChanges(client: PoolClient, blockNumber: number): Promise<void> {
    if (this.balanceChanges.length === 0) return;

    for (const change of this.balanceChanges) {
      await client.query(
        `INSERT INTO balance_changes (
          address, block_number, transaction_hash,
          previous_balance, new_balance, delta
        ) VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          change.address,
          blockNumber,
          change.transactionHash,
          change.previousBalance.toString(),
          change.newBalance.toString(),
          change.delta.toString(),
        ]
      );

      // Record in time-series DB
      await this.timeSeriesDB.recordBalanceChange({
        timestamp: new Date(),
        address: change.address,
        balance: change.newBalance,
        delta: change.delta,
        blockNumber,
      });
    }

    this.balanceChanges = [];
  }

  async updateTokenBalance(
    client: PoolClient,
    address: string,
    tokenAddress: string,
    delta: bigint,
    blockNumber: number,
    transactionHash: string
  ): Promise<void> {
    const key = `${address}:${tokenAddress}`;

    // Get current balance
    let current = this.tokenBalanceCache.get(key);

    if (!current) {
      const result = await client.query(
        `SELECT balance, token_type FROM token_balances
         WHERE address = $1 AND token_address = $2`,
        [address, tokenAddress]
      );

      if (result.rows.length > 0) {
        current = {
          address,
          token: tokenAddress,
          balance: BigInt(result.rows[0].balance),
          tokenType: result.rows[0].token_type,
          lastUpdated: blockNumber,
        };
      } else {
        current = {
          address,
          token: tokenAddress,
          balance: 0n,
          tokenType: 'ERC20', // Default, should be detected
          lastUpdated: blockNumber,
        };
      }
    }

    // Update balance
    const previousBalance = current.balance;
    current.balance += delta;
    current.lastUpdated = blockNumber;

    // Store update
    await client.query(
      `INSERT INTO token_balances (
        address, token_address, balance, token_type, last_updated
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (address, token_address) DO UPDATE SET
        balance = EXCLUDED.balance,
        last_updated = EXCLUDED.last_updated`,
      [address, tokenAddress, current.balance.toString(), current.tokenType, blockNumber]
    );

    // Record history
    await client.query(
      `INSERT INTO token_balance_history (
        address, token_address, block_number, transaction_hash,
        previous_balance, new_balance, delta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        address,
        tokenAddress,
        blockNumber,
        transactionHash,
        previousBalance.toString(),
        current.balance.toString(),
        delta.toString(),
      ]
    );

    // Update cache
    this.tokenBalanceCache.set(key, current);

    logger.debug('Updated token balance', {
      address,
      tokenAddress,
      previousBalance: previousBalance.toString(),
      newBalance: current.balance.toString(),
      delta: delta.toString(),
    });
  }

  async updateERC721Owner(
    client: PoolClient,
    tokenAddress: string,
    tokenId: bigint,
    newOwner: string,
    blockNumber: number,
    transactionHash: string
  ): Promise<void> {
    // Get previous owner
    const result = await client.query(
      `SELECT owner FROM erc721_tokens
       WHERE token_address = $1 AND token_id = $2`,
      [tokenAddress, tokenId.toString()]
    );

    const previousOwner = result.rows.length > 0 ? result.rows[0].owner : null;

    // Update owner
    await client.query(
      `INSERT INTO erc721_tokens (
        token_address, token_id, owner, last_updated
      ) VALUES ($1, $2, $3, $4)
      ON CONFLICT (token_address, token_id) DO UPDATE SET
        owner = EXCLUDED.owner,
        last_updated = EXCLUDED.last_updated`,
      [tokenAddress, tokenId.toString(), newOwner, blockNumber]
    );

    // Record transfer history
    await client.query(
      `INSERT INTO erc721_transfers (
        token_address, token_id, from_address, to_address,
        block_number, transaction_hash
      ) VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        tokenAddress,
        tokenId.toString(),
        previousOwner,
        newOwner,
        blockNumber,
        transactionHash,
      ]
    );

    logger.debug('Updated ERC721 owner', {
      tokenAddress,
      tokenId: tokenId.toString(),
      previousOwner,
      newOwner,
    });
  }

  async updateERC1155Balance(
    client: PoolClient,
    address: string,
    tokenAddress: string,
    tokenId: bigint,
    delta: bigint,
    blockNumber: number,
    transactionHash: string
  ): Promise<void> {
    // Get current balance
    const result = await client.query(
      `SELECT balance FROM erc1155_balances
       WHERE address = $1 AND token_address = $2 AND token_id = $3`,
      [address, tokenAddress, tokenId.toString()]
    );

    const previousBalance = result.rows.length > 0 ? BigInt(result.rows[0].balance) : 0n;
    const newBalance = previousBalance + delta;

    // Update balance
    await client.query(
      `INSERT INTO erc1155_balances (
        address, token_address, token_id, balance, last_updated
      ) VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (address, token_address, token_id) DO UPDATE SET
        balance = EXCLUDED.balance,
        last_updated = EXCLUDED.last_updated`,
      [address, tokenAddress, tokenId.toString(), newBalance.toString(), blockNumber]
    );

    // Record history
    await client.query(
      `INSERT INTO erc1155_balance_history (
        address, token_address, token_id, block_number, transaction_hash,
        previous_balance, new_balance, delta
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        address,
        tokenAddress,
        tokenId.toString(),
        blockNumber,
        transactionHash,
        previousBalance.toString(),
        newBalance.toString(),
        delta.toString(),
      ]
    );
  }

  private async createStateCheckpoint(
    client: PoolClient,
    blockNumber: number,
    timestamp: number
  ): Promise<void> {
    logger.info('Creating state checkpoint', { blockNumber });

    try {
      // Create checkpoint record
      await client.query(
        `INSERT INTO state_checkpoints (
          block_number, timestamp, total_addresses, total_contracts
        )
        SELECT
          $1,
          $2,
          COUNT(*),
          COUNT(*) FILTER (WHERE is_contract = true)
        FROM current_states`,
        [blockNumber, timestamp]
      );

      // Archive old states (keep last N checkpoints)
      const retentionBlocks = parseInt(process.env.STATE_RETENTION_BLOCKS || '100000', 10);
      const archiveThreshold = blockNumber - retentionBlocks;

      await client.query(
        `DELETE FROM address_states
         WHERE block_number < $1
         AND block_number NOT IN (
           SELECT block_number FROM state_checkpoints
           ORDER BY block_number DESC
           LIMIT 10
         )`,
        [archiveThreshold]
      );

      logger.info('State checkpoint created', {
        blockNumber,
        archivedBelow: archiveThreshold,
      });
    } catch (error) {
      logger.error('Failed to create state checkpoint', { error, blockNumber });
      throw error;
    }
  }

  async getAddressState(address: string, blockNumber?: number): Promise<AddressState | null> {
    // If no block specified, get current state
    if (!blockNumber) {
      const cached = this.stateCache.get(address);
      if (cached) return cached;

      const result = await this.pgPool.query(
        `SELECT * FROM current_states WHERE address = $1`,
        [address.toLowerCase()]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      const state: AddressState = {
        address: row.address,
        balance: BigInt(row.balance),
        nonce: row.nonce,
        isContract: row.is_contract,
        code: row.code,
        storage: new Map(),
        lastUpdated: row.last_updated,
      };

      this.stateCache.set(address, state);
      return state;
    }

    // Get historical state
    const result = await this.pgPool.query(
      `SELECT * FROM address_states
       WHERE address = $1 AND block_number <= $2
       ORDER BY block_number DESC
       LIMIT 1`,
      [address.toLowerCase(), blockNumber]
    );

    if (result.rows.length === 0) return null;

    const row = result.rows[0];
    return {
      address: row.address,
      balance: BigInt(row.balance),
      nonce: row.nonce,
      isContract: row.is_contract,
      code: row.code,
      storage: new Map(),
      lastUpdated: row.block_number,
    };
  }

  async getTokenBalance(
    address: string,
    tokenAddress: string,
    blockNumber?: number
  ): Promise<bigint> {
    const key = `${address}:${tokenAddress}`;

    // Current balance
    if (!blockNumber) {
      const cached = this.tokenBalanceCache.get(key);
      if (cached) return cached.balance;

      const result = await this.pgPool.query(
        `SELECT balance FROM token_balances
         WHERE address = $1 AND token_address = $2`,
        [address.toLowerCase(), tokenAddress.toLowerCase()]
      );

      if (result.rows.length === 0) return 0n;
      return BigInt(result.rows[0].balance);
    }

    // Historical balance
    const result = await this.pgPool.query(
      `SELECT new_balance FROM token_balance_history
       WHERE address = $1 AND token_address = $2 AND block_number <= $3
       ORDER BY block_number DESC
       LIMIT 1`,
      [address.toLowerCase(), tokenAddress.toLowerCase(), blockNumber]
    );

    if (result.rows.length === 0) return 0n;
    return BigInt(result.rows[0].new_balance);
  }

  async getBalanceHistory(
    address: string,
    fromBlock: number,
    toBlock: number
  ): Promise<BalanceChange[]> {
    const result = await this.pgPool.query(
      `SELECT * FROM balance_changes
       WHERE address = $1
       AND block_number >= $2
       AND block_number <= $3
       ORDER BY block_number ASC`,
      [address.toLowerCase(), fromBlock, toBlock]
    );

    return result.rows.map(row => ({
      address: row.address,
      previousBalance: BigInt(row.previous_balance),
      newBalance: BigInt(row.new_balance),
      delta: BigInt(row.delta),
      blockNumber: row.block_number,
      transactionHash: row.transaction_hash,
    }));
  }

  async getTopHolders(tokenAddress: string, limit: number = 100): Promise<Array<{
    address: string;
    balance: bigint;
  }>> {
    const result = await this.pgPool.query(
      `SELECT address, balance
       FROM token_balances
       WHERE token_address = $1
       ORDER BY balance DESC
       LIMIT $2`,
      [tokenAddress.toLowerCase(), limit]
    );

    return result.rows.map(row => ({
      address: row.address,
      balance: BigInt(row.balance),
    }));
  }

  async getRichList(limit: number = 100): Promise<Array<{
    address: string;
    balance: bigint;
    isContract: boolean;
  }>> {
    const result = await this.pgPool.query(
      `SELECT address, balance, is_contract
       FROM current_states
       ORDER BY balance DESC
       LIMIT $1`,
      [limit]
    );

    return result.rows.map(row => ({
      address: row.address,
      balance: BigInt(row.balance),
      isContract: row.is_contract,
    }));
  }

  clearCache(): void {
    this.stateCache.clear();
    this.tokenBalanceCache.clear();
    this.pendingUpdates.clear();
    this.balanceChanges = [];
    logger.info('State tracker cache cleared');
  }
}
