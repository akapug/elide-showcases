/**
 * GraphQL Query Examples for Blockchain Indexer
 *
 * This file contains comprehensive examples of GraphQL queries
 * demonstrating the full capabilities of the indexer API.
 */

// ============================================================================
// BLOCK QUERIES
// ============================================================================

export const GET_LATEST_BLOCK = `
  query GetLatestBlock {
    latestBlock {
      number
      hash
      timestamp
      miner
      gasUsed
      gasLimit
      baseFeePerGas
      transactionCount
      transactions(limit: 10) {
        hash
        from {
          address
          isContract
        }
        to {
          address
          isContract
        }
        value
        gasPrice
      }
    }
  }
`;

export const GET_BLOCK_BY_NUMBER = `
  query GetBlockByNumber($number: Int!) {
    block(number: $number) {
      number
      hash
      parentHash
      timestamp
      miner
      difficulty
      gasUsed
      gasLimit
      baseFeePerGas
      transactionCount
      size
      transactions {
        hash
        from { address }
        to { address }
        value
        status
      }
    }
  }
`;

export const GET_BLOCK_RANGE = `
  query GetBlockRange($from: Int!, $to: Int!) {
    blockRange(from: $from, to: $to) {
      number
      hash
      timestamp
      transactionCount
      gasUsed
      gasLimit
      baseFeePerGas
    }
  }
`;

// ============================================================================
// TRANSACTION QUERIES
// ============================================================================

export const GET_TRANSACTION = `
  query GetTransaction($hash: String!) {
    transaction(hash: $hash) {
      hash
      blockNumber
      timestamp
      from {
        address
        balance
        isContract
        labels
      }
      to {
        address
        balance
        isContract
        labels
      }
      value
      gasLimit
      gasPrice
      gasUsed
      effectiveGasPrice
      status
      decodedInput {
        methodName
        signature
        params {
          name
          type
          value
        }
      }
      logs {
        eventName
        args
      }
      tokenTransfers {
        tokenType
        from
        to
        value
        tokenId
      }
      classification {
        category
        confidence
        indicators
      }
    }
  }
`;

export const SEARCH_TRANSACTIONS = `
  query SearchTransactions($filter: TransactionFilter!, $limit: Int, $offset: Int) {
    transactions(filter: $filter, limit: $limit, offset: $offset) {
      edges {
        node {
          hash
          blockNumber
          timestamp
          from { address }
          to { address }
          value
          gasPrice
          status
          decodedInput {
            methodName
          }
        }
        cursor
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

export const GET_ADDRESS_TRANSACTIONS = `
  query GetAddressTransactions($address: String!, $direction: Direction, $limit: Int) {
    address(address: $address) {
      address
      balance
      transactionCount
      transactions(direction: $direction, limit: $limit) {
        edges {
          node {
            hash
            blockNumber
            timestamp
            from { address }
            to { address }
            value
            gasPrice
            status
          }
        }
        pageInfo {
          hasNextPage
        }
      }
    }
  }
`;

// ============================================================================
// ADDRESS QUERIES
// ============================================================================

export const GET_ADDRESS_INFO = `
  query GetAddressInfo($address: String!) {
    address(address: $address) {
      address
      balance
      nonce
      isContract
      code
      labels
      firstSeen
      lastSeen
      transactionCount
      totalSent
      totalReceived
      tokenBalances(limit: 20) {
        token {
          address
          name
          symbol
          decimals
        }
        balance
      }
      patterns {
        transactionFrequency
        avgTransactionValue
        mostActiveHour
        mostActiveDay
        regularityScore
        uniqueCounterparties
        isBot
        botConfidence
      }
    }
  }
`;

export const GET_RICH_LIST = `
  query GetRichList($limit: Int!) {
    richList(limit: $limit) {
      address
      balance
      isContract
      labels
      transactionCount
    }
  }
