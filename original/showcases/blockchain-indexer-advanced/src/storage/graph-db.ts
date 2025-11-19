import neo4j, { Driver, Session, Result } from 'neo4j-driver';
import { logger } from '../utils/logger';

interface GraphConfig {
  uri: string;
  user: string;
  password: string;
}

interface Transaction {
  from: string;
  to: string | null;
  value: bigint;
  blockNumber: number;
  timestamp: number;
}

interface AddressNode {
  address: string;
  firstSeen: number;
  lastSeen: number;
  totalTransactions: number;
  labels: string[];
  isContract: boolean;
}

interface TransactionEdge {
  from: string;
  to: string;
  transactionCount: number;
  totalValue: bigint;
  firstTransaction: number;
  lastTransaction: number;
}

interface AddressCommunity {
  communityId: number;
  members: string[];
  size: number;
  internalTransactions: number;
  externalTransactions: number;
}

interface FundFlow {
  path: string[];
  totalValue: bigint;
  hops: number;
  transactions: number;
}

export class GraphDB {
  private driver: Driver;
  private config: GraphConfig;

  constructor(config: GraphConfig) {
    this.config = config;
    this.driver = neo4j.driver(
      config.uri,
      neo4j.auth.basic(config.user, config.password),
      {
        maxConnectionLifetime: 3 * 60 * 60 * 1000, // 3 hours
        maxConnectionPoolSize: 50,
        connectionAcquisitionTimeout: 2 * 60 * 1000, // 2 minutes
      }
    );

    this.initialize();
  }

