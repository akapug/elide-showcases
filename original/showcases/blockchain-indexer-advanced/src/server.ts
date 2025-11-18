import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';
import { ApolloServerPluginLandingPageLocalDefault } from '@apollo/server/plugin/landingPage/default';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { json } from 'body-parser';
import { WebSocketServer } from 'ws';
import { useServer } from 'graphql-ws/lib/use/ws';
import { makeExecutableSchema } from '@graphql-tools/schema';
import Redis from 'ioredis';
import { createClient } from 'redis';
import { Pool } from 'pg';
import compression from 'compression';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createPrometheusExporterPlugin } from '@bmatei/apollo-prometheus-exporter';
import prometheus from 'prom-client';
import { typeDefs } from './api/graphql-schema';
import { resolvers } from './api/resolvers';
import { TimeSeriesDB } from './storage/time-series-db';
import { GraphDB } from './storage/graph-db';
import { BlockProcessor } from './indexer/block-processor';
import { logger } from './utils/logger';
import { createContext } from './utils/context';
import { validateApiKey } from './utils/auth';
import { DataLoader } from 'dataloader';
import { LRUCache } from 'lru-cache';

// Environment configuration
const PORT = parseInt(process.env.API_PORT || '4000', 10);
const WS_PORT = parseInt(process.env.WS_PORT || '4001', 10);
const ENABLE_PLAYGROUND = process.env.GRAPHQL_PLAYGROUND === 'true';
const ENABLE_METRICS = process.env.ENABLE_METRICS === 'true';
const METRICS_PORT = parseInt(process.env.METRICS_PORT || '9090', 10);
const RATE_LIMIT_REQUESTS = parseInt(process.env.RATE_LIMIT_REQUESTS || '1000', 10);
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10);
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300', 10);
const MAX_QUERY_DEPTH = parseInt(process.env.MAX_QUERY_DEPTH || '10', 10);
const MAX_QUERY_COMPLEXITY = parseInt(process.env.MAX_QUERY_COMPLEXITY || '1000', 10);

// Database connections
const pgPool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'blockchain_indexer',
  user: process.env.POSTGRES_USER || 'indexer',
  password: process.env.POSTGRES_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Redis clients
const redisCache = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  db: parseInt(process.env.REDIS_DB || '0', 10),
  retryStrategy: (times) => Math.min(times * 50, 2000),
  enableReadyCheck: true,
  maxRetriesPerRequest: 3,
});

const redisPubSub = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  db: 1,
});

// Initialize storage layers
const timeSeriesDB = new TimeSeriesDB(pgPool);
const graphDB = new GraphDB({
  uri: process.env.NEO4J_URI || 'bolt://localhost:7687',
  user: process.env.NEO4J_USER || 'neo4j',
  password: process.env.NEO4J_PASSWORD,
});

// Prometheus metrics
const register = new prometheus.Registry();
prometheus.collectDefaultMetrics({ register });

const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const graphqlQueryDuration = new prometheus.Histogram({
  name: 'graphql_query_duration_seconds',
  help: 'Duration of GraphQL queries in seconds',
  labelNames: ['operation_name', 'operation_type'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5],
  registers: [register],
});

const cacheHits = new prometheus.Counter({
  name: 'cache_hits_total',
  help: 'Total number of cache hits',
  labelNames: ['cache_type'],
  registers: [register],
});

const cacheMisses = new prometheus.Counter({
  name: 'cache_misses_total',
  help: 'Total number of cache misses',
  labelNames: ['cache_type'],
  registers: [register],
});

const activeConnections = new prometheus.Gauge({
  name: 'active_connections',
  help: 'Number of active connections',
  labelNames: ['type'],
  registers: [register],
});

const queryErrors = new prometheus.Counter({
  name: 'query_errors_total',
  help: 'Total number of query errors',
  labelNames: ['operation_name', 'error_type'],
  registers: [register],
});

// In-memory LRU cache for hot data
const lruCache = new LRUCache<string, any>({
  max: 10000,
  ttl: CACHE_TTL * 1000,
  updateAgeOnGet: true,
  updateAgeOnHas: false,
});

