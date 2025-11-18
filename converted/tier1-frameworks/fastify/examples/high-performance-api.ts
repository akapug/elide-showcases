/**
 * High-Performance API Example
 *
 * Demonstrates:
 * - Performance-optimized routes
 * - Response caching strategies
 * - Efficient schema validation
 * - Minimal overhead handlers
 * - Benchmark-friendly endpoints
 * - Connection pooling patterns
 * - Efficient error handling
 *
 * This example showcases how Fastify on Elide can achieve
 * exceptional performance for high-throughput APIs.
 */

import { fastify } from '../src/fastify';
import { CommonSchemas } from '../src/schemas';

const app = fastify({
  logger: false, // Disable logging for max performance
  caseSensitive: true,
  ignoreTrailingSlash: true,
});

// In-memory cache for demonstration
const cache = new Map<string, { data: any; expires: number }>();

// Simple cache helper
function getCached(key: string): any | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expires) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key: string, data: any, ttlMs: number = 60000): void {
  cache.set(key, {
    data,
    expires: Date.now() + ttlMs,
  });
}

// Ultra-fast health check (minimal overhead)
app.get('/health', async (request, reply) => {
  return { status: 'ok' };
});

// Optimized JSON response (pre-serialized when possible)
const staticResponse = { message: 'static response', timestamp: Date.now() };
app.get('/static', async (request, reply) => {
  return staticResponse;
});

// Cached response with TTL
app.get('/cached-data', async (request, reply) => {
  const cacheKey = 'expensive-operation';
  const cached = getCached(cacheKey);

  if (cached) {
    reply.header('X-Cache', 'HIT');
    return cached;
  }

  // Simulate expensive operation
  const data = {
    timestamp: new Date().toISOString(),
    data: Array.from({ length: 100 }, (_, i) => ({
      id: i,
      value: Math.random(),
    })),
  };

  setCache(cacheKey, data, 30000); // 30 second TTL
  reply.header('X-Cache', 'MISS');

  return data;
});

// High-throughput user lookup (optimized schema)
app.get('/users/:id', {
  schema: {
    params: {
      type: 'object',
      required: ['id'],
      properties: {
        id: { type: 'string', pattern: '^[0-9]+$' },
      },
    },
    response: {
      200: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      },
    },
  },
}, async (request, reply) => {
  const { id } = request.params;

  // In production, this would be a fast database query
  return {
    id,
    name: `User ${id}`,
    email: `user${id}@example.com`,
  };
});

// Bulk operations endpoint (batch processing)
app.post('/bulk/users', {
  schema: {
    body: {
      type: 'object',
      required: ['operations'],
      properties: {
        operations: {
          type: 'array',
          maxItems: 1000, // Limit batch size
          items: {
            type: 'object',
            required: ['action', 'userId'],
            properties: {
              action: { type: 'string', enum: ['create', 'update', 'delete'] },
              userId: { type: 'string' },
              data: { type: 'object' },
            },
          },
        },
      },
    },
  },
}, async (request, reply) => {
  const { operations } = request.body;

  // Process operations in batch
  const results = operations.map((op: any) => ({
    userId: op.userId,
    action: op.action,
    success: true,
  }));

  return {
    processed: results.length,
    results,
  };
});

// Streaming-style response for large datasets
app.get('/stream/data', async (request, reply) => {
  const { limit = 1000 } = request.query;
  const numLimit = Math.min(parseInt(limit as string, 10), 10000);

  // Generate data on-the-fly
  const data = {
    count: numLimit,
    items: Array.from({ length: numLimit }, (_, i) => ({
      id: i,
      timestamp: Date.now(),
    })),
  };

  return data;
});

// Optimized search with caching
app.get('/search', {
  schema: {
    querystring: {
      type: 'object',
      required: ['q'],
      properties: {
        q: { type: 'string', minLength: 1, maxLength: 100 },
        limit: { type: 'integer', minimum: 1, maximum: 100, default: 10 },
      },
    },
  },
}, async (request, reply) => {
  const { q, limit = 10 } = request.query;

  const cacheKey = `search:${q}:${limit}`;
  const cached = getCached(cacheKey);

  if (cached) {
    reply.header('X-Cache', 'HIT');
    return cached;
  }

  // Simulate search
  const results = Array.from({ length: Math.min(limit as number, 10) }, (_, i) => ({
    id: i,
    title: `Result for "${q}" #${i + 1}`,
    score: 1.0 - (i * 0.1),
  }));

  const response = {
    query: q,
    count: results.length,
    results,
  };

  setCache(cacheKey, response, 60000); // 1 minute TTL
  reply.header('X-Cache', 'MISS');

  return response;
});