  private async initialize(): Promise<void> {
    const session = this.driver.session();

    try {
      // Create constraints
      await session.run(`
        CREATE CONSTRAINT address_unique IF NOT EXISTS
        FOR (a:Address) REQUIRE a.address IS UNIQUE
      `);

      await session.run(`
        CREATE CONSTRAINT contract_unique IF NOT EXISTS
        FOR (c:Contract) REQUIRE c.address IS UNIQUE
      `);

      // Create indexes
      await session.run(`
        CREATE INDEX address_first_seen IF NOT EXISTS
        FOR (a:Address) ON (a.firstSeen)
      `);

      await session.run(`
        CREATE INDEX address_last_seen IF NOT EXISTS
        FOR (a:Address) ON (a.lastSeen)
      `);

      await session.run(`
        CREATE INDEX transaction_timestamp IF NOT EXISTS
        FOR ()-[r:TRANSACTED]->() ON (r.timestamp)
      `);

      await session.run(`
        CREATE INDEX transaction_value IF NOT EXISTS
        FOR ()-[r:TRANSACTED]->() ON (r.totalValue)
      `);

      logger.info('Graph database initialized');
    } catch (error) {
      logger.error('Failed to initialize graph database', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  async recordTransactions(transactions: Transaction[]): Promise<void> {
    if (transactions.length === 0) return;

    const session = this.driver.session();

    try {
      // Batch transactions for better performance
      const batchSize = 1000;
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize);
        await this.processBatch(session, batch);
      }

      logger.debug('Recorded transactions in graph', {
        count: transactions.length,
      });
    } catch (error) {
      logger.error('Failed to record transactions in graph', { error });
      throw error;
    } finally {
      await session.close();
    }
  }

  private async processBatch(session: Session, transactions: Transaction[]): Promise<void> {
    const query = `
      UNWIND $transactions AS tx

      // Create or update sender node
      MERGE (from:Address {address: tx.from})
      ON CREATE SET
        from.firstSeen = tx.blockNumber,
        from.lastSeen = tx.blockNumber,
        from.totalTransactions = 1
      ON MATCH SET
        from.lastSeen = tx.blockNumber,
        from.totalTransactions = from.totalTransactions + 1

      // Create or update receiver node (if exists)
      FOREACH (ignoreMe IN CASE WHEN tx.to IS NOT NULL THEN [1] ELSE [] END |
        MERGE (to:Address {address: tx.to})
        ON CREATE SET
          to.firstSeen = tx.blockNumber,
          to.lastSeen = tx.blockNumber,
          to.totalTransactions = 1
        ON MATCH SET
          to.lastSeen = tx.blockNumber,
          to.totalTransactions = to.totalTransactions + 1

        // Create or update transaction relationship
        MERGE (from)-[r:TRANSACTED]->(to)
        ON CREATE SET
          r.transactionCount = 1,
          r.totalValue = tx.value,
          r.firstTransaction = tx.timestamp,
          r.lastTransaction = tx.timestamp
        ON MATCH SET
          r.transactionCount = r.transactionCount + 1,
          r.totalValue = r.totalValue + tx.value,
          r.lastTransaction = tx.timestamp
      )
    `;

    const params = {
      transactions: transactions.map(tx => ({
        from: tx.from.toLowerCase(),
        to: tx.to?.toLowerCase() || null,
        value: tx.value.toString(),
        blockNumber: tx.blockNumber,
        timestamp: tx.timestamp,
      })),
    };

    await session.run(query, params);
  }

  async markAsContract(address: string, deployedAt: number): Promise<void> {
    const session = this.driver.session();

    try {
      await session.run(
        `
        MATCH (a:Address {address: $address})
        SET a:Contract, a.deployedAt = $deployedAt
        `,
        {
          address: address.toLowerCase(),
          deployedAt,
        }
      );
    } catch (error) {
      logger.error('Failed to mark address as contract', { error, address });
    } finally {
      await session.close();
    }
  }

  async labelAddress(address: string, labels: string[]): Promise<void> {
    const session = this.driver.session();

    try {
      await session.run(
        `
        MATCH (a:Address {address: $address})
        SET a.labels = $labels
        `,
        {
          address: address.toLowerCase(),
          labels,
        }
      );
    } catch (error) {
      logger.error('Failed to label address', { error, address });
    } finally {
      await session.close();
    }
  }

  async getAddressNeighbors(
    address: string,
    direction: 'in' | 'out' | 'both' = 'both',
    limit: number = 100
  ): Promise<Array<{
    address: string;
    transactionCount: number;
    totalValue: bigint;
    direction: 'in' | 'out';
  }>> {
    const session = this.driver.session();

    try {
      let query: string;

      switch (direction) {
        case 'in':
          query = `
            MATCH (other:Address)-[r:TRANSACTED]->(a:Address {address: $address})
            RETURN other.address AS address,
                   r.transactionCount AS transactionCount,
                   r.totalValue AS totalValue,
                   'in' AS direction
            ORDER BY r.transactionCount DESC
            LIMIT $limit
          `;
          break;

        case 'out':
          query = `
            MATCH (a:Address {address: $address})-[r:TRANSACTED]->(other:Address)
            RETURN other.address AS address,
                   r.transactionCount AS transactionCount,
                   r.totalValue AS totalValue,
                   'out' AS direction
            ORDER BY r.transactionCount DESC
            LIMIT $limit
          `;
          break;

        default:
          query = `
            MATCH (a:Address {address: $address})-[r:TRANSACTED]-(other:Address)
            RETURN other.address AS address,
                   r.transactionCount AS transactionCount,
                   r.totalValue AS totalValue,
                   CASE WHEN startNode(r) = a THEN 'out' ELSE 'in' END AS direction
            ORDER BY r.transactionCount DESC
            LIMIT $limit
          `;
      }

      const result = await session.run(query, {
        address: address.toLowerCase(),
        limit: neo4j.int(limit),
      });

      return result.records.map(record => ({
        address: record.get('address'),
        transactionCount: record.get('transactionCount').toNumber(),
        totalValue: BigInt(record.get('totalValue')),
        direction: record.get('direction'),
      }));
    } catch (error) {
      logger.error('Failed to get address neighbors', { error, address });
      return [];
    } finally {
      await session.close();
    }
  }

  async findShortestPath(
    fromAddress: string,
    toAddress: string,
    maxHops: number = 5
  ): Promise<FundFlow | null> {
    const session = this.driver.session();

    try {
      const query = `
        MATCH path = shortestPath(
          (from:Address {address: $fromAddress})-[r:TRANSACTED*..${maxHops}]->(to:Address {address: $toAddress})
        )
        WITH path, relationships(path) AS rels
        RETURN [node IN nodes(path) | node.address] AS addresses,
               reduce(total = 0, r IN rels | total + r.totalValue) AS totalValue,
               reduce(total = 0, r IN rels | total + r.transactionCount) AS transactions,
               length(path) AS hops
      `;

      const result = await session.run(query, {
        fromAddress: fromAddress.toLowerCase(),
        toAddress: toAddress.toLowerCase(),
      });

      if (result.records.length === 0) return null;

      const record = result.records[0];
      return {
        path: record.get('addresses'),
        totalValue: BigInt(record.get('totalValue')),
        transactions: record.get('transactions').toNumber(),
        hops: record.get('hops').toNumber(),
      };
    } catch (error) {
      logger.error('Failed to find shortest path', { error, fromAddress, toAddress });
      return null;
    } finally {
      await session.close();
    }
  }

  async detectCommunities(algorithm: 'louvain' | 'labelPropagation' = 'louvain'): Promise<AddressCommunity[]> {
    const session = this.driver.session();

    try {
      // First, create a graph projection if it doesn't exist
      await session.run(`
        CALL gds.graph.exists('addressGraph') YIELD exists
        CALL apoc.do.when(
          NOT exists,
          'CALL gds.graph.project(
            "addressGraph",
            "Address",
            {
              TRANSACTED: {
                orientation: "UNDIRECTED",
                properties: ["transactionCount", "totalValue"]
              }
            }
          )',
          '',
          {}
        ) YIELD value
        RETURN value
      `);

      // Run community detection algorithm
      let algoQuery: string;

      if (algorithm === 'louvain') {
        algoQuery = `
          CALL gds.louvain.stream('addressGraph')
          YIELD nodeId, communityId
          WITH gds.util.asNode(nodeId) AS node, communityId
          RETURN communityId,
                 collect(node.address) AS members,
                 count(*) AS size
          ORDER BY size DESC
          LIMIT 100
        `;
      } else {
        algoQuery = `
          CALL gds.labelPropagation.stream('addressGraph')
          YIELD nodeId, communityId
          WITH gds.util.asNode(nodeId) AS node, communityId
          RETURN communityId,
                 collect(node.address) AS members,
                 count(*) AS size
          ORDER BY size DESC
          LIMIT 100
        `;
      }

      const result = await session.run(algoQuery);

      const communities: AddressCommunity[] = [];

      for (const record of result.records) {
        const communityId = record.get('communityId').toNumber();
        const members = record.get('members');
        const size = record.get('size').toNumber();

        // Calculate internal vs external transactions
        const statsQuery = `
          MATCH (a:Address)-[r:TRANSACTED]->(b:Address)
          WHERE a.address IN $members AND b.address IN $members
          RETURN count(r) AS internal
        `;

        const statsResult = await session.run(statsQuery, { members });
        const internal = statsResult.records[0]?.get('internal').toNumber() || 0;

        communities.push({
          communityId,
          members,
          size,
          internalTransactions: internal,
          externalTransactions: 0, // Would need additional query
        });
      }

      return communities;
    } catch (error) {
      logger.error('Failed to detect communities', { error, algorithm });
      return [];
    } finally {
      await session.close();
    }
  }

  async calculatePageRank(
    iterations: number = 20,
    dampingFactor: number = 0.85
  ): Promise<Array<{ address: string; rank: number }>> {
    const session = this.driver.session();

    try {
      // Ensure graph projection exists
      await session.run(`
        CALL gds.graph.exists('addressGraph') YIELD exists
        CALL apoc.do.when(
          NOT exists,
          'CALL gds.graph.project(
            "addressGraph",
            "Address",
            "TRANSACTED"
          )',
          '',
          {}
        ) YIELD value
        RETURN value
      `);

      // Run PageRank
      const query = `
        CALL gds.pageRank.stream('addressGraph', {
          maxIterations: $iterations,
          dampingFactor: $dampingFactor
        })
        YIELD nodeId, score
        WITH gds.util.asNode(nodeId) AS node, score
        RETURN node.address AS address, score AS rank
        ORDER BY rank DESC
        LIMIT 1000
      `;

      const result = await session.run(query, {
        iterations: neo4j.int(iterations),
        dampingFactor,
      });

      return result.records.map(record => ({
        address: record.get('address'),
        rank: record.get('rank'),
      }));
    } catch (error) {
      logger.error('Failed to calculate PageRank', { error });
      return [];
    } finally {
      await session.close();
    }
  }

  async findInfluentialAddresses(
    metric: 'degree' | 'betweenness' | 'closeness' = 'degree',
    limit: number = 100
  ): Promise<Array<{ address: string; score: number }>> {
    const session = this.driver.session();

    try {
      let query: string;

      switch (metric) {
        case 'degree':
          query = `
            MATCH (a:Address)
            WITH a, size((a)-[:TRANSACTED]-()) AS degree
            RETURN a.address AS address, degree AS score
            ORDER BY score DESC
            LIMIT $limit
          `;
          break;

        case 'betweenness':
          // Requires GDS library
          query = `
            CALL gds.graph.exists('addressGraph') YIELD exists
            CALL apoc.do.when(
              exists,
              'CALL gds.betweenness.stream("addressGraph")
               YIELD nodeId, score
               WITH gds.util.asNode(nodeId) AS node, score
               RETURN node.address AS address, score
               ORDER BY score DESC
               LIMIT $limit',
              'RETURN null AS address, 0 AS score',
              {limit: $limit}
            ) YIELD value
            RETURN value.address AS address, value.score AS score
          `;
          break;

        case 'closeness':
          query = `
            MATCH (a:Address)
            WITH a, 1.0 / avg(size(shortestPath((a)-[:TRANSACTED*..5]-(other:Address)))) AS closeness
            WHERE closeness IS NOT NULL
            RETURN a.address AS address, closeness AS score
            ORDER BY score DESC
            LIMIT $limit
          `;
          break;
      }

      const result = await session.run(query, { limit: neo4j.int(limit) });

      return result.records.map(record => ({
        address: record.get('address'),
        score: typeof record.get('score') === 'number'
          ? record.get('score')
          : record.get('score').toNumber(),
      }));
    } catch (error) {
      logger.error('Failed to find influential addresses', { error, metric });
      return [];
    } finally {
      await session.close();
    }
  }

  async traceFunds(
    startAddress: string,
    minValue: bigint,
    maxHops: number = 5,
    timeWindow?: { start: number; end: number }
  ): Promise<FundFlow[]> {
    const session = this.driver.session();

    try {
      let query = `
        MATCH path = (start:Address {address: $startAddress})-[r:TRANSACTED*1..${maxHops}]->()
        WHERE all(rel IN r WHERE rel.totalValue >= $minValue
      `;

      if (timeWindow) {
        query += ` AND rel.lastTransaction >= $startTime AND rel.lastTransaction <= $endTime`;
      }

      query += `)
        WITH path, relationships(path) AS rels
        RETURN [node IN nodes(path) | node.address] AS addresses,
               reduce(total = 0, r IN rels | total + r.totalValue) AS totalValue,
               reduce(total = 0, r IN rels | total + r.transactionCount) AS transactions,
               length(path) AS hops
        ORDER BY totalValue DESC
        LIMIT 100
      `;

      const params: any = {
        startAddress: startAddress.toLowerCase(),
        minValue: minValue.toString(),
      };

      if (timeWindow) {
        params.startTime = neo4j.int(timeWindow.start);
        params.endTime = neo4j.int(timeWindow.end);
      }

      const result = await session.run(query, params);

      return result.records.map(record => ({
        path: record.get('addresses'),
        totalValue: BigInt(record.get('totalValue')),
        transactions: record.get('transactions').toNumber(),
        hops: record.get('hops').toNumber(),
      }));
    } catch (error) {
      logger.error('Failed to trace funds', { error, startAddress });
      return [];
    } finally {
      await session.close();
    }
  }

  async findCircularTransactions(
    minValue: bigint,
    maxHops: number = 6
  ): Promise<Array<{
    cycle: string[];
    totalValue: bigint;
    hops: number;
  }>> {
    const session = this.driver.session();

    try {
      const query = `
        MATCH path = (a:Address)-[r:TRANSACTED*2..${maxHops}]->(a)
        WHERE all(rel IN r WHERE rel.totalValue >= $minValue)
        AND length(path) >= 2
        WITH path, relationships(path) AS rels
        WHERE all(i IN range(0, size(nodes(path))-2) WHERE nodes(path)[i] <> nodes(path)[i+1])
        RETURN [node IN nodes(path) | node.address] AS cycle,
               reduce(total = 0, r IN rels | total + r.totalValue) AS totalValue,
               length(path) AS hops
        ORDER BY totalValue DESC
        LIMIT 100
      `;

      const result = await session.run(query, {
        minValue: minValue.toString(),
      });

      return result.records.map(record => ({
        cycle: record.get('cycle'),
        totalValue: BigInt(record.get('totalValue')),
        hops: record.get('hops').toNumber(),
      }));
    } catch (error) {
      logger.error('Failed to find circular transactions', { error });
      return [];
    } finally {
      await session.close();
    }
  }

  async getGraphStats(): Promise<{
    totalAddresses: number;
    totalContracts: number;
    totalRelationships: number;
    avgDegree: number;
  }> {
    const session = this.driver.session();

    try {
      const query = `
        MATCH (a:Address)
        OPTIONAL MATCH (c:Contract)
        OPTIONAL MATCH ()-[r:TRANSACTED]->()
        RETURN
          count(DISTINCT a) AS totalAddresses,
          count(DISTINCT c) AS totalContracts,
          count(r) AS totalRelationships,
          avg(size((a)-[:TRANSACTED]-())) AS avgDegree
      `;

      const result = await session.run(query);
      const record = result.records[0];

      return {
        totalAddresses: record.get('totalAddresses').toNumber(),
        totalContracts: record.get('totalContracts').toNumber(),
        totalRelationships: record.get('totalRelationships').toNumber(),
        avgDegree: record.get('avgDegree') || 0,
      };
    } catch (error) {
      logger.error('Failed to get graph stats', { error });
      return {
        totalAddresses: 0,
        totalContracts: 0,
        totalRelationships: 0,
        avgDegree: 0,
      };
    } finally {
      await session.close();
    }
  }

  async close(): Promise<void> {
    await this.driver.close();
    logger.info('Graph database connection closed');
  }
}
