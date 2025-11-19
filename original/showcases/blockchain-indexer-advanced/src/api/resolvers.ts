import { GraphQLError } from 'graphql';
import { GraphQLScalarType, Kind } from 'graphql';
import { Pool } from 'pg';
import { TimeSeriesDB } from '../storage/time-series-db';
import { GraphDB } from '../storage/graph-db';
import { logger } from '../utils/logger';

// Custom scalar types
const BigIntScalar = new GraphQLScalarType({
  name: 'BigInt',
  description: 'BigInt custom scalar type',
  serialize(value: any) {
    return value.toString();
  },
  parseValue(value: any) {
    return BigInt(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.INT || ast.kind === Kind.STRING) {
      return BigInt(ast.value);
    }
    return null;
  },
});

const DateTimeScalar = new GraphQLScalarType({
  name: 'DateTime',
  description: 'DateTime custom scalar type',
  serialize(value: any) {
    return value instanceof Date ? value.toISOString() : value;
  },
  parseValue(value: any) {
    return new Date(value);
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    return null;
  },
});

const JSONScalar = new GraphQLScalarType({
  name: 'JSON',
  description: 'JSON custom scalar type',
  serialize(value: any) {
    return value;
  },
  parseValue(value: any) {
    return value;
  },
  parseLiteral(ast) {
    if (ast.kind === Kind.OBJECT) {
      return ast;
    }
    return null;
  },
});