// DataLoader for batching and caching
function createDataLoaders(context: any) {
  return {
    blockLoader: new DataLoader(async (blockNumbers: readonly number[]) => {
      const cacheKey = `blocks:${blockNumbers.join(',')}`;
      const cached = lruCache.get(cacheKey);
      if (cached) {
        cacheHits.inc({ cache_type: 'block' });
        return cached;
      }

      cacheMisses.inc({ cache_type: 'block' });
      const result = await pgPool.query(
        'SELECT * FROM blocks WHERE number = ANY($1) ORDER BY number',
        [blockNumbers]
      );

      const blockMap = new Map(result.rows.map(b => [b.number, b]));
      const blocks = blockNumbers.map(num => blockMap.get(num) || null);
      lruCache.set(cacheKey, blocks);
      return blocks;
    }, {
      maxBatchSize: 100,
      cacheKeyFn: (key) => `block:${key}`,
    }),

    transactionLoader: new DataLoader(async (txHashes: readonly string[]) => {
      const cacheKey = `txs:${txHashes.join(',')}`;
      const cached = lruCache.get(cacheKey);
      if (cached) {
        cacheHits.inc({ cache_type: 'transaction' });
        return cached;
      }

      cacheMisses.inc({ cache_type: 'transaction' });
      const result = await pgPool.query(
        'SELECT * FROM transactions WHERE hash = ANY($1)',
        [txHashes]
      );

      const txMap = new Map(result.rows.map(tx => [tx.hash, tx]));
      const transactions = txHashes.map(hash => txMap.get(hash) || null);
      lruCache.set(cacheKey, transactions);
      return transactions;
    }, {
      maxBatchSize: 1000,
      cacheKeyFn: (key) => `tx:${key}`,
    }),

    addressLoader: new DataLoader(async (addresses: readonly string[]) => {
      const cacheKey = `addresses:${addresses.join(',')}`;
      const cached = lruCache.get(cacheKey);
      if (cached) {
        cacheHits.inc({ cache_type: 'address' });
        return cached;
      }

      cacheMisses.inc({ cache_type: 'address' });
      const result = await pgPool.query(
        'SELECT * FROM addresses WHERE address = ANY($1)',
        [addresses]
      );

      const addressMap = new Map(result.rows.map(a => [a.address, a]));
      const addressData = addresses.map(addr => addressMap.get(addr) || null);
      lruCache.set(cacheKey, addressData);
      return addressData;
    }, {
      maxBatchSize: 500,
      cacheKeyFn: (key) => `address:${key}`,
    }),

    eventLoader: new DataLoader(async (eventIds: readonly string[]) => {
      const result = await pgPool.query(
        'SELECT * FROM events WHERE id = ANY($1)',
        [eventIds]
      );

      const eventMap = new Map(result.rows.map(e => [e.id, e]));
      return eventIds.map(id => eventMap.get(id) || null);
    }, {
      maxBatchSize: 1000,
      cacheKeyFn: (key) => `event:${key}`,
    }),

    tokenLoader: new DataLoader(async (tokenAddresses: readonly string[]) => {
      const result = await pgPool.query(
        'SELECT * FROM tokens WHERE address = ANY($1)',
        [tokenAddresses]
      );

      const tokenMap = new Map(result.rows.map(t => [t.address, t]));
      return tokenAddresses.map(addr => tokenMap.get(addr) || null);
    }, {
      maxBatchSize: 200,
      cacheKeyFn: (key) => `token:${key}`,
    }),
  };
}

// Cache helper functions
async function getCachedOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttl: number = CACHE_TTL
): Promise<T> {
  // Try LRU cache first
  const lruValue = lruCache.get(key);
  if (lruValue !== undefined) {
    cacheHits.inc({ cache_type: 'lru' });
    return lruValue;
  }

  // Try Redis cache
  try {
    const cached = await redisCache.get(key);
    if (cached) {
      cacheHits.inc({ cache_type: 'redis' });
      const parsed = JSON.parse(cached);
      lruCache.set(key, parsed); // Populate LRU
      return parsed;
    }
  } catch (error) {
    logger.error('Redis cache error', { error, key });
  }

  // Fetch from source
  cacheMisses.inc({ cache_type: 'all' });
  const value = await fetcher();

  // Store in both caches
  lruCache.set(key, value);
  try {
    await redisCache.setex(key, ttl, JSON.stringify(value));
  } catch (error) {
    logger.error('Redis cache set error', { error, key });
  }

  return value;
}

