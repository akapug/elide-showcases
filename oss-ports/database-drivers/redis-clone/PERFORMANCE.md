# Redis Performance Guide

## Introduction

This guide covers performance optimization for @elide/redis to achieve maximum throughput and minimal latency.

## Connection Management

### Connection Pooling

```typescript
import { RedisConnectionPool } from '@elide/redis';

const pool = new RedisConnectionPool({
  host: 'localhost',
  port: 6379,
  min: 2,
  max: 10,
  idleTimeout: 300000
});

// Execute with pooled connection
await pool.execute(async (client) => {
  await client.set('key', 'value');
  return client.get('key');
});
```

### Connection Options

```typescript
const redis = createClient({
  host: 'localhost',
  port: 6379,
  keepAlive: 30000,      // TCP keep-alive
  noDelay: true,         // Disable Nagle's algorithm
  connectTimeout: 10000,
  commandTimeout: 5000
});
```

## Pipelining

### Basic Pipelining

```typescript
// Sequential (slow)
for (let i = 0; i < 1000; i++) {
  await redis.set(`key:${i}`, `value:${i}`);
}

// Pipelined (fast)
const pipeline = redis.pipeline();
for (let i = 0; i < 1000; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
await pipeline.exec();
```

### Optimal Pipeline Size

```typescript
// Process in batches of 100
async function batchProcess(items: any[], batchSize = 100) {
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const pipeline = redis.pipeline();
    
    batch.forEach(item => {
      pipeline.set(item.key, item.value);
    });
    
    await pipeline.exec();
  }
}
```

## Data Structures

### Choose Right Structure

```typescript
// String: Simple values
await redis.set('user:1000:name', 'Alice');

// Hash: Objects with fields
await redis.hset('user:1000', {
  name: 'Alice',
  email: 'alice@example.com',
  age: '28'
});

// List: Ordered collections
await redis.lpush('queue:tasks', 'task1', 'task2');

// Set: Unique collections
await redis.sadd('tags', 'redis', 'cache', 'database');

// Sorted Set: Ranked collections
await redis.zadd('leaderboard', 1000, 'player1');
```

### Hash vs Multiple Keys

```typescript
// Multiple keys (not recommended)
await redis.set('user:1000:name', 'Alice');
await redis.set('user:1000:email', 'alice@example.com');
await redis.set('user:1000:age', '28');

// Hash (recommended)
await redis.hset('user:1000', {
  name: 'Alice',
  email: 'alice@example.com',
  age: '28'
});
```

## Memory Optimization

### Key Naming

```typescript
// Bad: Long descriptive keys
'application:user:profile:1000:personal:information:name'

// Good: Short keys
'u:1000:name'
```

### Expiration

```typescript
// Set TTL on temporary data
await redis.set('session:xyz', 'data', { EX: 3600 });

// Clean up expired keys
await redis.expire('cache:key', 3600);
```

### Data Compression

```typescript
import { compress, decompress } from 'compression-lib';

// Compress large values
const data = JSON.stringify(largeObject);
const compressed = compress(data);
await redis.set('large:data', compressed);

// Decompress on retrieval
const stored = await redis.get('large:data');
const data = JSON.parse(decompress(stored));
```

## Clustering

### Client-Side Sharding

```typescript
import { RedisCluster } from '@elide/redis';

const cluster = new RedisCluster({
  nodes: [
    { host: 'node1', port: 6379 },
    { host: 'node2', port: 6379 },
    { host: 'node3', port: 6379 }
  ],
  scaleReads: 'all'  // Distribute reads across all nodes
});
```

### Hash Tags

```typescript
// Keys with same hash tag go to same shard
await cluster.set('{user:1000}:profile', data);
await cluster.set('{user:1000}:settings', data);
await cluster.set('{user:1000}:prefs', data);
```

## Benchmarks

### Set Operations

```typescript
const iterations = 10000;

// Sequential SET
console.time('Sequential SET');
for (let i = 0; i < iterations; i++) {
  await redis.set(`key:${i}`, `value:${i}`);
}
console.timeEnd('Sequential SET');

// Pipelined SET
console.time('Pipelined SET');
const pipeline = redis.pipeline();
for (let i = 0; i < iterations; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
await pipeline.exec();
console.timeEnd('Pipelined SET');
```

### Get Operations

```typescript
// Sequential GET
console.time('Sequential GET');
for (let i = 0; i < iterations; i++) {
  await redis.get(`key:${i}`);
}
console.timeEnd('Sequential GET');

// Pipelined GET
console.time('Pipelined GET');
const pipeline2 = redis.pipeline();
for (let i = 0; i < iterations; i++) {
  pipeline2.get(`key:${i}`);
}
await pipeline2.exec();
console.timeEnd('Pipelined GET');
```

## Best Practices

1. **Use pipelining** for batch operations
2. **Choose appropriate data structures**
3. **Set expiration times** on temporary data
4. **Use connection pooling** for concurrent requests
5. **Compress large values**
6. **Use short key names**
7. **Monitor memory usage**
8. **Use hash tags** for multi-key operations in cluster
9. **Disable Nagle's algorithm** (noDelay: true)
10. **Enable TCP keep-alive**

## Production Tips

- Monitor memory with INFO command
- Use SLOWLOG to find slow queries
- Set maxmemory and eviction policy
- Use Redis Cluster for high availability
- Enable persistence (RDB/AOF) as needed
- Monitor connection pool metrics
- Use Lua scripts for atomic operations
- Profile commands with MONITOR (development only)

## Conclusion

Proper Redis optimization can provide 10-100x performance improvements. Always measure with production-like workloads.
