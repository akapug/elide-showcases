/**
 * Blockchain Indexer Service
 *
 * A production-grade multi-chain blockchain data indexer that parses blocks,
 * indexes transactions, processes event logs, and provides a query API.
 */

import { URL } from 'url';
import { createServer, IncomingMessage, ServerResponse } from 'http';

// ============================================================================
// Type Definitions
// ============================================================================

interface Block {
  hash: string;
  number: number;
  timestamp: number;
  parentHash: string;
  miner: string;
  difficulty: bigint;
  gasLimit: bigint;
  gasUsed: bigint;
  transactions: Transaction[];
  chain: ChainId;
}

interface Transaction {
  hash: string;
  blockNumber: number;
  blockHash: string;
  from: string;
  to: string | null;
  value: bigint;
  gasPrice: bigint;
  gasUsed: bigint;
  nonce: number;
  data: string;
  status: 'success' | 'failed';
  timestamp: number;
  chain: ChainId;
  logs: EventLog[];
}

interface EventLog {
  address: string;
  topics: string[];
  data: string;
  blockNumber: number;
  transactionHash: string;
  logIndex: number;
  chain: ChainId;
}

type ChainId = 'ethereum' | 'polygon' | 'bsc' | 'avalanche' | 'arbitrum';

interface ChainConfig {
  name: string;
  rpcUrl: string;
  blockTime: number; // seconds
  startBlock: number;
}

interface IndexerStats {
  chain: ChainId;
  currentBlock: number;
  totalBlocks: number;
  totalTransactions: number;
  totalLogs: number;
  indexingRate: number; // blocks per second
  lastUpdate: number;
}

interface QueryParams {
  chain?: ChainId;
  address?: string;
  fromBlock?: number;
  toBlock?: number;
  limit?: number;
  offset?: number;
}

// ============================================================================
// In-Memory Storage (Production would use PostgreSQL/MongoDB)
// ============================================================================

class BlockchainStore {
  private blocks: Map<string, Block> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private eventLogs: EventLog[] = [];
  private addressTransactions: Map<string, Set<string>> = new Map();
  private stats: Map<ChainId, IndexerStats> = new Map();

  addBlock(block: Block): void {
    const key = `${block.chain}:${block.hash}`;
    this.blocks.set(key, block);

    // Index transactions
    block.transactions.forEach(tx => {
      this.addTransaction(tx);
    });

    // Update stats
    this.updateStats(block.chain, block.number, block.transactions.length);
  }

  addTransaction(tx: Transaction): void {
    const key = `${tx.chain}:${tx.hash}`;
    this.transactions.set(key, tx);

    // Index by address
    this.indexAddressTransaction(tx.from, key);
    if (tx.to) {
      this.indexAddressTransaction(tx.to, key);
    }

    // Index event logs
    tx.logs.forEach(log => this.eventLogs.push(log));
  }

  private indexAddressTransaction(address: string, txKey: string): void {
    if (!this.addressTransactions.has(address)) {
      this.addressTransactions.set(address, new Set());
    }
    this.addressTransactions.get(address)!.add(txKey);
  }

  private updateStats(chain: ChainId, blockNumber: number, txCount: number): void {
    const stats = this.stats.get(chain) || {
      chain,
      currentBlock: 0,
      totalBlocks: 0,
      totalTransactions: 0,
      totalLogs: 0,
      indexingRate: 0,
      lastUpdate: Date.now()
    };

    stats.currentBlock = Math.max(stats.currentBlock, blockNumber);
    stats.totalBlocks++;
    stats.totalTransactions += txCount;
    stats.lastUpdate = Date.now();

    this.stats.set(chain, stats);
  }

  queryTransactions(params: QueryParams): Transaction[] {
    let results: Transaction[] = Array.from(this.transactions.values());

    if (params.chain) {
      results = results.filter(tx => tx.chain === params.chain);
    }

    if (params.address) {
      const txKeys = this.addressTransactions.get(params.address) || new Set();
      results = results.filter(tx =>
        txKeys.has(`${tx.chain}:${tx.hash}`)
      );
    }

    if (params.fromBlock !== undefined) {
      results = results.filter(tx => tx.blockNumber >= params.fromBlock!);
    }

    if (params.toBlock !== undefined) {
      results = results.filter(tx => tx.blockNumber <= params.toBlock!);
    }

    // Sort by timestamp descending
    results.sort((a, b) => b.timestamp - a.timestamp);

    const offset = params.offset || 0;
    const limit = params.limit || 100;

    return results.slice(offset, offset + limit);
  }