export const resolvers = {
  BigInt: BigIntScalar,
  DateTime: DateTimeScalar,
  JSON: JSONScalar,

  Query: {
    // Block queries
    async block(_: any, { number, hash }: any, context: any) {
      const { dataSources, loaders } = context;

      if (number !== undefined) {
        return loaders.blockLoader.load(number);
      }

      if (hash) {
        const result = await dataSources.pgPool.query(
          'SELECT * FROM blocks WHERE hash = $1',
          [hash.toLowerCase()]
        );
        return result.rows[0] || null;
      }

      throw new GraphQLError('Either number or hash must be provided');
    },

    async blocks(_: any, { fromBlock, toBlock, limit, offset }: any, context: any) {
      const { dataSources } = context;
      const { pgPool } = dataSources;

      let query = 'SELECT * FROM blocks WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (fromBlock !== undefined) {
        query += ` AND number >= $${paramCount++}`;
        params.push(fromBlock);
      }

      if (toBlock !== undefined) {
        query += ` AND number <= $${paramCount++}`;
        params.push(toBlock);
      }

      query += ` ORDER BY number DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await pgPool.query(query, params);
      const countResult = await pgPool.query(
        'SELECT COUNT(*) FROM blocks WHERE number >= $1 AND number <= $2',
        [fromBlock || 0, toBlock || 999999999]
      );

      return {
        edges: result.rows.map((block, index) => ({
          node: block,
          cursor: Buffer.from(`${block.number}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: result.rows.length === limit,
          hasPreviousPage: offset > 0,
          startCursor: result.rows[0]
            ? Buffer.from(`${result.rows[0].number}`).toString('base64')
            : null,
          endCursor: result.rows[result.rows.length - 1]
            ? Buffer.from(`${result.rows[result.rows.length - 1].number}`).toString('base64')
            : null,
        },
        totalCount: parseInt(countResult.rows[0].count, 10),
      };
    },

    async latestBlock(_: any, __: any, context: any) {
      const { dataSources } = context;
      const result = await dataSources.pgPool.query(
        'SELECT * FROM blocks ORDER BY number DESC LIMIT 1'
      );
      return result.rows[0] || null;
    },

    async blockRange(_: any, { from, to }: any, context: any) {
      const { dataSources } = context;
      const result = await dataSources.pgPool.query(
        'SELECT * FROM blocks WHERE number >= $1 AND number <= $2 ORDER BY number',
        [from, to]
      );
      return result.rows;
    },

    // Transaction queries
    async transaction(_: any, { hash }: any, context: any) {
      return context.loaders.transactionLoader.load(hash.toLowerCase());
    },

    async transactions(_: any, { filter, limit, offset, orderBy }: any, context: any) {
      const { dataSources } = context;
      const { pgPool } = dataSources;

      let query = 'SELECT t.*, b.timestamp FROM transactions t JOIN blocks b ON t.block_number = b.number WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filter) {
        if (filter.fromAddress) {
          query += ` AND t.from_address = $${paramCount++}`;
          params.push(filter.fromAddress.toLowerCase());
        }

        if (filter.toAddress) {
          query += ` AND t.to_address = $${paramCount++}`;
          params.push(filter.toAddress.toLowerCase());
        }

        if (filter.fromBlock !== undefined) {
          query += ` AND t.block_number >= $${paramCount++}`;
          params.push(filter.fromBlock);
        }

        if (filter.toBlock !== undefined) {
          query += ` AND t.block_number <= $${paramCount++}`;
          params.push(filter.toBlock);
        }

        if (filter.minValue) {
          query += ` AND CAST(t.value AS NUMERIC) >= $${paramCount++}`;
          params.push(filter.minValue.toString());
        }

        if (filter.maxValue) {
          query += ` AND CAST(t.value AS NUMERIC) <= $${paramCount++}`;
          params.push(filter.maxValue.toString());
        }

        if (filter.status !== undefined) {
          query += ` AND t.status = $${paramCount++}`;
          params.push(filter.status);
        }

        if (filter.methodName) {
          query += ` AND EXISTS (
            SELECT 1 FROM transaction_inputs ti
            WHERE ti.transaction_hash = t.hash
            AND ti.method_name = $${paramCount++}
          )`;
          params.push(filter.methodName);
        }
      }

      // Order by
      if (orderBy) {
        const fieldMap: Record<string, string> = {
          BLOCK_NUMBER: 't.block_number',
          TIMESTAMP: 'b.timestamp',
          VALUE: 'CAST(t.value AS NUMERIC)',
          GAS_PRICE: 'CAST(t.gas_price AS NUMERIC)',
        };

        const field = fieldMap[orderBy.field] || 't.block_number';
        const direction = orderBy.direction === 'ASC' ? 'ASC' : 'DESC';
        query += ` ORDER BY ${field} ${direction}`;
      } else {
        query += ' ORDER BY t.block_number DESC, t.transaction_index DESC';
      }

      query += ` LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await pgPool.query(query, params);

      return {
        edges: result.rows.map((tx, index) => ({
          node: tx,
          cursor: Buffer.from(`${tx.hash}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: result.rows.length === limit,
          hasPreviousPage: offset > 0,
          startCursor: result.rows[0]
            ? Buffer.from(`${result.rows[0].hash}`).toString('base64')
            : null,
          endCursor: result.rows[result.rows.length - 1]
            ? Buffer.from(`${result.rows[result.rows.length - 1].hash}`).toString('base64')
            : null,
        },
        totalCount: result.rows.length,
      };
    },

    // Address queries
    async address(_: any, { address }: any, context: any) {
      return context.loaders.addressLoader.load(address.toLowerCase());
    },

    async addresses(_: any, { filter, limit, offset }: any, context: any) {
      const { dataSources } = context;
      const { pgPool } = dataSources;

      let query = 'SELECT * FROM addresses WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filter) {
        if (filter.isContract !== undefined) {
          query += ` AND is_contract = $${paramCount++}`;
          params.push(filter.isContract);
        }

        if (filter.minBalance) {
          query += ` AND CAST(balance AS NUMERIC) >= $${paramCount++}`;
          params.push(filter.minBalance.toString());
        }

        if (filter.minTransactions) {
          query += ` AND transaction_count >= $${paramCount++}`;
          params.push(filter.minTransactions);
        }

        if (filter.labels && filter.labels.length > 0) {
          query += ` AND labels && $${paramCount++}`;
          params.push(filter.labels);
        }
      }

      query += ` ORDER BY transaction_count DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await pgPool.query(query, params);

      return {
        edges: result.rows.map((addr) => ({
          node: addr,
          cursor: Buffer.from(addr.address).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: result.rows.length === limit,
          hasPreviousPage: offset > 0,
        },
        totalCount: result.rows.length,
      };
    },

    async richList(_: any, { limit }: any, context: any) {
      const { dataSources } = context;
      const result = await dataSources.pgPool.query(
        `SELECT * FROM addresses
         ORDER BY CAST(balance AS NUMERIC) DESC
         LIMIT $1`,
        [limit]
      );
      return result.rows;
    },

    // Event queries
    async events(_: any, { filter, limit, offset }: any, context: any) {
      const { dataSources } = context;
      const { pgPool } = dataSources;

      let query = 'SELECT * FROM events WHERE 1=1';
      const params: any[] = [];
      let paramCount = 1;

      if (filter) {
        if (filter.contractAddress) {
          query += ` AND address = $${paramCount++}`;
          params.push(filter.contractAddress.toLowerCase());
        }

        if (filter.eventName) {
          query += ` AND event_name = $${paramCount++}`;
          params.push(filter.eventName);
        }

        if (filter.fromBlock !== undefined) {
          query += ` AND block_number >= $${paramCount++}`;
          params.push(filter.fromBlock);
        }

        if (filter.toBlock !== undefined) {
          query += ` AND block_number <= $${paramCount++}`;
          params.push(filter.toBlock);
        }
      }

      query += ` ORDER BY block_number DESC, log_index DESC LIMIT $${paramCount++} OFFSET $${paramCount++}`;
      params.push(limit, offset);

      const result = await pgPool.query(query, params);

      return {
        edges: result.rows.map((event, index) => ({
          node: {
            ...event,
            id: `${event.transaction_hash}-${event.log_index}`,
          },
          cursor: Buffer.from(`${event.block_number}-${event.log_index}`).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: result.rows.length === limit,
          hasPreviousPage: offset > 0,
        },
        totalCount: result.rows.length,
      };
    },

    // Token queries
    async token(_: any, { address }: any, context: any) {
      return context.loaders.tokenLoader.load(address.toLowerCase());
    },

    async tokens(_: any, { limit, offset }: any, context: any) {
      const { dataSources } = context;
      const result = await dataSources.pgPool.query(
        'SELECT * FROM tokens ORDER BY holder_count DESC LIMIT $1 OFFSET $2',
        [limit, offset]
      );

      return {
        edges: result.rows.map((token) => ({
          node: token,
          cursor: Buffer.from(token.address).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: result.rows.length === limit,
          hasPreviousPage: offset > 0,
        },
        totalCount: result.rows.length,
      };
    },

    async tokenHolders(_: any, { tokenAddress, limit }: any, context: any) {
      const { dataSources } = context;
      const result = await dataSources.pgPool.query(
        `SELECT
           address,
           balance,
           (CAST(balance AS NUMERIC) * 100.0 / NULLIF(
             (SELECT CAST(total_supply AS NUMERIC) FROM tokens WHERE address = $1),
             0
           )) as percentage
         FROM token_balances
         WHERE token_address = $1
         ORDER BY CAST(balance AS NUMERIC) DESC
         LIMIT $2`,
        [tokenAddress.toLowerCase(), limit]
      );

      return result.rows;
    },

    // Analytics
    async analytics(_: any, __: any, context: any) {
      return {}; // Resolved by Analytics type resolvers
    },

    // Network stats
    async networkStats(_: any, __: any, context: any) {
      const { dataSources } = context;
      const { pgPool } = dataSources;

      const [blocks, transactions, addresses, contracts, blockTime, tps, gasUtil] = await Promise.all([
        pgPool.query('SELECT COUNT(*) as count FROM blocks'),
        pgPool.query('SELECT COUNT(*) as count FROM transactions'),
        pgPool.query('SELECT COUNT(*) as count FROM addresses'),
        pgPool.query('SELECT COUNT(*) as count FROM addresses WHERE is_contract = true'),
        pgPool.query(`
          SELECT AVG(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY number))))
          FROM blocks
          WHERE number >= (SELECT MAX(number) - 1000 FROM blocks)
        `),
        pgPool.query(`
          SELECT AVG(transaction_count::float /
            NULLIF(EXTRACT(EPOCH FROM (timestamp - LAG(timestamp) OVER (ORDER BY number))), 0))
          FROM blocks
          WHERE number >= (SELECT MAX(number) - 100 FROM blocks)
        `),
        pgPool.query(`
          SELECT AVG(CAST(gas_used AS NUMERIC) * 100.0 / CAST(gas_limit AS NUMERIC))
          FROM blocks
          WHERE number >= (SELECT MAX(number) - 100 FROM blocks)
        `),
      ]);

      const latestBlock = await pgPool.query('SELECT MAX(number) FROM blocks');

      return {
        currentBlock: latestBlock.rows[0].max,
        totalBlocks: parseInt(blocks.rows[0].count, 10),
        totalTransactions: transactions.rows[0].count,
        totalAddresses: parseInt(addresses.rows[0].count, 10),
        totalContracts: parseInt(contracts.rows[0].count, 10),
        avgBlockTime: parseFloat(blockTime.rows[0].avg || 0),
        currentTPS: parseFloat(tps.rows[0].avg || 0),
        gasUtilization: parseFloat(gasUtil.rows[0].avg || 0),
      };
    },

    async gasPriceStats(_: any, __: any, context: any) {
      const { dataSources } = context;
      const result = await dataSources.pgPool.query(`
        SELECT
          timestamp,
          fast,
          standard,
          slow,
          base_fee,
          percentile_cont(0.10) WITHIN GROUP (ORDER BY CAST(standard AS NUMERIC)) as p10,
          percentile_cont(0.25) WITHIN GROUP (ORDER BY CAST(standard AS NUMERIC)) as p25,
          percentile_cont(0.50) WITHIN GROUP (ORDER BY CAST(standard AS NUMERIC)) as p50,
          percentile_cont(0.75) WITHIN GROUP (ORDER BY CAST(standard AS NUMERIC)) as p75,
          percentile_cont(0.90) WITHIN GROUP (ORDER BY CAST(standard AS NUMERIC)) as p90,
          percentile_cont(0.95) WITHIN GROUP (ORDER BY CAST(standard AS NUMERIC)) as p95,
          percentile_cont(0.99) WITHIN GROUP (ORDER BY CAST(standard AS NUMERIC)) as p99
        FROM gas_price_stats
        WHERE timestamp >= NOW() - INTERVAL '1 hour'
        GROUP BY timestamp, fast, standard, slow, base_fee
        ORDER BY timestamp DESC
        LIMIT 1
      `);

      if (result.rows.length === 0) {
        throw new GraphQLError('No gas price data available');
      }

      const row = result.rows[0];

      return {
        timestamp: row.timestamp,
        fast: row.fast,
        standard: row.standard,
        slow: row.slow,
        baseFee: row.base_fee,
        percentiles: {
          p10: row.p10,
          p25: row.p25,
          p50: row.p50,
          p75: row.p75,
          p90: row.p90,
          p95: row.p95,
          p99: row.p99,
        },
      };
    },

    // Graph queries
    async addressNeighbors(_: any, { address, direction, limit }: any, context: any) {
      const { dataSources } = context;
      const { graphDB } = dataSources;

      const directionMap: Record<string, 'in' | 'out' | 'both'> = {
        IN: 'in',
        OUT: 'out',
        BOTH: 'both',
      };

      return graphDB.getAddressNeighbors(
        address.toLowerCase(),
        directionMap[direction] || 'both',
        limit
      );
    },

    async findPath(_: any, { from, to, maxHops }: any, context: any) {
      const { dataSources } = context;
      const { graphDB } = dataSources;

      return graphDB.findShortestPath(from.toLowerCase(), to.toLowerCase(), maxHops);
    },

    // Search
    async search(_: any, { query, type }: any, context: any) {
      const { dataSources } = context;
      const { pgPool } = dataSources;

      const results: any = {
        blocks: [],
        transactions: [],
        addresses: [],
        tokens: [],
      };

      // Search blocks
      if (!type || type === 'ALL' || type === 'BLOCK') {
        if (/^\d+$/.test(query)) {
          const blockResult = await pgPool.query(
            'SELECT * FROM blocks WHERE number = $1',
            [parseInt(query, 10)]
          );
          results.blocks = blockResult.rows;
        }

        if (/^0x[0-9a-fA-F]{64}$/.test(query)) {
          const blockResult = await pgPool.query(
            'SELECT * FROM blocks WHERE hash = $1',
            [query.toLowerCase()]
          );
          results.blocks.push(...blockResult.rows);
        }
      }

      // Search transactions
      if (!type || type === 'ALL' || type === 'TRANSACTION') {
        if (/^0x[0-9a-fA-F]{64}$/.test(query)) {
          const txResult = await pgPool.query(
            'SELECT * FROM transactions WHERE hash = $1',
            [query.toLowerCase()]
          );
          results.transactions = txResult.rows;
        }
      }

      // Search addresses
      if (!type || type === 'ALL' || type === 'ADDRESS') {
        if (/^0x[0-9a-fA-F]{40}$/.test(query)) {
          const addrResult = await pgPool.query(
            'SELECT * FROM addresses WHERE address = $1',
            [query.toLowerCase()]
          );
          results.addresses = addrResult.rows;
        }
      }

      // Search tokens
      if (!type || type === 'ALL' || type === 'TOKEN') {
        if (/^0x[0-9a-fA-F]{40}$/.test(query)) {
          const tokenResult = await pgPool.query(
            'SELECT * FROM tokens WHERE address = $1',
            [query.toLowerCase()]
          );
          results.tokens = tokenResult.rows;
        }
      }

      return results;
    },
  },

  // Type resolvers
  Block: {
    timestamp: (block: any) => new Date(block.timestamp * 1000),
    async transactions(block: any, { limit, offset }: any, context: any) {
      const { dataSources } = context;
      const result = await dataSources.pgPool.query(
        'SELECT * FROM transactions WHERE block_number = $1 ORDER BY transaction_index LIMIT $2 OFFSET $3',
        [block.number, limit || 100, offset || 0]
      );
      return result.rows;
    },
    uncles: () => [], // Simplified
  },

  Transaction: {
    timestamp: (tx: any) => tx.timestamp,
    async from(tx: any, _: any, context: any) {
      return context.loaders.addressLoader.load(tx.from_address);
    },
    async to(tx: any, _: any, context: any) {
      return tx.to_address ? context.loaders.addressLoader.load(tx.to_address) : null;
    },
    async decodedInput(tx: any, _: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        'SELECT * FROM transaction_inputs WHERE transaction_hash = $1',
        [tx.hash]
      );

      if (result.rows.length === 0) return null;

      const row = result.rows[0];
      return {
        methodName: row.method_name,
        signature: row.method_signature,
        params: row.params,
      };
    },
    async logs(tx: any, _: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        'SELECT * FROM events WHERE transaction_hash = $1 ORDER BY log_index',
        [tx.hash]
      );
      return result.rows.map(e => ({ ...e, id: `${e.transaction_hash}-${e.log_index}` }));
    },
    async traces(tx: any, _: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        'SELECT * FROM transaction_traces WHERE transaction_hash = $1 ORDER BY trace_address',
        [tx.hash]
      );
      return result.rows;
    },
    async tokenTransfers(tx: any, _: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        'SELECT * FROM token_transfers WHERE transaction_hash = $1',
        [tx.hash]
      );
      return result.rows;
    },
  },

  Address: {
    async transactions(address: any, { direction, limit, offset }: any, context: any) {
      const { dataSources } = context;
      let query = 'SELECT t.*, b.timestamp FROM transactions t JOIN blocks b ON t.block_number = b.number WHERE ';

      if (direction === 'IN') {
        query += 't.to_address = $1';
      } else if (direction === 'OUT') {
        query += 't.from_address = $1';
      } else {
        query += '(t.from_address = $1 OR t.to_address = $1)';
      }

      query += ' ORDER BY t.block_number DESC LIMIT $2 OFFSET $3';

      const result = await dataSources.pgPool.query(query, [address.address, limit, offset]);

      return {
        edges: result.rows.map((tx) => ({
          node: tx,
          cursor: Buffer.from(tx.hash).toString('base64'),
        })),
        pageInfo: {
          hasNextPage: result.rows.length === limit,
          hasPreviousPage: offset > 0,
        },
        totalCount: result.rows.length,
      };
    },
    async tokenBalances(address: any, { limit }: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        'SELECT * FROM token_balances WHERE address = $1 ORDER BY CAST(balance AS NUMERIC) DESC LIMIT $2',
        [address.address, limit]
      );
      return result.rows;
    },
  },

  Analytics: {
    async dailyTransactions(_: any, { days }: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        `SELECT
           DATE(timestamp) as date,
           COUNT(*) as count,
           AVG(CAST(base_fee_per_gas AS NUMERIC)) as avg_gas_price
         FROM blocks
         WHERE timestamp >= NOW() - INTERVAL '${days} days'
         GROUP BY DATE(timestamp)
         ORDER BY date`,
        []
      );
      return result.rows;
    },
    async gasPriceHistory(_: any, { hours }: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        `SELECT * FROM gas_price_stats
         WHERE timestamp >= NOW() - INTERVAL '${hours} hours'
         ORDER BY timestamp`,
        []
      );
      return result.rows;
    },
  },

  Mutation: {
    async reindex(_: any, { fromBlock, toBlock }: any, context: any) {
      // Simplified implementation
      const jobId = `reindex_${Date.now()}`;
      return {
        id: jobId,
        fromBlock,
        toBlock,
        status: 'STARTED',
        startedAt: new Date(),
      };
    },
    async createCheckpoint(_: any, __: any, context: any) {
      const result = await context.dataSources.pgPool.query(
        'SELECT MAX(number) as number FROM blocks'
      );
      const blockNumber = result.rows[0].number;

      const block = await context.dataSources.pgPool.query(
        'SELECT * FROM blocks WHERE number = $1',
        [blockNumber]
      );

      return {
        blockNumber,
        blockHash: block.rows[0].hash,
        timestamp: block.rows[0].timestamp,
        createdAt: new Date(),
      };
    },
  },
};
