# Database Drivers Troubleshooting Guide

## Overview

This comprehensive guide covers common issues and solutions across all Elide database drivers.

## SQLite (@elide/better-sqlite3)

### Database Locked Errors

**Problem**: Getting "database is locked" errors

**Solutions**:

```typescript
// 1. Increase timeout
const db = new Database('app.db', { timeout: 10000 });

// 2. Enable WAL mode
db.pragma('journal_mode = WAL');

// 3. Ensure transactions are closed
const fn = db.transaction(() => {
  // Operations
});
fn(); // Execute immediately
```

### Memory Issues

**Problem**: High memory usage

**Solutions**:

```typescript
// 1. Use iterators for large results
const stmt = db.prepare('SELECT * FROM large_table');
for (const row of stmt.iterate()) {
  // Process one row at a time
}

// 2. Limit cache size
db.pragma('cache_size = -16000'); // 16MB

// 3. Regular vacuum
db.exec('VACUUM');
```

### Performance Problems

**Problem**: Slow queries

**Solutions**:

```typescript
// 1. Check query plan
const plan = db.prepare('EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?').all('test@example.com');

// 2. Add indexes
db.exec('CREATE INDEX idx_email ON users(email)');

// 3. Use transactions for bulk operations
const insertMany = db.transaction((items) => {
  const stmt = db.prepare('INSERT INTO items (name) VALUES (?)');
  items.forEach(item => stmt.run(item));
});

// 4. Analyze database
db.exec('ANALYZE');
```

### Corruption Issues

**Problem**: Database file corrupted

**Solutions**:

```typescript
// 1. Check integrity
const result = db.pragma('integrity_check');

// 2. Use backup
const backup = db.backup('backup.db');
backup.executeSync();

// 3. Enable synchronous mode
db.pragma('synchronous = FULL');
```

## Redis (@elide/redis)

### Connection Refused

**Problem**: Cannot connect to Redis

**Solutions**:

```typescript
// 1. Check connection settings
const redis = createClient({
  host: 'localhost',
  port: 6379,
  connectTimeout: 10000
});

// 2. Verify Redis is running
// redis-cli ping

// 3. Check firewall settings
// telnet localhost 6379

// 4. Use connection pool
const pool = new RedisConnectionPool({
  max: 10,
  min: 2
});
```

### Memory Limit Exceeded

**Problem**: Redis running out of memory

**Solutions**:

```typescript
// 1. Set expiration on keys
await redis.set('key', 'value', { EX: 3600 });

// 2. Configure maxmemory and eviction
// redis.conf:
// maxmemory 256mb
// maxmemory-policy allkeys-lru

// 3. Monitor memory
const info = await redis.info('memory');

// 4. Use smaller values
// Compress large data before storing
```

### Slow Commands

**Problem**: Commands taking too long

**Solutions**:

```typescript
// 1. Use pipelining
const pipeline = redis.pipeline();
for (let i = 0; i < 1000; i++) {
  pipeline.set(`key:${i}`, `value:${i}`);
}
await pipeline.exec();

// 2. Check slow log
const slowlog = await redis.sendCommand(['SLOWLOG', 'GET', '10']);

// 3. Optimize data structures
// Use hashes instead of many string keys
await redis.hset('user:1000', { name: 'Alice', age: '28' });

// 4. Enable Redis cluster for scalability
```

### Pub/Sub Issues

**Problem**: Messages not being received

**Solutions**:

```typescript
// 1. Verify subscription
const pubsub = redis.createPubSub();
await pubsub.subscribe('channel');

pubsub.on('channel', (channel, message) => {
  console.log('Received:', message);
});

// 2. Check pattern matching
await pubsub.psubscribe('event:*');

// 3. Separate connections for pub/sub
// Use dedicated client for pub/sub operations

// 4. Handle reconnection
redis.on('error', (error) => {
  console.error('Redis error:', error);
});
```

## MongoDB (@elide/mongodb)

### Connection Timeout

**Problem**: Cannot connect to MongoDB

**Solutions**:

```typescript
// 1. Increase timeout
const client = new MongoClient(url, {
  connectTimeoutMS: 30000,
  serverSelectionTimeoutMS: 30000
});

// 2. Check connection string
// mongodb://username:password@localhost:27017/database

// 3. Verify MongoDB is running
// mongosh --eval "db.adminCommand('ping')"

// 4. Check network/firewall
// telnet localhost 27017
```

### Write Concern Errors

**Problem**: Write operations failing

**Solutions**:

```typescript
// 1. Check write concern
await collection.insertOne(doc, {
  writeConcern: { w: 'majority', wtimeout: 5000 }
});

// 2. Handle duplicate key errors
try {
  await collection.insertOne({ _id: 1, data: 'value' });
} catch (error) {
  if (error.code === 11000) {
    // Duplicate key error
  }
}

// 3. Use transactions for multi-document operations
const session = client.startSession();
await session.withTransaction(async () => {
  await collection1.insertOne(doc1, { session });
  await collection2.updateOne(filter, update, { session });
});
```

### Slow Queries

**Problem**: Queries taking too long

**Solutions**:

```typescript
// 1. Add indexes
await collection.createIndex({ email: 1 });
await collection.createIndex({ status: 1, created: -1 });

// 2. Use projection
const users = await collection.find({})
  .project({ name: 1, email: 1, _id: 0 })
  .toArray();

// 3. Enable profiling
await db.command({ profile: 2, slowms: 100 });

// 4. Use aggregation explain
const explain = await collection.aggregate(pipeline)
  .explain('executionStats');

// 5. Limit results
const users = await collection.find({})
  .limit(100)
  .toArray();
```

### Replica Set Issues

