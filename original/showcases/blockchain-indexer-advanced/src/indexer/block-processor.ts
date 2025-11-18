import { Pool, PoolClient } from 'pg';
import { ethers } from 'ethers';
import pLimit from 'p-limit';
import PQueue from 'p-queue';
import { EventEmitter } from 'events';
import { TimeSeriesDB } from '../storage/time-series-db';
import { GraphDB } from '../storage/graph-db';
import { TransactionParser } from './transaction-parser';
import { EventDecoder } from './event-decoder';
import { StateTracker } from './state-tracker';
import { logger } from '../utils/logger';
import { retry, exponentialBackoff } from '../utils/retry';
import { Mutex } from 'async-mutex';

interface BlockProcessorConfig {
  rpcEndpoint: string;
  rpcWebsocket?: string;
  chainId: number;
  startBlock: number;
  batchSize: number;
  workerThreads: number;
  maxParallelRequests: number;
  checkpointInterval: number;
  reorgDepth: number;
  enableTraces: boolean;
  enableEvents: boolean;
  enableStateTracking: boolean;
}

interface ProcessingStats {
  blocksProcessed: number;
  transactionsProcessed: number;
  eventsProcessed: number;
  errorsEncountered: number;
  startTime: number;
  lastBlockTime: number;
  currentBlock: number;
  targetBlock: number;
}

interface Checkpoint {
  blockNumber: number;
  blockHash: string;
  timestamp: number;
  stats: ProcessingStats;
}

interface ReorgDetection {
  startBlock: number;
  endBlock: number;
  originalChain: string[];
  newChain: string[];
}

export class BlockProcessor extends EventEmitter {
  private provider: ethers.JsonRpcProvider;
  private wsProvider?: ethers.WebSocketProvider;
  private config: BlockProcessorConfig;
  private pgPool: Pool;
  private timeSeriesDB: TimeSeriesDB;
  private graphDB: GraphDB;
  private transactionParser: TransactionParser;
  private eventDecoder: EventDecoder;
  private stateTracker: StateTracker;
  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private stats: ProcessingStats;
  private queue: PQueue;
  private mutex: Mutex;
  private lastCheckpoint?: Checkpoint;
  private reorgBuffer: Map<number, ethers.Block>;

  constructor(
    pgPool: Pool,
    timeSeriesDB: TimeSeriesDB,
    graphDB: GraphDB,
    config?: Partial<BlockProcessorConfig>
  ) {
    super();

    this.pgPool = pgPool;
    this.timeSeriesDB = timeSeriesDB;
    this.graphDB = graphDB;

    this.config = {
      rpcEndpoint: process.env.RPC_ENDPOINT || 'http://localhost:8545',
      rpcWebsocket: process.env.RPC_WEBSOCKET,
      chainId: parseInt(process.env.CHAIN_ID || '1', 10),
      startBlock: parseInt(process.env.START_BLOCK || '0', 10),
      batchSize: parseInt(process.env.BATCH_SIZE || '100', 10),
      workerThreads: parseInt(process.env.WORKER_THREADS || '8', 10),
      maxParallelRequests: parseInt(process.env.MAX_PARALLEL_REQUESTS || '50', 10),
      checkpointInterval: parseInt(process.env.CHECKPOINT_INTERVAL || '1000', 10),
      reorgDepth: parseInt(process.env.REORG_DEPTH || '100', 10),
      enableTraces: process.env.ENABLE_TRACES === 'true',
      enableEvents: process.env.ENABLE_EVENTS !== 'false',
      enableStateTracking: process.env.ENABLE_STATE_TRACKING !== 'false',
      ...config,
    };

    this.provider = new ethers.JsonRpcProvider(this.config.rpcEndpoint);

    if (this.config.rpcWebsocket) {
      this.wsProvider = new ethers.WebSocketProvider(this.config.rpcWebsocket);
      this.setupWebsocketListeners();
    }

    this.transactionParser = new TransactionParser(this.provider, this.pgPool);
    this.eventDecoder = new EventDecoder(this.provider, this.pgPool);
    this.stateTracker = new StateTracker(this.pgPool, this.timeSeriesDB);

    this.queue = new PQueue({
      concurrency: this.config.workerThreads,
      intervalCap: this.config.maxParallelRequests,
      interval: 1000,
      autoStart: true,
    });

    this.mutex = new Mutex();
    this.reorgBuffer = new Map();

    this.stats = {
      blocksProcessed: 0,
      transactionsProcessed: 0,
      eventsProcessed: 0,
      errorsEncountered: 0,
      startTime: Date.now(),
      lastBlockTime: Date.now(),
      currentBlock: this.config.startBlock,
      targetBlock: 0,
    };

    this.setupEventHandlers();
  }