  queryLogs(params: QueryParams): EventLog[] {
    let results = [...this.eventLogs];

    if (params.chain) {
      results = results.filter(log => log.chain === params.chain);
    }

    if (params.address) {
      results = results.filter(log =>
        log.address.toLowerCase() === params.address!.toLowerCase()
      );
    }

    if (params.fromBlock !== undefined) {
      results = results.filter(log => log.blockNumber >= params.fromBlock!);
    }

    if (params.toBlock !== undefined) {
      results = results.filter(log => log.blockNumber <= params.toBlock!);
    }

    const offset = params.offset || 0;
    const limit = params.limit || 100;

    return results.slice(offset, offset + limit);
  }

  getStats(chain?: ChainId): IndexerStats | IndexerStats[] {
    if (chain) {
      return this.stats.get(chain) || {
        chain,
        currentBlock: 0,
        totalBlocks: 0,
        totalTransactions: 0,
        totalLogs: 0,
        indexingRate: 0,
        lastUpdate: Date.now()
      };
    }
    return Array.from(this.stats.values());
  }
}

// ============================================================================
// Block Parser & Indexer
// ============================================================================

class BlockchainIndexer {
  private store: BlockchainStore;
  private chains: Map<ChainId, ChainConfig>;
  private indexingIntervals: Map<ChainId, NodeJS.Timeout> = new Map();

  constructor(store: BlockchainStore) {
    this.store = store;
    this.chains = new Map([
      ['ethereum', {
        name: 'Ethereum Mainnet',
        rpcUrl: 'https://eth-mainnet.alchemyapi.io/v2/demo',
        blockTime: 12,
        startBlock: 18000000
      }],
      ['polygon', {
        name: 'Polygon',
        rpcUrl: 'https://polygon-rpc.com',
        blockTime: 2,
        startBlock: 45000000
      }],
      ['bsc', {
        name: 'Binance Smart Chain',
        rpcUrl: 'https://bsc-dataseed.binance.org',
        blockTime: 3,
        startBlock: 30000000
      }],
      ['avalanche', {
        name: 'Avalanche C-Chain',
        rpcUrl: 'https://api.avax.network/ext/bc/C/rpc',
        blockTime: 2,
        startBlock: 35000000
      }],
      ['arbitrum', {
        name: 'Arbitrum One',
        rpcUrl: 'https://arb1.arbitrum.io/rpc',
        blockTime: 1,
        startBlock: 120000000
      }]
    ]);
  }

  async parseBlock(chain: ChainId, blockNumber: number): Promise<Block> {
    // Simulate block parsing (in production, would fetch from RPC)
    const config = this.chains.get(chain)!;
    const timestamp = Date.now() - (blockNumber * config.blockTime * 1000);

    const transactions: Transaction[] = [];
    const txCount = Math.floor(Math.random() * 200) + 50;

    for (let i = 0; i < txCount; i++) {
      transactions.push(this.generateTransaction(chain, blockNumber, timestamp));
    }

    return {
      hash: this.generateHash(),
      number: blockNumber,
      timestamp,
      parentHash: this.generateHash(),
      miner: this.generateAddress(),
      difficulty: BigInt(Math.floor(Math.random() * 1000000000)),
      gasLimit: BigInt(30000000),
      gasUsed: BigInt(Math.floor(Math.random() * 25000000)),
      transactions,
      chain
    };
  }

  private generateTransaction(chain: ChainId, blockNumber: number, timestamp: number): Transaction {
    const logs: EventLog[] = [];
    const logCount = Math.floor(Math.random() * 5);

    for (let i = 0; i < logCount; i++) {
      logs.push({
        address: this.generateAddress(),
        topics: [this.generateHash(), this.generateHash()],
        data: '0x' + Buffer.from('event data').toString('hex'),
        blockNumber,
        transactionHash: this.generateHash(),
        logIndex: i,
        chain
      });
    }

    return {
      hash: this.generateHash(),
      blockNumber,
      blockHash: this.generateHash(),
      from: this.generateAddress(),
      to: Math.random() > 0.1 ? this.generateAddress() : null,
      value: BigInt(Math.floor(Math.random() * 1000000000000000000)),
      gasPrice: BigInt(Math.floor(Math.random() * 50000000000)),
      gasUsed: BigInt(21000 + Math.floor(Math.random() * 100000)),
      nonce: Math.floor(Math.random() * 1000),
      data: '0x',
      status: Math.random() > 0.05 ? 'success' : 'failed',
      timestamp,
      chain,
      logs
    };
  }