async function invalidateCache(pattern: string): Promise<void> {
  try {
    const keys = await redisCache.keys(pattern);
    if (keys.length > 0) {
      await redisCache.del(...keys);
    }

    // Clear LRU cache entries matching pattern
    for (const key of lruCache.keys()) {
      if (key.match(new RegExp(pattern.replace('*', '.*')))) {
        lruCache.delete(key);
      }
    }

    logger.info('Cache invalidated', { pattern, keysCleared: keys.length });
  } catch (error) {
    logger.error('Cache invalidation error', { error, pattern });
  }
}

// Query complexity analysis
function calculateComplexity(query: any): number {
  let complexity = 0;

  function traverse(node: any, depth: number = 1) {
    if (!node) return;

    if (node.kind === 'Field') {
      complexity += depth;

      if (node.arguments?.length > 0) {
        complexity += node.arguments.length;
      }

      if (node.selectionSet) {
        node.selectionSet.selections.forEach((selection: any) => {
          traverse(selection, depth + 1);
        });
      }
    }

    if (node.selectionSet) {
      node.selectionSet.selections?.forEach((selection: any) => {
        traverse(selection, depth);
      });
    }
  }

  traverse(query);
  return complexity;
}

// Query depth validation
function getQueryDepth(query: any, depth: number = 0): number {
  if (!query || !query.selectionSet) return depth;

  let maxDepth = depth;
  for (const selection of query.selectionSet.selections) {
    if (selection.kind === 'Field') {
      const selectionDepth = getQueryDepth(selection, depth + 1);
      maxDepth = Math.max(maxDepth, selectionDepth);
    }
  }

  return maxDepth;
}

// GraphQL schema
const schema = makeExecutableSchema({
  typeDefs,
  resolvers,
});

// Apollo Server plugins
const plugins = [
  ApolloServerPluginDrainHttpServer({ httpServer: http.createServer() }),
];

if (ENABLE_PLAYGROUND) {
  plugins.push(ApolloServerPluginLandingPageLocalDefault());
}

if (ENABLE_METRICS) {
  plugins.push(
    createPrometheusExporterPlugin({ app: express(), server: null })
  );
}

// Request logging plugin
plugins.push({
  async requestDidStart(requestContext) {
    const start = Date.now();
    const operationName = requestContext.request.operationName || 'anonymous';

    return {
      async didEncounterErrors(errorContext) {
        errorContext.errors.forEach(error => {
          logger.error('GraphQL error', {
            operationName,
            error: error.message,
            path: error.path,
          });
          queryErrors.inc({
            operation_name: operationName,
            error_type: error.extensions?.code || 'UNKNOWN',
          });
        });
      },

      async willSendResponse(responseContext) {
        const duration = (Date.now() - start) / 1000;
        graphqlQueryDuration.observe(
          {
            operation_name: operationName,
            operation_type: requestContext.operation?.operation || 'unknown',
          },
          duration
        );

        logger.info('GraphQL request completed', {
          operationName,
          duration,
          errors: responseContext.errors?.length || 0,
        });
      },
    };
  },
});

// Query validation plugin
plugins.push({
  async requestDidStart(requestContext) {
    return {
      async didResolveOperation(operationContext) {
        const operation = operationContext.operation;

        // Check query depth
        const depth = getQueryDepth(operation);
        if (depth > MAX_QUERY_DEPTH) {
          throw new Error(
            `Query depth ${depth} exceeds maximum allowed depth ${MAX_QUERY_DEPTH}`
          );
        }

        // Check query complexity
        const complexity = calculateComplexity(operation);
        if (complexity > MAX_QUERY_COMPLEXITY) {
          throw new Error(
            `Query complexity ${complexity} exceeds maximum allowed complexity ${MAX_QUERY_COMPLEXITY}`
          );
        }
      },
    };
  },
});

