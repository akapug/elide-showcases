# Blockchain Indexer

A production-grade multi-chain blockchain data indexer that parses blocks, indexes transactions, processes event logs, and provides a comprehensive query API.

## Features

- **Block Parsing**: Efficiently parses blockchain blocks from multiple chains
- **Transaction Indexing**: Indexes all transactions with comprehensive metadata
- **Event Logs Processing**: Captures and indexes smart contract event logs
- **Query API**: RESTful API for querying indexed data
- **Multi-Chain Support**: Supports Ethereum, Polygon, BSC, Avalanche, and Arbitrum
- **Real-time Indexing**: Continuously indexes new blocks as they appear
- **Address Tracking**: Fast queries for all transactions involving specific addresses
- **Statistics Dashboard**: Real-time indexer performance metrics

## Architecture

### Components

1. **BlockchainStore**: In-memory data store (production would use PostgreSQL/MongoDB)
   - Block storage and retrieval
   - Transaction indexing
   - Event log processing
   - Address-based indexing

2. **BlockchainIndexer**: Core indexing engine
   - Multi-chain block parsing
   - Transaction extraction
   - Event log processing
   - Configurable chain support

3. **IndexerAPI**: HTTP REST API
   - Health checks
   - Statistics endpoints
   - Transaction queries
   - Event log queries

## API Endpoints

### Health Check
```
GET /api/health
```

### Statistics
```
GET /api/stats?chain={chain}
```
Query parameters:
- `chain` (optional): Specific chain (ethereum, polygon, bsc, avalanche, arbitrum)

### Transaction Queries
```
GET /api/transactions?chain={chain}&address={address}&fromBlock={n}&toBlock={n}&limit={n}&offset={n}
```
Query parameters:
- `chain` (optional): Filter by blockchain
- `address` (optional): Filter by sender or receiver address
- `fromBlock` (optional): Start block number
- `toBlock` (optional): End block number
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

### Event Log Queries
```
GET /api/logs?chain={chain}&address={address}&fromBlock={n}&toBlock={n}&limit={n}&offset={n}
```
Query parameters:
- `chain` (optional): Filter by blockchain
- `address` (optional): Contract address
- `fromBlock` (optional): Start block number
- `toBlock` (optional): End block number
- `limit` (optional): Number of results (default: 100)
- `offset` (optional): Pagination offset (default: 0)

## Usage

```bash
# Start the indexer
elide run server.ts

# Query transactions for an address
curl "http://localhost:3000/api/transactions?address=0x742d35Cc6634C0532925a3b844Bc454e4438f44e&limit=10"

# Get indexer statistics
curl "http://localhost:3000/api/stats"

# Query event logs from a contract
curl "http://localhost:3000/api/logs?address=0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984&fromBlock=18000000"
```

## Configuration

Environment variables:
- `PORT`: Server port (default: 3000)

Chain configurations can be modified in the `BlockchainIndexer` constructor to:
- Add new chains
- Adjust RPC endpoints
- Modify start blocks
- Configure block times

## Data Model

### Block
- Hash, number, timestamp
- Parent hash, miner
- Gas metrics
- Transaction list
- Chain identifier

### Transaction
- Hash, block reference
- Sender and receiver
- Value and gas data
- Status (success/failed)
- Event logs
- Chain identifier

### Event Log
- Contract address
- Topics and data
- Block and transaction reference
- Log index
- Chain identifier

## Performance

- **Indexing Rate**: Varies by chain (1-12 second block times)
- **Query Performance**: O(1) for address lookups via indexing
- **Storage**: In-memory (production should use persistent database)
- **Concurrency**: Supports simultaneous multi-chain indexing

## Production Considerations

1. **Database**: Replace in-memory store with PostgreSQL or MongoDB
2. **RPC**: Use reliable RPC providers (Alchemy, Infura, QuickNode)
3. **Error Handling**: Implement retry logic for RPC failures
4. **Monitoring**: Add metrics and alerting
5. **Scaling**: Use message queues for distributed indexing
6. **Data Retention**: Implement archival strategies
7. **Caching**: Add Redis for frequently accessed data

## Use Cases

- Blockchain explorers
- Analytics platforms
- DeFi dashboards
- Wallet applications
- Audit and compliance tools
- Research and analysis

## License

MIT