  async startIndexing(chain: ChainId): Promise<void> {
    const config = this.chains.get(chain);
    if (!config) {
      throw new Error(`Unknown chain: ${chain}`);
    }

    console.log(`[${chain}] Starting indexer from block ${config.startBlock}`);

    let currentBlock = config.startBlock;

    const interval = setInterval(async () => {
      try {
        const block = await this.parseBlock(chain, currentBlock);
        this.store.addBlock(block);

        if (currentBlock % 100 === 0) {
          console.log(`[${chain}] Indexed block ${currentBlock} with ${block.transactions.length} transactions`);
        }

        currentBlock++;
      } catch (error) {
        console.error(`[${chain}] Error indexing block ${currentBlock}:`, error);
      }
    }, config.blockTime * 100); // Speed up for demo

    this.indexingIntervals.set(chain, interval);
  }

  stopIndexing(chain: ChainId): void {
    const interval = this.indexingIntervals.get(chain);
    if (interval) {
      clearInterval(interval);
      this.indexingIntervals.delete(chain);
      console.log(`[${chain}] Indexer stopped`);
    }
  }

  private generateHash(): string {
    return '0x' + Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }

  private generateAddress(): string {
    return '0x' + Array.from({ length: 40 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
  }
}

// ============================================================================
// HTTP API Server
// ============================================================================

class IndexerAPI {
  private store: BlockchainStore;
  private indexer: BlockchainIndexer;

  constructor(store: BlockchainStore, indexer: BlockchainIndexer) {
    this.store = store;
    this.indexer = indexer;
  }

  async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const url = new URL(req.url || '/', `http://${req.headers.host}`);
    const path = url.pathname;

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', 'application/json');

    try {
      if (path === '/api/health') {
        this.sendJSON(res, { status: 'healthy', timestamp: Date.now() });
      } else if (path === '/api/stats') {
        const chain = url.searchParams.get('chain') as ChainId | null;
        const stats = chain ? this.store.getStats(chain) : this.store.getStats();
        this.sendJSON(res, stats);
      } else if (path === '/api/transactions') {
        const params = this.parseQueryParams(url);
        const transactions = this.store.queryTransactions(params);
        this.sendJSON(res, {
          count: transactions.length,
          transactions: transactions.map(tx => ({
            ...tx,
            value: tx.value.toString(),
            gasPrice: tx.gasPrice.toString(),
            gasUsed: tx.gasUsed.toString()
          }))
        });
      } else if (path === '/api/logs') {
        const params = this.parseQueryParams(url);
        const logs = this.store.queryLogs(params);
        this.sendJSON(res, { count: logs.length, logs });
      } else {
        this.sendError(res, 404, 'Not Found');
      }
    } catch (error) {
      console.error('API error:', error);
      this.sendError(res, 500, 'Internal Server Error');
    }
  }

  private parseQueryParams(url: URL): QueryParams {
    return {
      chain: url.searchParams.get('chain') as ChainId | undefined,
      address: url.searchParams.get('address') || undefined,
      fromBlock: this.parseNumber(url.searchParams.get('fromBlock')),
      toBlock: this.parseNumber(url.searchParams.get('toBlock')),
      limit: this.parseNumber(url.searchParams.get('limit')) || 100,
      offset: this.parseNumber(url.searchParams.get('offset')) || 0
    };
  }

  private parseNumber(value: string | null): number | undefined {
    if (!value) return undefined;
    const num = parseInt(value, 10);
    return isNaN(num) ? undefined : num;
  }

  private sendJSON(res: ServerResponse, data: any): void {
    res.writeHead(200);
    res.end(JSON.stringify(data, null, 2));
  }

  private sendError(res: ServerResponse, code: number, message: string): void {
    res.writeHead(code);
    res.end(JSON.stringify({ error: message }));
  }
}

// ============================================================================
// Main Application
// ============================================================================

async function main() {
  const PORT = parseInt(process.env.PORT || '3000', 10);

  const store = new BlockchainStore();
  const indexer = new BlockchainIndexer(store);
  const api = new IndexerAPI(store, indexer);


// ============================================================================
// Server Setup
// ============================================================================

const PORT = Number(process.env.PORT) || 3000;

const store = new BlockchainStore();
const indexer = new BlockchainIndexer(store);
const api = new IndexerAPI(store, indexer);

// Start indexing all chains
const chains: ChainId[] = ['ethereum', 'polygon', 'bsc', 'avalanche', 'arbitrum'];
(async () => {
  for (const chain of chains) {
    await indexer.startIndexing(chain);
  }
})();

// Create HTTP server
const server = createServer((req, res) => {
  api.handleRequest(req, res);
});

server.listen(PORT, () => {
  console.log(`Blockchain Indexer API running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET /api/health - Health check`);
  console.log(`  GET /api/stats?chain={chain} - Indexer statistics`);
  console.log(`  GET /api/transactions - Query transactions`);
  console.log(`  GET /api/logs - Query event logs`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Shutting down gracefully...');
  chains.forEach(chain => indexer.stopIndexing(chain));
  server.close(() => {
    console.log('Server stopped');
    process.exit(0);
  });
});