// Subscription pubsub
const subscriptionManager = {
  async publish(topic: string, payload: any): Promise<void> {
    await redisPubSub.publish(topic, JSON.stringify(payload));
  },

  async subscribe(topic: string, callback: (payload: any) => void): Promise<void> {
    const subscriber = redisPubSub.duplicate();
    await subscriber.subscribe(topic);
    subscriber.on('message', (channel, message) => {
      if (channel === topic) {
        callback(JSON.parse(message));
      }
    });
  },
};

// Main server setup
async function startServer() {
  const app = express();
  const httpServer = http.createServer(app);

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: ENABLE_PLAYGROUND ? false : undefined,
    crossOriginEmbedderPolicy: false,
  }));

  // Compression
  app.use(compression());

  // CORS
  app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || '*',
    credentials: true,
  }));

  // Rate limiting
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    max: RATE_LIMIT_REQUESTS,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => {
      // Skip rate limiting for authenticated admin users
      const apiKey = req.headers['x-api-key'] as string;
      return apiKey && validateApiKey(apiKey, 'admin');
    },
  });

  app.use('/graphql', limiter);

  // Request timing middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = (Date.now() - start) / 1000;
      httpRequestDuration.observe(
        {
          method: req.method,
          route: req.route?.path || req.path,
          status: res.statusCode.toString(),
        },
        duration
      );
    });
    next();
  });

  // Health check endpoint
  app.get('/health', async (req, res) => {
    try {
      await pgPool.query('SELECT 1');
      await redisCache.ping();

      const blockProcessor = new BlockProcessor(pgPool, timeSeriesDB, graphDB);
      const status = await blockProcessor.getStatus();

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        services: {
          postgres: 'up',
          redis: 'up',
          indexer: status.isRunning ? 'running' : 'stopped',
        },
        indexer: {
          currentBlock: status.currentBlock,
          targetBlock: status.targetBlock,
          lag: status.lag,
          blocksPerSecond: status.blocksPerSecond,
        },
      });
    } catch (error) {
      logger.error('Health check failed', { error });
      res.status(503).json({
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Metrics endpoint
  if (ENABLE_METRICS) {
    app.get('/metrics', async (req, res) => {
      try {
        res.set('Content-Type', register.contentType);
        res.end(await register.metrics());
      } catch (error) {
        res.status(500).end(error);
      }
    });
  }

  // Export endpoint
  app.post('/export', json(), async (req, res) => {
    try {
      const { type, filter, format } = req.body;

      if (!['transactions', 'events', 'addresses'].includes(type)) {
        return res.status(400).json({ error: 'Invalid export type' });
      }

      if (!['csv', 'json'].includes(format)) {
        return res.status(400).json({ error: 'Invalid format' });
      }

      // Generate export (in production, this would be async with job queue)
      const exportId = `export_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      res.json({
        exportId,
        status: 'processing',
        message: 'Export started. Check /export/:id for status',
      });

      // Async export processing would happen here
      logger.info('Export requested', { type, filter, format, exportId });
    } catch (error) {
      logger.error('Export error', { error });
      res.status(500).json({ error: 'Export failed' });
    }
  });

  // Admin endpoints (require authentication)
  app.post('/admin/reindex', json(), async (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    if (!validateApiKey(apiKey, 'admin')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const { fromBlock, toBlock } = req.body;
      const blockProcessor = new BlockProcessor(pgPool, timeSeriesDB, graphDB);

      // Start reindexing in background
      blockProcessor.reindex(fromBlock, toBlock).catch(error => {
        logger.error('Reindex error', { error, fromBlock, toBlock });
      });

      res.json({
        status: 'started',
        fromBlock,
        toBlock,
        message: 'Reindexing started in background',
      });
    } catch (error) {
      logger.error('Reindex endpoint error', { error });
      res.status(500).json({ error: 'Reindex failed' });
    }
  });

  app.post('/admin/checkpoint', json(), async (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    if (!validateApiKey(apiKey, 'admin')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const blockProcessor = new BlockProcessor(pgPool, timeSeriesDB, graphDB);
      await blockProcessor.createCheckpoint();

      res.json({
        status: 'success',
        message: 'Checkpoint created',
      });
    } catch (error) {
      logger.error('Checkpoint error', { error });
      res.status(500).json({ error: 'Checkpoint creation failed' });
    }
  });

  app.get('/admin/status', async (req, res) => {
    const apiKey = req.headers['x-api-key'] as string;
    if (!validateApiKey(apiKey, 'admin')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      const blockProcessor = new BlockProcessor(pgPool, timeSeriesDB, graphDB);
      const status = await blockProcessor.getDetailedStatus();

      const stats = {
        blocks: await pgPool.query('SELECT COUNT(*) FROM blocks'),
        transactions: await pgPool.query('SELECT COUNT(*) FROM transactions'),
        events: await pgPool.query('SELECT COUNT(*) FROM events'),
        addresses: await pgPool.query('SELECT COUNT(*) FROM addresses'),
      };

      res.json({
        indexer: status,
        database: {
          blocks: parseInt(stats.blocks.rows[0].count, 10),
          transactions: parseInt(stats.transactions.rows[0].count, 10),
          events: parseInt(stats.events.rows[0].count, 10),
          addresses: parseInt(stats.addresses.rows[0].count, 10),
        },
        cache: {
          lruSize: lruCache.size,
          lruMaxSize: lruCache.max,
        },
        connections: {
          postgres: pgPool.totalCount,
          active: pgPool.idleCount,
        },
      });
    } catch (error) {
      logger.error('Status endpoint error', { error });
      res.status(500).json({ error: 'Failed to get status' });
    }
  });

  // Initialize Apollo Server
  const apolloServer = new ApolloServer({
    schema,
    plugins,
    introspection: ENABLE_PLAYGROUND,
    formatError: (error) => {
      logger.error('GraphQL error', {
        message: error.message,
        code: error.extensions?.code,
        path: error.path,
      });

      return {
        message: error.message,
        code: error.extensions?.code,
        path: error.path,
      };
    },
  });

  await apolloServer.start();

  // GraphQL endpoint
  app.use(
    '/graphql',
    json(),
    expressMiddleware(apolloServer, {
      context: async ({ req }) => {
        activeConnections.inc({ type: 'graphql' });

        return {
          ...createContext(req),
          dataSources: {
            pgPool,
            timeSeriesDB,
            graphDB,
            redisCache,
          },
          loaders: createDataLoaders({}),
          cache: {
            get: (key: string) => getCachedOrFetch(key, async () => null),
            set: (key: string, value: any, ttl?: number) =>
              redisCache.setex(key, ttl || CACHE_TTL, JSON.stringify(value)),
            invalidate: invalidateCache,
          },
          subscriptions: subscriptionManager,
        };
      },
    })
  );

  // WebSocket server for subscriptions
  const wsServer = new WebSocketServer({
    server: httpServer,
    path: '/graphql',
  });

  const serverCleanup = useServer(
    {
      schema,
      context: async (ctx) => {
        activeConnections.inc({ type: 'websocket' });

        return {
          ...createContext(ctx.extra.request),
          dataSources: {
            pgPool,
            timeSeriesDB,
            graphDB,
            redisCache,
          },
          loaders: createDataLoaders({}),
          subscriptions: subscriptionManager,
        };
      },
      onDisconnect: () => {
        activeConnections.dec({ type: 'websocket' });
      },
    },
    wsServer
  );

  // Start HTTP server
  await new Promise<void>((resolve) => httpServer.listen({ port: PORT }, resolve));

  logger.info(`🚀 Server ready at http://localhost:${PORT}/graphql`);
  logger.info(`🔌 Subscriptions ready at ws://localhost:${PORT}/graphql`);
  if (ENABLE_METRICS) {
    logger.info(`📊 Metrics available at http://localhost:${PORT}/metrics`);
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down gracefully...');

    await serverCleanup.dispose();
    await apolloServer.stop();
    httpServer.close();

    await pgPool.end();
    await redisCache.quit();
    await redisPubSub.quit();
    await graphDB.close();

    logger.info('Server shut down complete');
    process.exit(0);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

// Start the server
if (require.main === module) {
  startServer().catch((error) => {
    logger.error('Failed to start server', { error });
    process.exit(1);
  });
}

export { startServer, getCachedOrFetch, invalidateCache };