`;

export const GET_ADDRESS_HISTORY = `
  query GetAddressHistory($address: String!, $days: Int!) {
    address(address: $address) {
      address
      transactionHistory(days: $days) {
        date
        count
        volume
      }
      balanceHistory(days: $days) {
        timestamp
        balance
      }
    }
  }
`;

// ============================================================================
// EVENT QUERIES
// ============================================================================

export const SEARCH_EVENTS = `
  query SearchEvents($filter: EventFilter!, $limit: Int) {
    events(filter: $filter, limit: $limit) {
      edges {
        node {
          id
          blockNumber
          transactionHash
          address
          eventName
          signature
          args
          timestamp
          contract {
            address
            labels
          }
        }
      }
      totalCount
    }
  }
`;

export const GET_TOKEN_TRANSFERS = `
  query GetTokenTransfers($tokenAddress: String!, $limit: Int) {
    events(
      filter: {
        contractAddress: $tokenAddress
        eventName: "Transfer"
      }
      limit: $limit
    ) {
      edges {
        node {
          blockNumber
          transactionHash
          timestamp
          args
        }
      }
    }
  }
`;

// ============================================================================
// TOKEN QUERIES
// ============================================================================

export const GET_TOKEN_INFO = `
  query GetTokenInfo($address: String!) {
    token(address: $address) {
      address
      name
      symbol
      decimals
      totalSupply
      tokenType
      deployer
      deployedAt
      holderCount
      transferCount
      volume24h
      holders(limit: 100) {
        address
        balance
        percentage
      }
    }
  }
`;

export const GET_TOP_TOKENS = `
  query GetTopTokens($metric: TokenMetric!, $limit: Int!) {
    analytics {
      topTokens(metric: $metric, limit: $limit) {
        token {
          address
          name
          symbol
          tokenType
        }
        volume
        transactions
        uniqueTraders
      }
    }
  }
`;

// ============================================================================
// ANALYTICS QUERIES
// ============================================================================

export const GET_NETWORK_ANALYTICS = `
  query GetNetworkAnalytics($days: Int!) {
    analytics {
      dailyTransactions(days: $days) {
        date
        count
        volume
        avgGasPrice
        uniqueAddresses
      }
      dailyVolume(days: $days) {
        date
        volume
      }
      dailyActiveAddresses(days: $days) {
        date
        uniqueAddresses
      }
      networkGrowth(days: $days) {
        date
        newAddresses
        newContracts
        cumulativeAddresses
      }
    }
  }
`;

export const GET_GAS_ANALYTICS = `
  query GetGasAnalytics($hours: Int!) {
    analytics {
      gasPriceHistory(hours: $hours) {
        timestamp
        fast
        standard
        slow
        baseFee
      }
      topGasConsumers(limit: 20) {
        address
        gasUsed
        transactionCount
        totalSpent
      }
    }
  }
`;

export const GET_NETWORK_STATS = `
  query GetNetworkStats {
    networkStats {
      currentBlock
      totalBlocks
      totalTransactions
      totalAddresses
      totalContracts
      avgBlockTime
      currentTPS
      gasUtilization
    }
    gasPriceStats {
      timestamp
      fast
      standard
      slow
      baseFee
      percentiles {
        p10
        p25
        p50
        p75
        p90
        p95
        p99
      }
    }
  }
`;

// ============================================================================
// GRAPH QUERIES
// ============================================================================

export const GET_ADDRESS_NETWORK = `
  query GetAddressNetwork($address: String!, $limit: Int!) {
    addressNeighbors(address: $address, direction: BOTH, limit: $limit) {
      address
      transactionCount
      totalValue
      direction
      firstTransaction
      lastTransaction
    }
  }
`;

export const FIND_TRANSACTION_PATH = `
  query FindTransactionPath($from: String!, $to: String!, $maxHops: Int) {
    findPath(from: $from, to: $to, maxHops: $maxHops) {
      path
      totalValue
      hops
      transactions
    }
  }