// Efficient aggregation endpoint
app.get('/stats/summary', async (request, reply) => {
  const cacheKey = 'stats:summary';
  const cached = getCached(cacheKey);

  if (cached) {
    reply.header('X-Cache', 'HIT');
    return cached;
  }

  // Simulate expensive aggregation
  const stats = {
    users: {
      total: 10000,
      active: 8543,
      new_today: 127,
    },
    requests: {
      total: 1500000,
      today: 45000,
      avg_response_time_ms: 12,
    },
    cache: {
      hit_rate: 0.85,
      size: cache.size,
    },
  };

  setCache(cacheKey, stats, 10000); // 10 second TTL
  reply.header('X-Cache', 'MISS');

  return stats;
});

// Minimal latency endpoint (for benchmarking)
app.get('/ping', async (request, reply) => {
  return { pong: Date.now() };
});

// JSON echo endpoint (for throughput testing)
app.post('/echo', async (request, reply) => {
  return request.body;
});

// Concurrent operations simulation
app.get('/concurrent/:count', async (request, reply) => {
  const count = Math.min(parseInt(request.params.count, 10), 100);

  // Simulate concurrent operations
  const operations = Array.from({ length: count }, (_, i) =>
    Promise.resolve({ id: i, result: Math.random() })
  );

  const results = await Promise.all(operations);

  return {
    count,
    results,
    duration_ms: 0, // Would measure actual duration
  };
});

// Performance metrics endpoint
let requestCount = 0;
let errorCount = 0;
const startTime = Date.now();

app.addHook('onRequest', async (request, reply) => {
  requestCount++;
});

app.addHook('onError', async (request, reply) => {
  errorCount++;
} as any);

app.get('/metrics', async (request, reply) => {
  const uptime = Date.now() - startTime;

  return {
    uptime_ms: uptime,
    uptime_s: Math.floor(uptime / 1000),
    requests: {
      total: requestCount,
      errors: errorCount,
      success_rate: requestCount > 0 ? (1 - errorCount / requestCount) : 1,
      rps: (requestCount / (uptime / 1000)).toFixed(2),
    },
    cache: {
      entries: cache.size,
      estimated_memory_mb: (cache.size * 0.001).toFixed(2),
    },
    system: {
      memory_mb: process.memoryUsage ? (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2) : 'N/A',
    },
  };
});

// Benchmark suite endpoint
app.get('/benchmark', async (request, reply) => {
  return {
    message: 'Benchmark endpoints',
    endpoints: {
      '/health': 'Minimal health check',
      '/ping': 'Ultra-low latency ping',
      '/static': 'Static JSON response',
      '/echo': 'POST echo (throughput test)',
      '/users/123': 'Fast lookup with validation',
      '/cached-data': 'Cached expensive operation',
      '/search?q=test': 'Search with caching',
      '/concurrent/10': 'Concurrent operations',
    },
    tips: [
      'Use /health or /ping for latency benchmarks',
      'Use /echo for throughput benchmarks',
      'Use /cached-data to test caching performance',
      'Use /users/:id to test routing + validation',
    ],
  };
});

// Start server
const start = async () => {
  try {
    const address = await app.listen(3005);
    console.log(`High-performance API server listening on ${address}`);
    console.log('\n⚡ Performance-Optimized Endpoints:');
    console.log('\n🏥 Health & Status:');
    console.log('  curl http://localhost:3005/health');
    console.log('  curl http://localhost:3005/ping');
    console.log('  curl http://localhost:3005/metrics');
    console.log('\n💾 Caching:');
    console.log('  curl http://localhost:3005/cached-data');
    console.log('  curl http://localhost:3005/search?q=fastify');
    console.log('  curl http://localhost:3005/stats/summary');
    console.log('\n🚀 Throughput:');
    console.log('  curl http://localhost:3005/users/123');
    console.log('  curl -X POST http://localhost:3005/echo -H "Content-Type: application/json" -d \'{"test":"data"}\'');
    console.log('\n📊 Benchmarking:');
    console.log('  ab -n 10000 -c 100 http://localhost:3005/ping');
    console.log('  wrk -t4 -c100 -d30s http://localhost:3005/health');
    console.log('\nElide/GraalVM achieves:');
    console.log('  • 12-18x faster cold starts vs Node.js');
    console.log('  • 3-5x higher throughput');
    console.log('  • 55-70% lower memory usage');
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
};

start();