**Problem**: Cannot connect to replica set

**Solutions**:

```typescript
// 1. Specify replica set name
const client = new MongoClient('mongodb://localhost:27017', {
  replicaSet: 'myReplicaSet'
});

// 2. Use multiple hosts
const client = new MongoClient(
  'mongodb://host1:27017,host2:27017,host3:27017'
);

// 3. Check replica set status
// rs.status()

// 4. Handle primary election
client.on('topologyDescriptionChanged', (event) => {
  console.log('Topology changed:', event);
});
```

## PostgreSQL (@elide/pg)

### Connection Pool Exhausted

**Problem**: No connections available

**Solutions**:

```typescript
// 1. Increase pool size
const pool = new Pool({
  max: 20,
  min: 2
});

// 2. Release connections
const client = await pool.connect();
try {
  await client.query('SELECT 1');
} finally {
  client.release();
}

// 3. Set timeouts
const pool = new Pool({
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});

// 4. Monitor pool
console.log('Total:', pool.totalCount);
console.log('Idle:', pool.idleCount);
console.log('Waiting:', pool.waitingCount);
```

### Deadlock Errors

**Problem**: Transactions causing deadlocks

**Solutions**:

```typescript
// 1. Use consistent lock ordering
await client.query('SELECT * FROM accounts WHERE id IN ($1, $2) ORDER BY id FOR UPDATE', [id1, id2]);

// 2. Keep transactions short
await client.transaction(async (client) => {
  // Quick operations only
});

// 3. Use appropriate isolation level
await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED');

// 4. Retry on deadlock
async function withRetry(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === '40P01' && i < maxRetries - 1) {
        // Deadlock detected, retry
        continue;
      }
      throw error;
    }
  }
}
```

### Slow Queries

**Problem**: Queries taking too long

**Solutions**:

```typescript
// 1. Use EXPLAIN ANALYZE
const plan = await client.query(
  'EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1',
  ['test@example.com']
);

// 2. Add indexes
await client.query('CREATE INDEX idx_email ON users(email)');
await client.query('CREATE INDEX idx_created ON posts(created_at DESC)');

// 3. Update statistics
await client.query('ANALYZE users');

// 4. Use prepared statements
const stmt = await client.prepare('get_user', 'SELECT * FROM users WHERE id = $1');

// 5. Set statement timeout
await client.query('SET statement_timeout = 5000'); // 5 seconds
```

### Connection Leaks

**Problem**: Connections not being released

**Solutions**:

```typescript
// 1. Always use try/finally
const client = await pool.connect();
try {
  await client.query('SELECT 1');
} finally {
  client.release();
}

// 2. Use pool.query for simple queries
await pool.query('SELECT 1'); // Automatic release

// 3. Monitor connections
const result = await client.query(
  'SELECT count(*) FROM pg_stat_activity WHERE datname = $1',
  [database]
);
```

## MySQL (@elide/mysql2)

### Connection Timeout

**Problem**: Connections timing out

**Solutions**:

```typescript
// 1. Increase timeout
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  connectTimeout: 10000
});

// 2. Enable keep-alive
const connection = mysql.createConnection({
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000
});

// 3. Use connection pool
const pool = mysql.createPool({
  connectionLimit: 10,
  waitForConnections: true
});

// 4. Handle disconnection
connection.on('error', (error) => {
  if (error.code === 'PROTOCOL_CONNECTION_LOST') {
    // Reconnect
  }
});
```

### Deadlock Errors

**Problem**: Transactions causing deadlocks

**Solutions**:

```typescript
// 1. Retry on deadlock
async function withRetry(fn: Function, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.code === 'ER_LOCK_DEADLOCK' && i < maxRetries - 1) {
        continue;
      }
      throw error;
    }
  }
}

// 2. Use consistent lock ordering
await connection.query(
  'SELECT * FROM accounts WHERE id IN (?, ?) ORDER BY id FOR UPDATE',
  [id1, id2]
);

// 3. Keep transactions short
await connection.beginTransaction();
try {
  // Quick operations
  await connection.commit();
} catch (error) {
  await connection.rollback();
}
```

### Slow Queries

**Problem**: Queries taking too long

**Solutions**:

```typescript
// 1. Use EXPLAIN
const [rows] = await connection.query('EXPLAIN SELECT * FROM users WHERE email = ?', ['test@example.com']);

// 2. Add indexes
await connection.query('CREATE INDEX idx_email ON users(email)');

// 3. Use prepared statements
const stmt = await connection.prepare('SELECT * FROM users WHERE id = ?');

// 4. Optimize queries
// - Avoid SELECT *
// - Use LIMIT
// - Add WHERE clauses
// - Use appropriate joins

// 5. Enable slow query log
// my.cnf:
// slow_query_log = 1
// slow_query_log_file = /var/log/mysql/slow.log
// long_query_time = 2
```

## General Best Practices

1. **Always close connections** when done
2. **Use connection pooling** for production
3. **Set appropriate timeouts**
4. **Handle errors properly**
5. **Monitor resource usage**
6. **Use transactions** for related operations
7. **Add indexes** for frequently queried columns
8. **Profile slow queries**
9. **Use parameterized queries** for security
10. **Test with production-like data**

## Getting Help

- Check driver documentation
- Review error messages carefully
- Enable verbose logging for debugging
- Monitor database metrics
- Test with minimal reproduction case
- Check database server logs
- Verify network connectivity
- Review database configuration

## Conclusion

Most database issues can be resolved by:
1. Checking connection settings
2. Adding appropriate indexes
3. Using transactions correctly
4. Monitoring resource usage
5. Following best practices

Always test thoroughly with production-like workloads and data volumes.
