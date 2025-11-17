# Complete Redis Client Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Basic Operations](#basic-operations)
3. [Data Structures](#data-structures)
4. [Advanced Features](#advanced-features)
5. [Performance](#performance)
6. [Best Practices](#best-practices)

## Introduction

@elide/redis provides a complete Redis client implementation with support for all Redis commands, pipelining, transactions, pub/sub, and clustering.

## Basic Operations

### String Operations

```typescript
// SET and GET
await redis.set('key', 'value');
const value = await redis.get('key');

// SET with expiration
await redis.set('session:123', 'data', { EX: 3600 });

// Multiple keys
await redis.mset('key1', 'value1', 'key2', 'value2');
const values = await redis.mget('key1', 'key2');

// Counters
await redis.incr('visits');
await redis.incrby('score', 10);
await redis.decr('lives');
```

## Data Structures

### Hashes

```typescript
// Set fields
await redis.hset('user:1000', 'name', 'Alice');
await redis.hset('user:1000', {
  age: '28',
  email: 'alice@example.com',
  city: 'Boston'
});

// Get fields
const name = await redis.hget('user:1000', 'name');
const user = await redis.hgetall('user:1000');

// Increment
await redis.hincrby('user:1000', 'views', 1);

// Multiple fields
await redis.hmset('user:1001', { name: 'Bob', age: '35' });
const fields = await redis.hmget('user:1001', 'name', 'age');
```

### Lists

```typescript
// Push elements
await redis.lpush('queue', 'task1', 'task2');
await redis.rpush('queue', 'task3');

// Pop elements
const task = await redis.lpop('queue');
const last = await redis.rpop('queue');

// Range
const items = await redis.lrange('queue', 0, -1);

// Blocking operations
const item = await redis.blpop(10, 'queue1', 'queue2');
```

### Sets

```typescript
// Add members
await redis.sadd('tags', 'redis', 'database', 'cache');

// Get members
const tags = await redis.smembers('tags');

// Check membership
const exists = await redis.sismember('tags', 'redis');

// Set operations
const common = await redis.sinter('set1', 'set2');
const all = await redis.sunion('set1', 'set2');
const diff = await redis.sdiff('set1', 'set2');
```

### Sorted Sets

```typescript
// Add members with scores
await redis.zadd('leaderboard', 100, 'player1', 200, 'player2');

// Get members by rank
const top10 = await redis.zrange('leaderboard', 0, 9);
const topWithScores = await redis.zrange('leaderboard', 0, 9, true);

// Get members by score
const highScorers = await redis.zrangebyscore('leaderboard', 100, 200);

// Increment score
await redis.zincrby('leaderboard', 50, 'player1');

// Get rank
const rank = await redis.zrank('leaderboard', 'player1');
```

## Advanced Features

### Pipelining

```typescript
const pipeline = redis.pipeline();

pipeline
  .set('key1', 'value1')
  .set('key2', 'value2')
  .get('key1')
  .incr('counter')
  .hset('hash', 'field', 'value');

const results = await pipeline.exec();
```

### Transactions

```typescript
await redis.watch('balance');

const balance = parseInt(await redis.get('balance') || '0');

if (balance >= 100) {
  const transaction = await redis.multi();
  
  transaction
    .decrby('balance', 100)
    .incr('purchases');
  
  const results = await transaction.exec();
}
```

### Pub/Sub

```typescript
const pubsub = redis.createPubSub();

// Subscribe to channels
await pubsub.subscribe('news', 'updates');

// Add handlers
pubsub.on('news', (channel, message) => {
  console.log(`News: ${message}`);
});

// Pattern subscription
await pubsub.psubscribe('event:*');
pubsub.onPattern('event:*', (pattern, channel, message) => {
  console.log(`Event on ${channel}: ${message}`);
});

// Publish (from another client)
await redis.publish('news', 'Breaking news!');
```

### Lua Scripts

```typescript
const script = `
  local current = redis.call('GET', KEYS[1])
  if current then
    return redis.call('INCR', KEYS[1])
  else
    redis.call('SET', KEYS[1], ARGV[1])
    return ARGV[1]
  end
`;

const result = await redis.eval(script, 1, 'counter', '1');

// Load and reuse
const sha = await redis.scriptLoad(script);
const result2 = await redis.evalsha(sha, 1, 'counter', '1');
```

## Performance

### Connection Pooling

```typescript
import { RedisConnectionPool } from '@elide/redis';

const pool = new RedisConnectionPool({
  host: 'localhost',
  port: 6379,
  min: 2,
  max: 10
});

const value = await pool.execute(async (client) => {
  await client.set('key', 'value');
  return client.get('key');
});
```

### Clustering

```typescript
import { RedisCluster } from '@elide/redis';

const cluster = new RedisCluster({
  nodes: [
    { host: 'node1', port: 6379 },
    { host: 'node2', port: 6379 },
    { host: 'node3', port: 6379 }
  ],
  scaleReads: 'all'
});

await cluster.set('key', 'value');
const value = await cluster.get('key');
```

## Best Practices

### 1. Use Pipelining for Batch Operations

```typescript
// Bad - multiple round trips
for (let i = 0; i < 100; i++) {
  await redis.set(`key:${i}`, `value:${i}`);
}

// Good - single round trip
const pipeline = redis.pipeline();
for (let i = 0; i < 100; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
await pipeline.exec();
```

### 2. Set Expiration Times

```typescript
// Set with expiration
await redis.set('session:123', 'data', { EX: 3600 });

// Or set expiration separately
await redis.expire('session:123', 3600);
```

### 3. Use Appropriate Data Structures

```typescript
// Use hashes for objects
await redis.hset('user:1000', {
  name: 'Alice',
  email: 'alice@example.com',
  age: '28'
});

// Use sets for unique collections
await redis.sadd('online_users', 'alice', 'bob');

// Use sorted sets for rankings
await redis.zadd('high_scores', 1000, 'alice', 950, 'bob');
```

### 4. Handle Errors

```typescript
try {
  await redis.get('key');
} catch (error) {
  if (error instanceof types.ConnectionError) {
    // Handle connection error
  } else if (error instanceof types.TimeoutError) {
    // Handle timeout
  }
}
```

### 5. Use Connection Pooling

```typescript
const pool = new RedisConnectionPool({ max: 10 });

await pool.execute(async (client) => {
  await client.set('key', 'value');
  const value = await client.get('key');
  return value;
});
```