  private setupWebsocketListeners(): void {
    if (!this.wsProvider) return;

    this.wsProvider.on('block', async (blockNumber: number) => {
      logger.debug('New block detected', { blockNumber });
      this.stats.targetBlock = blockNumber;
      this.emit('newBlock', blockNumber);

      // If we're caught up, process new block immediately
      if (this.stats.currentBlock >= blockNumber - 10) {
        await this.processBlock(blockNumber);
      }
    });

    this.wsProvider.on('error', (error: Error) => {
      logger.error('WebSocket error', { error });
      this.emit('error', error);
    });
  }

  private setupEventHandlers(): void {
    this.queue.on('active', () => {
      logger.debug('Queue active', {
        size: this.queue.size,
        pending: this.queue.pending,
      });
    });

    this.queue.on('idle', () => {
      logger.info('Queue idle', {
        blocksProcessed: this.stats.blocksProcessed,
        currentBlock: this.stats.currentBlock,
      });
      this.emit('queueIdle');
    });

    this.queue.on('error', (error: Error) => {
      logger.error('Queue error', { error });
      this.stats.errorsEncountered++;
      this.emit('error', error);
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Block processor already running');
      return;
    }

    logger.info('Starting block processor', { config: this.config });

    try {
      // Load last checkpoint
      await this.loadCheckpoint();

      // Get current blockchain head
      const latestBlock = await this.provider.getBlockNumber();
      this.stats.targetBlock = latestBlock;

      logger.info('Blockchain status', {
        latestBlock,
        startBlock: this.stats.currentBlock,
        blocksToProcess: latestBlock - this.stats.currentBlock,
      });

      this.isRunning = true;
      this.isPaused = false;
      this.emit('started');

      // Start processing loop
      await this.processingLoop();
    } catch (error) {
      logger.error('Failed to start block processor', { error });
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      logger.warn('Block processor not running');
      return;
    }

    logger.info('Stopping block processor');
    this.isRunning = false;

    // Wait for queue to finish
    await this.queue.onIdle();

    // Create final checkpoint
    await this.createCheckpoint();

    this.emit('stopped');
    logger.info('Block processor stopped');
  }

  async pause(): Promise<void> {
    if (this.isPaused) return;

    logger.info('Pausing block processor');
    this.isPaused = true;
    this.queue.pause();
    this.emit('paused');
  }

  async resume(): Promise<void> {
    if (!this.isPaused) return;

    logger.info('Resuming block processor');
    this.isPaused = false;
    this.queue.start();
    this.emit('resumed');
  }

  private async processingLoop(): Promise<void> {
    while (this.isRunning) {
      try {
        if (this.isPaused) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        const latestBlock = await this.provider.getBlockNumber();
        this.stats.targetBlock = latestBlock;

        if (this.stats.currentBlock >= latestBlock) {
          // We're caught up, wait for new blocks
          await new Promise(resolve => setTimeout(resolve, 5000));
          continue;
        }

        // Calculate batch range
        const fromBlock = this.stats.currentBlock + 1;
        const toBlock = Math.min(
          fromBlock + this.config.batchSize - 1,
          latestBlock - this.config.reorgDepth // Leave buffer for reorgs
        );

        if (toBlock < fromBlock) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          continue;
        }

        logger.info('Processing batch', { fromBlock, toBlock, batchSize: toBlock - fromBlock + 1 });

        // Process batch in parallel
        await this.processBatch(fromBlock, toBlock);

        // Update current block
        this.stats.currentBlock = toBlock;
        this.stats.lastBlockTime = Date.now();

        // Create checkpoint if needed
        if (this.stats.blocksProcessed % this.config.checkpointInterval === 0) {
          await this.createCheckpoint();
        }

        // Emit progress
        this.emit('progress', {
          currentBlock: this.stats.currentBlock,
          targetBlock: this.stats.targetBlock,
          progress: (this.stats.currentBlock / this.stats.targetBlock) * 100,
        });

        // Log statistics
        if (this.stats.blocksProcessed % 100 === 0) {
          this.logStatistics();
        }
      } catch (error) {
        logger.error('Processing loop error', { error });
        this.stats.errorsEncountered++;

        // Exponential backoff on errors
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
  }

  private async processBatch(fromBlock: number, toBlock: number): Promise<void> {
    const blockNumbers = Array.from(
      { length: toBlock - fromBlock + 1 },
      (_, i) => fromBlock + i
    );

    // Add blocks to processing queue
    const promises = blockNumbers.map(blockNumber =>
      this.queue.add(() => this.processBlock(blockNumber))
    );

    await Promise.all(promises);
  }

  private async processBlock(blockNumber: number): Promise<void> {
    const startTime = Date.now();

    try {
      // Fetch block with transactions
      const block = await retry(
        () => this.provider.getBlock(blockNumber, true),
        {
          retries: 5,
          backoff: exponentialBackoff,
        }
      );

      if (!block) {
        throw new Error(`Block ${blockNumber} not found`);
      }

      // Check for reorg
      await this.checkForReorg(block);

      // Store in reorg buffer
      this.reorgBuffer.set(blockNumber, block);
      this.maintainReorgBuffer();

      // Start database transaction
      const client = await this.pgPool.connect();

      try {
        await client.query('BEGIN');

        // Insert block
        await this.insertBlock(client, block);

        // Process transactions
        const transactions = block.transactions as ethers.TransactionResponse[];
        if (transactions && transactions.length > 0) {
          await this.processTransactions(client, block, transactions);
        }

        // Process events if enabled
        if (this.config.enableEvents && transactions && transactions.length > 0) {
          await this.processEvents(client, block, transactions);
        }

        // Update state if enabled
        if (this.config.enableStateTracking) {
          await this.updateState(client, block, transactions);
        }

        await client.query('COMMIT');

        // Update time-series data
        await this.updateTimeSeries(block, transactions);

        // Update graph data
        await this.updateGraph(block, transactions);

        this.stats.blocksProcessed++;
        this.stats.transactionsProcessed += transactions?.length || 0;

        const duration = Date.now() - startTime;
        logger.debug('Block processed', {
          blockNumber,
          transactions: transactions?.length || 0,
          duration,
        });

        this.emit('blockProcessed', {
          blockNumber,
          transactions: transactions?.length || 0,
          duration,
        });
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      } finally {
        client.release();
      }
    } catch (error) {
      logger.error('Failed to process block', { blockNumber, error });
      this.stats.errorsEncountered++;
      throw error;
    }
  }

  private async checkForReorg(block: ethers.Block): Promise<void> {
    if (block.number === 0) return;

    // Check if parent hash matches our stored block
    const client = await this.pgPool.connect();
    try {
      const result = await client.query(
        'SELECT hash FROM blocks WHERE number = $1',
        [block.number - 1]
      );

      if (result.rows.length > 0) {
        const storedParentHash = result.rows[0].hash;
        if (storedParentHash !== block.parentHash) {
          logger.warn('Reorg detected', {
            blockNumber: block.number,
            storedParentHash,
            actualParentHash: block.parentHash,
          });

          await this.handleReorg(block.number - 1);
        }
      }
    } finally {
      client.release();
    }
  }

  private async handleReorg(fromBlock: number): Promise<void> {
    logger.info('Handling reorg', { fromBlock });

    const release = await this.mutex.acquire();

    try {
      // Pause processing
      await this.pause();

      // Find the common ancestor
      let reorgDepth = 0;
      let currentBlock = fromBlock;

      while (reorgDepth < this.config.reorgDepth) {
        const chainBlock = await this.provider.getBlock(currentBlock);
        if (!chainBlock) break;

        const client = await this.pgPool.connect();
        try {
          const result = await client.query(
            'SELECT hash FROM blocks WHERE number = $1',
            [currentBlock]
          );

          if (result.rows.length > 0 && result.rows[0].hash === chainBlock.hash) {
            // Found common ancestor
            break;
          }

          reorgDepth++;
          currentBlock--;
        } finally {
          client.release();
        }
      }

      logger.info('Reorg depth determined', { fromBlock, reorgDepth, commonAncestor: currentBlock });

      // Delete affected blocks and related data
      await this.deleteBlockRange(currentBlock + 1, fromBlock);

      // Reset current block
      this.stats.currentBlock = currentBlock;

      // Resume processing
      await this.resume();

      this.emit('reorg', {
        fromBlock,
        toBlock: fromBlock + reorgDepth,
        depth: reorgDepth,
        commonAncestor: currentBlock,
      });
    } finally {
      release();
    }
  }

  private async deleteBlockRange(fromBlock: number, toBlock: number): Promise<void> {
    const client = await this.pgPool.connect();

    try {
      await client.query('BEGIN');

      // Delete in reverse order due to foreign keys
      await client.query(
        'DELETE FROM events WHERE block_number >= $1 AND block_number <= $2',
        [fromBlock, toBlock]
      );

      await client.query(
        'DELETE FROM transaction_traces WHERE block_number >= $1 AND block_number <= $2',
        [fromBlock, toBlock]
      );

      await client.query(
        'DELETE FROM transactions WHERE block_number >= $1 AND block_number <= $2',
        [fromBlock, toBlock]
      );

      await client.query(
        'DELETE FROM blocks WHERE number >= $1 AND number <= $2',
        [fromBlock, toBlock]
      );

      await client.query('COMMIT');

      logger.info('Deleted blocks due to reorg', { fromBlock, toBlock });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private maintainReorgBuffer(): void {
    // Keep only recent blocks in buffer
    const cutoff = this.stats.currentBlock - this.config.reorgDepth;
    for (const [blockNumber] of this.reorgBuffer) {
      if (blockNumber < cutoff) {
        this.reorgBuffer.delete(blockNumber);
      }
    }
  }

  private async insertBlock(client: PoolClient, block: ethers.Block): Promise<void> {
    await client.query(
      `INSERT INTO blocks (
        number, hash, parent_hash, nonce, sha3_uncles, logs_bloom,
        transactions_root, state_root, receipts_root, miner,
        difficulty, total_difficulty, size, extra_data, gas_limit,
        gas_used, timestamp, transaction_count, base_fee_per_gas
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      ON CONFLICT (number) DO UPDATE SET
        hash = EXCLUDED.hash,
        parent_hash = EXCLUDED.parent_hash,
        timestamp = EXCLUDED.timestamp,
        gas_used = EXCLUDED.gas_used,
        transaction_count = EXCLUDED.transaction_count`,
      [
        block.number,
        block.hash,
        block.parentHash,
        block.nonce,
        '', // sha3_uncles not available in ethers v6
        '', // logs_bloom not available in ethers v6
        block.transactions.length > 0 ? 'calculated' : null,
        'calculated',
        'calculated',
        block.miner,
        block.difficulty?.toString() || '0',
        '0', // total_difficulty not available
        0, // size not directly available
        block.extraData,
        block.gasLimit.toString(),
        block.gasUsed.toString(),
        block.timestamp,
        block.transactions.length,
        block.baseFeePerGas?.toString() || null,
      ]
    );
  }

  private async processTransactions(
    client: PoolClient,
    block: ethers.Block,
    transactions: ethers.TransactionResponse[]
  ): Promise<void> {
    const limit = pLimit(10); // Parallel transaction processing

    await Promise.all(
      transactions.map(tx =>
        limit(async () => {
          try {
            await this.transactionParser.parseAndStore(client, block, tx);

            // Get receipt for additional data
            const receipt = await retry(
              () => this.provider.getTransactionReceipt(tx.hash),
              { retries: 3, backoff: exponentialBackoff }
            );

            if (receipt) {
              await this.storeTransactionReceipt(client, tx, receipt);
            }

            // Process traces if enabled
            if (this.config.enableTraces) {
              await this.processTransactionTraces(client, tx);
            }
          } catch (error) {
            logger.error('Failed to process transaction', {
              hash: tx.hash,
              error,
            });
            throw error;
          }
        })
      )
    );
  }

  private async storeTransactionReceipt(
    client: PoolClient,
    tx: ethers.TransactionResponse,
    receipt: ethers.TransactionReceipt
  ): Promise<void> {
    await client.query(
      `UPDATE transactions SET
        status = $1,
        gas_used = $2,
        cumulative_gas_used = $3,
        effective_gas_price = $4,
        contract_address = $5,
        logs_count = $6
      WHERE hash = $7`,
      [
        receipt.status,
        receipt.gasUsed.toString(),
        receipt.cumulativeGasUsed.toString(),
        receipt.gasPrice?.toString() || tx.gasPrice?.toString(),
        receipt.contractAddress,
        receipt.logs.length,
        tx.hash,
      ]
    );
  }

  private async processTransactionTraces(
    client: PoolClient,
    tx: ethers.TransactionResponse
  ): Promise<void> {
    try {
      // Note: trace_transaction requires debug API
      const traces = await this.provider.send('debug_traceTransaction', [
        tx.hash,
        { tracer: 'callTracer' },
      ]);

      if (traces) {
        await this.storeTraces(client, tx, traces);
      }
    } catch (error) {
      // Debug API might not be available
      logger.debug('Failed to get traces', { hash: tx.hash });
    }
  }

  private async storeTraces(client: PoolClient, tx: ethers.TransactionResponse, traces: any): Promise<void> {
    const flatTraces = this.flattenTraces(traces);

    for (const trace of flatTraces) {
      await client.query(
        `INSERT INTO transaction_traces (
          transaction_hash, block_number, trace_address, type,
          from_address, to_address, value, gas, gas_used,
          input, output, error
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)`,
        [
          tx.hash,
          tx.blockNumber,
          trace.traceAddress.join(','),
          trace.type,
          trace.from,
          trace.to,
          trace.value || '0',
          trace.gas || '0',
          trace.gasUsed || '0',
          trace.input,
          trace.output,
          trace.error,
        ]
      );
    }
  }

  private flattenTraces(trace: any, address: number[] = []): any[] {
    const result = [];

    result.push({
      traceAddress: address,
      type: trace.type,
      from: trace.from,
      to: trace.to,
      value: trace.value,
      gas: trace.gas,
      gasUsed: trace.gasUsed,
      input: trace.input,
      output: trace.output,
      error: trace.error,
    });

    if (trace.calls) {
      trace.calls.forEach((call: any, index: number) => {
        result.push(...this.flattenTraces(call, [...address, index]));
      });
    }

    return result;
  }

  private async processEvents(
    client: PoolClient,
    block: ethers.Block,
    transactions: ethers.TransactionResponse[]
  ): Promise<void> {
    const limit = pLimit(10);

    await Promise.all(
      transactions.map(tx =>
        limit(async () => {
          const receipt = await retry(
            () => this.provider.getTransactionReceipt(tx.hash),
            { retries: 3, backoff: exponentialBackoff }
          );

          if (receipt && receipt.logs.length > 0) {
            const events = await this.eventDecoder.decodeLogs(receipt.logs);
            this.stats.eventsProcessed += events.length;

            for (const event of events) {
              await client.query(
                `INSERT INTO events (
                  block_number, block_hash, transaction_hash, transaction_index,
                  log_index, address, event_name, event_signature, args, raw_log
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
                [
                  block.number,
                  block.hash,
                  tx.hash,
                  receipt.index,
                  event.logIndex,
                  event.address,
                  event.eventName,
                  event.signature,
                  JSON.stringify(event.args),
                  JSON.stringify(event.raw),
                ]
              );
            }
          }
        })
      )
    );
  }

  private async updateState(
    client: PoolClient,
    block: ethers.Block,
    transactions: ethers.TransactionResponse[]
  ): Promise<void> {
    if (!transactions || transactions.length === 0) return;

    await this.stateTracker.updateFromBlock(client, block, transactions);
  }

  private async updateTimeSeries(block: ethers.Block, transactions: ethers.TransactionResponse[]): Promise<void> {
    await this.timeSeriesDB.recordBlock({
      timestamp: new Date(block.timestamp * 1000),
      blockNumber: block.number,
      transactionCount: transactions?.length || 0,
      gasUsed: block.gasUsed,
      gasLimit: block.gasLimit,
      baseFeePerGas: block.baseFeePerGas,
    });
  }

  private async updateGraph(block: ethers.Block, transactions: ethers.TransactionResponse[]): Promise<void> {
    if (!transactions || transactions.length === 0) return;

    const graphUpdates = transactions.map(tx => ({
      from: tx.from,
      to: tx.to || null,
      value: tx.value,
      blockNumber: block.number,
      timestamp: block.timestamp,
    }));

    await this.graphDB.recordTransactions(graphUpdates);
  }

  private async loadCheckpoint(): Promise<void> {
    try {
      const result = await this.pgPool.query(
        'SELECT * FROM checkpoints ORDER BY block_number DESC LIMIT 1'
      );

      if (result.rows.length > 0) {
        const checkpoint = result.rows[0];
        this.lastCheckpoint = {
          blockNumber: checkpoint.block_number,
          blockHash: checkpoint.block_hash,
          timestamp: checkpoint.timestamp,
          stats: checkpoint.stats,
        };

        this.stats.currentBlock = checkpoint.block_number;

        logger.info('Loaded checkpoint', { checkpoint: this.lastCheckpoint });
      }
    } catch (error) {
      logger.warn('Failed to load checkpoint', { error });
    }
  }

  async createCheckpoint(): Promise<void> {
    const release = await this.mutex.acquire();

    try {
      const block = await this.provider.getBlock(this.stats.currentBlock);
      if (!block) return;

      await this.pgPool.query(
        `INSERT INTO checkpoints (block_number, block_hash, timestamp, stats)
         VALUES ($1, $2, $3, $4)`,
        [
          this.stats.currentBlock,
          block.hash,
          Date.now(),
          JSON.stringify(this.stats),
        ]
      );

      this.lastCheckpoint = {
        blockNumber: this.stats.currentBlock,
        blockHash: block.hash,
        timestamp: Date.now(),
        stats: { ...this.stats },
      };

      logger.info('Checkpoint created', { blockNumber: this.stats.currentBlock });
      this.emit('checkpoint', this.lastCheckpoint);
    } catch (error) {
      logger.error('Failed to create checkpoint', { error });
    } finally {
      release();
    }
  }

  async reindex(fromBlock: number, toBlock: number): Promise<void> {
    logger.info('Starting reindex', { fromBlock, toBlock });

    const wasRunning = this.isRunning;
    if (wasRunning) {
      await this.stop();
    }

    try {
      // Delete existing data
      await this.deleteBlockRange(fromBlock, toBlock);

      // Reset stats
      this.stats.currentBlock = fromBlock - 1;
      this.stats.blocksProcessed = 0;
      this.stats.transactionsProcessed = 0;
      this.stats.eventsProcessed = 0;

      // Restart if it was running
      if (wasRunning) {
        await this.start();
      }
    } catch (error) {
      logger.error('Reindex failed', { error });
      throw error;
    }
  }

  private logStatistics(): void {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;
    const blocksPerSecond = this.stats.blocksProcessed / elapsed;
    const transactionsPerSecond = this.stats.transactionsProcessed / elapsed;
    const progress = (this.stats.currentBlock / this.stats.targetBlock) * 100;

    logger.info('Processing statistics', {
      currentBlock: this.stats.currentBlock,
      targetBlock: this.stats.targetBlock,
      progress: progress.toFixed(2) + '%',
      blocksProcessed: this.stats.blocksProcessed,
      transactionsProcessed: this.stats.transactionsProcessed,
      eventsProcessed: this.stats.eventsProcessed,
      blocksPerSecond: blocksPerSecond.toFixed(2),
      transactionsPerSecond: transactionsPerSecond.toFixed(2),
      errors: this.stats.errorsEncountered,
      queueSize: this.queue.size,
      queuePending: this.queue.pending,
    });
  }

  async getStatus(): Promise<any> {
    return {
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      currentBlock: this.stats.currentBlock,
      targetBlock: this.stats.targetBlock,
      lag: this.stats.targetBlock - this.stats.currentBlock,
      blocksPerSecond: this.stats.blocksProcessed / ((Date.now() - this.stats.startTime) / 1000),
    };
  }

  async getDetailedStatus(): Promise<any> {
    const elapsed = (Date.now() - this.stats.startTime) / 1000;

    return {
      ...await this.getStatus(),
      stats: this.stats,
      performance: {
        blocksPerSecond: (this.stats.blocksProcessed / elapsed).toFixed(2),
        transactionsPerSecond: (this.stats.transactionsProcessed / elapsed).toFixed(2),
        eventsPerSecond: (this.stats.eventsProcessed / elapsed).toFixed(2),
      },
      queue: {
        size: this.queue.size,
        pending: this.queue.pending,
        isPaused: this.queue.isPaused,
      },
      lastCheckpoint: this.lastCheckpoint,
    };
  }
}
