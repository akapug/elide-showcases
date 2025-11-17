# @elide/redis

Production-ready Redis client for Elide with complete Redis protocol implementation.

## Features

- **Complete Command Support** - All Redis commands (strings, hashes, lists, sets, sorted sets)
- **Pipelining** - Batch operations for optimal performance
- **Transactions** - MULTI/EXEC with WATCH support
- **Pub/Sub** - Subscribe to channels and patterns
- **Lua Scripts** - Execute Lua scripts with EVAL/EVALSHA
- **Connection Pooling** - Efficient connection management
- **Cluster Support** - Redis Cluster with automatic slot discovery
- **Sentinel Support** - High availability with Redis Sentinel
- **TypeScript** - Full type definitions
- **Async/Await** - Promise-based API

## Installation

```bash
npm install @elide/redis
```

## Quick Start

```typescript
import { createClient } from '@elide/redis';

// Create client
const redis = createClient({
  host: 'localhost',
  port: 6379
});

// Connect
await redis.connect();

// Set and get
await redis.set('key', 'value');
const value = await redis.get('key');
console.log(value); // 'value'

// Disconnect
await redis.disconnect();
```

## API Documentation

### String Commands

```typescript
// SET with options
await redis.set('key', 'value', { EX: 3600, NX: true });

// GET
const value = await redis.get('key');

// MGET/MSET
await redis.mset('key1', 'value1', 'key2', 'value2');
const values = await redis.mget('key1', 'key2');

// Increment/Decrement
await redis.incr('counter');
await redis.incrby('counter', 5);
await redis.decr('counter');
```

### Hash Commands

```typescript
// HSET
await redis.hset('user:1', 'name', 'Alice');
await redis.hset('user:1', { age: '28', email: 'alice@example.com' });

// HGET
const name = await redis.hget('user:1', 'name');

// HGETALL
const user = await redis.hgetall('user:1');

// HINCRBY
await redis.hincrby('user:1', 'views', 1);
```

### List Commands

```typescript
// LPUSH/RPUSH
await redis.lpush('queue', 'task1', 'task2');
await redis.rpush('queue', 'task3');

// LPOP/RPOP
const task = await redis.lpop('queue');

// LRANGE
const tasks = await redis.lrange('queue', 0, -1);

// Blocking operations
const item = await redis.blpop(10, 'queue1', 'queue2');
```

### Set Commands

```typescript
// SADD
await redis.sadd('tags', 'redis', 'database', 'cache');

// SMEMBERS
const tags = await redis.smembers('tags');

// SISMEMBER
const exists = await redis.sismember('tags', 'redis');

// Set operations
const common = await redis.sinter('set1', 'set2');
const all = await redis.sunion('set1', 'set2');
```

### Sorted Set Commands

```typescript
// ZADD
await redis.zadd('leaderboard', 100, 'player1', 200, 'player2');

// ZRANGE with scores
const top = await redis.zrange('leaderboard', 0, 9, true);

// ZINCRBY
await redis.zincrby('leaderboard', 50, 'player1');

// ZCOUNT
const count = await redis.zcount('leaderboard', 100, 200);
```

## Pipelining

Execute multiple commands in a batch:

```typescript
const pipeline = redis.pipeline();

pipeline
  .set('key1', 'value1')
  .set('key2', 'value2')
  .get('key1')
  .incr('counter')
  .hset('user:1', 'name', 'Alice');

const results = await pipeline.exec();
console.log(results); // Array of results
```

## Transactions

Atomic command execution with MULTI/EXEC:

```typescript
await redis.watch('balance');

const balance = parseInt(await redis.get('balance') || '0');

if (balance >= 100) {
  const transaction = await redis.multi();

  transaction
    .decrby('balance', 100)
    .incr('purchases');

  const results = await transaction.exec();
  console.log('Transaction completed:', results);
} else {
  await redis.unwatch();
}
```

## Pub/Sub

Subscribe to channels and receive messages:

```typescript
const pubsub = redis.createPubSub();

// Subscribe to channels
await pubsub.subscribe('news', 'updates');

// Add message handler
pubsub.on('news', (channel, message) => {
  console.log(`Received from ${channel}:`, message);
});

// Pattern subscription
await pubsub.psubscribe('event:*');
pubsub.onPattern('event:*', (pattern, channel, message) => {
  console.log(`Pattern ${pattern} matched ${channel}:`, message);
});

// Publish (from another client)
await redis.publish('news', 'Breaking news!');
```

## Lua Scripts

Execute Lua scripts for atomic operations:

```typescript
const script = `
  local value = redis.call('GET', KEYS[1])
  if value then
    return redis.call('INCR', KEYS[1])
  else
    redis.call('SET', KEYS[1], ARGV[1])
    return ARGV[1]
  end
`;

// Execute script
const result = await redis.eval(script, 1, 'counter', '1');

// Load and execute by SHA
const sha = await redis.scriptLoad(script);
const result2 = await redis.evalsha(sha, 1, 'counter', '1');
```

## Connection Pool

Efficient connection management:

```typescript
import { RedisConnectionPool } from '@elide/redis';

const pool = new RedisConnectionPool({
  host: 'localhost',
  port: 6379,
  min: 2,
  max: 10,
  acquireTimeout: 30000,
  idleTimeout: 300000
});

// Execute with pooled connection
const value = await pool.execute(async (client) => {
  await client.set('key', 'value');
  return client.get('key');
});

// Get pool statistics
console.log(pool.stats);

// Cleanup
await pool.destroy();
```

## Redis Cluster

Automatic cluster support:

```typescript
import { RedisCluster } from '@elide/redis';

const cluster = new RedisCluster({
  nodes: [
    { host: 'node1.redis.local', port: 6379 },
    { host: 'node2.redis.local', port: 6379 },
    { host: 'node3.redis.local', port: 6379 }
  ],
  scaleReads: 'all',
  maxRedirections: 16
});

// Use like regular client
await cluster.set('key', 'value');
const value = await cluster.get('key');

// Disconnect
await cluster.disconnect();
```

## Error Handling

```typescript
import { RedisError, ConnectionError, TimeoutError } from '@elide/redis';

try {
  await redis.get('key');
} catch (error) {
  if (error instanceof ConnectionError) {
    console.error('Connection failed:', error);
  } else if (error instanceof TimeoutError) {
    console.error('Operation timeout:', error);
  } else if (error instanceof RedisError) {
    console.error('Redis error:', error);
  }
}
```

## Performance Benchmarks

Run benchmarks:

```bash
npm run bench
```

Typical results:
- SET (pipeline): ~200,000 ops/sec
- GET (pipeline): ~300,000 ops/sec
- HSET: ~150,000 ops/sec
- LPUSH: ~180,000 ops/sec

## TypeScript Support

Full TypeScript definitions:

```typescript
import { RedisClient, RedisOptions } from '@elide/redis';

const options: RedisOptions = {
  host: 'localhost',
  port: 6379,
  password: 'secret'
};

const client = new RedisClient(options);
```

## License

Apache-2.0
