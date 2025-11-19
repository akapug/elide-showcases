export const typeDefs = `#graphql
  scalar BigInt
  scalar DateTime
  scalar JSON

  type Query {
    # Block queries
    block(number: Int, hash: String): Block
    blocks(
      fromBlock: Int
      toBlock: Int
      limit: Int = 100
      offset: Int = 0
    ): BlockConnection!

    latestBlock: Block
    blockRange(from: Int!, to: Int!): [Block!]!

    # Transaction queries
    transaction(hash: String!): Transaction
    transactions(
      filter: TransactionFilter
      limit: Int = 100
      offset: Int = 0
      orderBy: TransactionOrderBy
    ): TransactionConnection!

    # Address queries
    address(address: String!): Address
    addresses(
      filter: AddressFilter
      limit: Int = 100
      offset: Int = 0
    ): AddressConnection!

    richList(limit: Int = 100): [Address!]!

    # Event queries
    events(
      filter: EventFilter
      limit: Int = 100
      offset: Int = 0
    ): EventConnection!

    # Token queries
    token(address: String!): Token
    tokens(
      limit: Int = 100
      offset: Int = 0
    ): TokenConnection!

    tokenHolders(
      tokenAddress: String!
      limit: Int = 100
    ): [TokenHolder!]!

    # Analytics queries
    analytics: Analytics!

    # Network queries
    networkStats: NetworkStats!
    gasPriceStats: GasPriceStats!

    # Graph queries
    addressNeighbors(
      address: String!
      direction: Direction = BOTH
      limit: Int = 100
    ): [AddressRelation!]!

    findPath(
      from: String!
      to: String!
      maxHops: Int = 5
    ): FundFlow

    # Search
    search(query: String!, type: SearchType): SearchResults!
  }

  type Mutation {
    # Admin mutations (require authentication)
    reindex(fromBlock: Int!, toBlock: Int!): ReindexJob!
    createCheckpoint: Checkpoint!
    invalidateCache(pattern: String!): Boolean!
  }

  type Subscription {
    # Real-time subscriptions
    newBlock: Block!
    newTransaction(address: String): Transaction!
    newEvent(contractAddress: String, eventName: String): Event!
    gasPriceUpdate: GasPriceStats!
  }

  # Types

  type Block {
    number: Int!
    hash: String!
    parentHash: String!
    timestamp: DateTime!
    miner: String!
    gasUsed: BigInt!
    gasLimit: BigInt!
    baseFeePerGas: BigInt
    difficulty: BigInt!
    nonce: String!
    size: Int!
    transactionCount: Int!
    transactions(limit: Int, offset: Int): [Transaction!]!
    uncles: [String!]!
  }

  type Transaction {
    hash: String!
    blockNumber: Int!
    blockHash: String!
    transactionIndex: Int!
    from: Address!
    to: Address
    value: BigInt!
    gasLimit: BigInt!
    gasPrice: BigInt
    maxFeePerGas: BigInt
    maxPriorityFeePerGas: BigInt
    gasUsed: BigInt
    effectiveGasPrice: BigInt
    nonce: Int!
    data: String!
    status: Int
    type: Int!
    chainId: Int
    v: Int
    r: String
    s: String
    contractAddress: String
    logsCount: Int
    timestamp: DateTime!

    # Decoded data
    decodedInput: DecodedInput
    logs: [Event!]!
    traces: [TransactionTrace!]!
    tokenTransfers: [TokenTransfer!]!

    # Analysis
    classification: TransactionClassification
  }

  type Address {
    address: String!
    balance: BigInt!
    nonce: Int!
    isContract: Boolean!
    code: String
    labels: [String!]
    firstSeen: Int!
    lastSeen: Int!
    transactionCount: Int!
    totalSent: BigInt!
    totalReceived: BigInt!

    # Relations
    transactions(
      direction: Direction
      limit: Int = 100
      offset: Int = 0
    ): TransactionConnection!

    tokenBalances(limit: Int = 100): [TokenBalance!]!
    nftOwned(limit: Int = 100): [NFTToken!]!

    # Analytics
    transactionHistory(days: Int = 30): [TransactionHistoryEntry!]!
    balanceHistory(days: Int = 30): [BalanceHistoryEntry!]!
    patterns: AddressPatterns
  }

  type Event {
    id: ID!
    blockNumber: Int!
    blockHash: String!
    transactionHash: String!
    transactionIndex: Int!
    logIndex: Int!
    address: String!
    eventName: String!
    signature: String!
    args: JSON!
    timestamp: DateTime!

    # Relations
    transaction: Transaction!
    contract: Address!
  }

  type Token {
    address: String!
    name: String
    symbol: String
    decimals: Int
    totalSupply: BigInt
    tokenType: TokenType!
    deployer: String
    deployedAt: Int

    # Stats
    holderCount: Int!
    transferCount: Int!
    volume24h: BigInt

    # Relations
    holders(limit: Int = 100): [TokenHolder!]!
    transfers(limit: Int = 100): [TokenTransfer!]!
  }

  type TokenBalance {
    address: String!
    token: Token!
    balance: BigInt!
    lastUpdated: Int!
  }

  type TokenHolder {
    address: String!
    balance: BigInt!
    percentage: Float!
  }

  type TokenTransfer {
    transactionHash: String!
    blockNumber: Int!
    from: String!
    to: String!
    value: BigInt
    tokenId: BigInt
    amount: BigInt
    tokenType: TokenType!
    timestamp: DateTime!
  }

  type NFTToken {
    tokenAddress: String!
    tokenId: BigInt!
    owner: String!
    metadata: JSON
    lastUpdated: Int!
  }

  type DecodedInput {
    methodName: String!
    signature: String!
    params: [InputParam!]!
  }

  type InputParam {
    name: String!
    type: String!
    value: JSON!
  }

  type TransactionTrace {
    traceAddress: String!
    type: String!
    from: String!
    to: String
    value: BigInt
    gas: BigInt
    gasUsed: BigInt
    input: String
    output: String
    error: String
  }

  type TransactionClassification {
    category: String!
    confidence: Float!
    indicators: [String!]!
  }

  type Analytics {
    dailyTransactions(days: Int = 30): [DailyMetric!]!
    dailyVolume(days: Int = 30): [DailyMetric!]!
    dailyActiveAddresses(days: Int = 30): [DailyMetric!]!
    gasPriceHistory(hours: Int = 24): [GasPricePoint!]!
    topGasConsumers(limit: Int = 100): [GasConsumer!]!
    topTokens(metric: TokenMetric = VOLUME, limit: Int = 100): [TokenStats!]!
    networkGrowth(days: Int = 30): [GrowthMetric!]!
  }

  type DailyMetric {
    date: String!
    count: Int!
    volume: BigInt
    avgGasPrice: BigInt
    uniqueAddresses: Int
  }

  type GasPricePoint {
    timestamp: DateTime!
    fast: BigInt!
    standard: BigInt!
    slow: BigInt!
    baseFee: BigInt
  }

  type GasConsumer {
    address: String!
    gasUsed: BigInt!
    transactionCount: Int!
    totalSpent: BigInt!
  }

  type TokenStats {
    token: Token!
    volume: BigInt!
    transactions: Int!
    uniqueTraders: Int!
  }

  type GrowthMetric {
    date: String!
    newAddresses: Int!
    newContracts: Int!
    cumulativeAddresses: Int!
  }

  type NetworkStats {
    currentBlock: Int!
    totalBlocks: Int!
    totalTransactions: BigInt!
    totalAddresses: Int!
    totalContracts: Int!
    avgBlockTime: Float!
    currentTPS: Float!
    gasUtilization: Float!
  }

  type GasPriceStats {
    timestamp: DateTime!
    fast: BigInt!
    standard: BigInt!
    slow: BigInt!
    baseFee: BigInt
    percentiles: GasPercentiles!
  }

  type GasPercentiles {
    p10: BigInt!
    p25: BigInt!
    p50: BigInt!
    p75: BigInt!
    p90: BigInt!
    p95: BigInt!
    p99: BigInt!
  }

  type AddressRelation {
    address: String!
    transactionCount: Int!
    totalValue: BigInt!
    direction: Direction!
    firstTransaction: DateTime!
    lastTransaction: DateTime!
  }

  type FundFlow {
    path: [String!]!
    totalValue: BigInt!
    hops: Int!
    transactions: Int!
  }

  type AddressPatterns {
    transactionFrequency: Float!
    avgTransactionValue: BigInt!
    mostActiveHour: Int!
    mostActiveDay: Int!
    regularityScore: Float!
    uniqueCounterparties: Int!
    suspicionScore: Float
    isBot: Boolean
    botConfidence: Float
  }

  type SearchResults {
    blocks: [Block!]!
    transactions: [Transaction!]!
    addresses: [Address!]!
    tokens: [Token!]!
  }

  # Connections (for pagination)

  type BlockConnection {
    edges: [BlockEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type BlockEdge {
    node: Block!
    cursor: String!
  }

  type TransactionConnection {
    edges: [TransactionEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TransactionEdge {
    node: Transaction!
    cursor: String!
  }

  type AddressConnection {
    edges: [AddressEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type AddressEdge {
    node: Address!
    cursor: String!
  }

  type EventConnection {
    edges: [EventEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type EventEdge {
    node: Event!
    cursor: String!
  }

  type TokenConnection {
    edges: [TokenEdge!]!
    pageInfo: PageInfo!
    totalCount: Int!
  }

  type TokenEdge {
    node: Token!
    cursor: String!
  }

  type PageInfo {
    hasNextPage: Boolean!
    hasPreviousPage: Boolean!
    startCursor: String
    endCursor: String
  }

  # Input types

  input TransactionFilter {
    fromAddress: String
    toAddress: String
    fromBlock: Int
    toBlock: Int
    minValue: BigInt
    maxValue: BigInt
    status: Int
    methodName: String
  }

  input AddressFilter {
    isContract: Boolean
    minBalance: BigInt
    minTransactions: Int
    labels: [String!]
  }

  input EventFilter {
    contractAddress: String
    eventName: String
    fromBlock: Int
    toBlock: Int
  }

  input TransactionOrderBy {
    field: TransactionOrderField!
    direction: OrderDirection!
  }

  # Enums

  enum Direction {
    IN
    OUT
    BOTH
  }

  enum TokenType {
    ERC20
    ERC721
    ERC1155
    UNKNOWN
  }

  enum TokenMetric {
    VOLUME
    HOLDERS
    TRANSACTIONS
  }

  enum SearchType {
    ALL
    BLOCK
    TRANSACTION
    ADDRESS
    TOKEN
  }

  enum TransactionOrderField {
    BLOCK_NUMBER
    TIMESTAMP
    VALUE
    GAS_PRICE
  }

  enum OrderDirection {
    ASC
    DESC
  }

  # Admin types

  type ReindexJob {
    id: ID!
    fromBlock: Int!
    toBlock: Int!
    status: String!
    startedAt: DateTime!
  }

  type Checkpoint {
    blockNumber: Int!
    blockHash: String!
    timestamp: DateTime!
    createdAt: DateTime!
  }
`;