`;

// ============================================================================
// COMPLEX QUERIES
// ============================================================================

export const ANALYZE_ADDRESS = `
  query AnalyzeAddress($address: String!) {
    address(address: $address) {
      address
      balance
      isContract
      labels
      transactionCount
      totalSent
      totalReceived

      # Recent transactions
      transactions(direction: BOTH, limit: 10) {
        edges {
          node {
            hash
            timestamp
            from { address }
            to { address }
            value
            decodedInput {
              methodName
            }
          }
        }
      }

      # Token holdings
      tokenBalances(limit: 10) {
        token {
          name
          symbol
          address
        }
        balance
      }

      # NFT holdings
      nftOwned(limit: 10) {
        tokenAddress
        tokenId
        metadata
      }

      # Behavioral patterns
      patterns {
        transactionFrequency
        avgTransactionValue
        mostActiveHour
        mostActiveDay
        regularityScore
        uniqueCounterparties
        suspicionScore
        isBot
        botConfidence
      }

      # Transaction history
      transactionHistory(days: 30) {
        date
        count
        volume
      }
    }

    # Network connections
    addressNeighbors(address: $address, limit: 20) {
      address
      transactionCount
      totalValue
      direction
    }
  }
`;

export const BLOCK_EXPLORER_VIEW = `
  query BlockExplorerView($blockNumber: Int!) {
    block(number: $blockNumber) {
      number
      hash
      timestamp
      miner
      gasUsed
      gasLimit
      baseFeePerGas
      transactionCount

      transactions {
        hash
        from {
          address
          isContract
          labels
        }
        to {
          address
          isContract
          labels
        }
        value
        gasPrice
        gasUsed
        status
        decodedInput {
          methodName
          signature
        }
        tokenTransfers {
          tokenType
          from
          to
          value
        }
      }
    }
  }
`;

// ============================================================================
// SUBSCRIPTIONS
// ============================================================================

export const SUBSCRIBE_NEW_BLOCKS = `
  subscription SubscribeNewBlocks {
    newBlock {
      number
      hash
      timestamp
      miner
      transactionCount
      gasUsed
      baseFeePerGas
    }
  }
`;

export const SUBSCRIBE_ADDRESS_TRANSACTIONS = `
  subscription SubscribeAddressTransactions($address: String!) {
    newTransaction(address: $address) {
      hash
      from { address }
      to { address }
      value
      timestamp
    }
  }
`;

export const SUBSCRIBE_CONTRACT_EVENTS = `
  subscription SubscribeContractEvents($contractAddress: String!, $eventName: String) {
    newEvent(contractAddress: $contractAddress, eventName: $eventName) {
      eventName
      args
      transactionHash
      timestamp
    }
  }
`;

export const SUBSCRIBE_GAS_PRICES = `
  subscription SubscribeGasPrices {
    gasPriceUpdate {
      timestamp
      fast
      standard
      slow
      baseFee
    }
  }
`;

// ============================================================================
// ADVANCED USE CASES
// ============================================================================

export const MEV_DETECTION = `
  query DetectMEV($blockNumber: Int!) {
    block(number: $blockNumber) {
      number
      transactions {
        hash
        transactionIndex
        from { address }
        to { address }
        value
        gasPrice
        decodedInput {
          methodName
        }
        classification {
          category
          confidence
          indicators
        }
      }
    }
  }
`;

export const TOKEN_ANALYTICS = `
  query TokenAnalytics($tokenAddress: String!, $days: Int!) {
    token(address: $tokenAddress) {
      name
      symbol
      holderCount
      volume24h

      holders(limit: 10) {
        address
        balance
        percentage
      }

      transfers(limit: 100) {
        from
        to
        value
        timestamp
      }
    }

    # Get transfer events
    events(
      filter: {
        contractAddress: $tokenAddress
        eventName: "Transfer"
      }
      limit: 1000
    ) {
      edges {
        node {
          timestamp
          args
        }
      }
    }
  }
`;
