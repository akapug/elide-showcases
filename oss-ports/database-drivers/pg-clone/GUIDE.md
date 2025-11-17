# Complete PostgreSQL Driver Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Connection Management](#connection-management)
3. [Query Execution](#query-execution)
4. [Transactions](#transactions)
5. [Prepared Statements](#prepared-statements)
6. [Advanced Features](#advanced-features)
7. [Performance Optimization](#performance-optimization)
8. [Best Practices](#best-practices)

## Introduction

@elide/pg provides a production-ready PostgreSQL driver with support for connection pooling, prepared statements, transactions, LISTEN/NOTIFY, and the COPY protocol.

## Connection Management

### Single Connection

```typescript
import { Client } from '@elide/pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'postgres',
  password: 'secret'
});

await client.connect();

// Use client...

await client.end();
```

### Connection String

```typescript
const client = new Client('postgresql://user:password@localhost:5432/mydb');
await client.connect();
```

### Connection Pooling

```typescript
import { Pool } from '@elide/pg';

const pool = new Pool({
  host: 'localhost',
  database: 'mydb',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000
});

// Execute query with pool
const result = await pool.query('SELECT * FROM users');

// Get connection from pool
const client = await pool.connect();
try {
  await client.query('SELECT 1');
} finally {
  client.release();
}

await pool.end();
```

## Query Execution

### Simple Queries

```typescript
// Query without parameters
const result = await client.query('SELECT * FROM users');
console.log(result.rows);

// Query with parameters
const user = await client.query(
  'SELECT * FROM users WHERE email = $1',
  ['alice@example.com']
);

// Multiple parameters
await client.query(
  'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)',
  ['Alice', 'alice@example.com', 28]
);
```

### Query Configuration

```typescript
const result = await client.query({
  text: 'SELECT * FROM users WHERE age > $1',
  values: [18],
  name: 'get-adults',  // Named query for caching
  rowMode: 'array'     // Return rows as arrays
});
```

### Result Format

```typescript
const result = await client.query('SELECT * FROM users');

console.log(result.rows);        // Array of row objects
console.log(result.fields);      // Field definitions
console.log(result.rowCount);    // Number of rows
console.log(result.command);     // SQL command (SELECT, INSERT, etc.)
```

## Transactions

### Basic Transactions

```typescript
await client.begin();
try {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
  await client.query('INSERT INTO posts (title) VALUES ($1)', ['Hello']);
  await client.commit();
} catch (error) {
  await client.rollback();
  throw error;
}
```

### Transaction Helper

```typescript
await client.transaction(async (client) => {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
  await client.query('INSERT INTO posts (title) VALUES ($1)', ['Hello']);
  // Automatically commits or rollbacks
});
```

### Savepoints

```typescript
await client.begin();

await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
await client.savepoint('sp1');

await client.query('INSERT INTO posts (title) VALUES ($1)', ['Hello']);
await client.rollbackTo('sp1');  // Rollback to savepoint

await client.commit();
```

### Transaction Isolation

```typescript
await client.query('BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE');
await client.query('BEGIN TRANSACTION ISOLATION LEVEL READ COMMITTED');
await client.query('BEGIN TRANSACTION ISOLATION LEVEL REPEATABLE READ');
```

## Prepared Statements

### Creating Prepared Statements

```typescript
const stmt = await client.prepare('get_user', 'SELECT * FROM users WHERE id = $1');

const user1 = await client.execute('get_user', [1]);
const user2 = await client.execute('get_user', [2]);
```

### Benefits

- **Performance** - Query is parsed once, executed many times
- **Security** - Automatic parameter escaping
- **Type Safety** - Server validates parameter types

### Example

```typescript
// Create prepared statement
const insertUser = await client.prepare(
  'insert_user',
  'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id'
);

// Execute multiple times
for (const user of users) {
  const result = await client.execute('insert_user', [user.name, user.email]);
  console.log('Inserted user ID:', result.rows[0].id);
}
```

## Advanced Features

### LISTEN/NOTIFY

```typescript
// Listener
await client.listen('events', (notification) => {
  console.log('Channel:', notification.channel);
  console.log('Payload:', notification.payload);
  console.log('Process ID:', notification.processId);
});

// Notifier (from another client)
await otherClient.notify('events', JSON.stringify({ type: 'user_created', id: 123 }));

// Unlisten
await client.unlisten('events');
```

### COPY Protocol

```typescript
// Copy from file to table
const copyStream = await client.copyFrom('COPY users FROM STDIN');
copyStream.write('1\tAlice\talice@example.com\n');
copyStream.write('2\tBob\tbob@example.com\n');
copyStream.end();

// Copy from table to file
const copyToStream = await client.copyTo('COPY users TO STDOUT');
copyToStream.on('data', (chunk) => {
  console.log(chunk.toString());
});
```

### Cursors

```typescript
await client.begin();

await client.query('DECLARE cursor1 CURSOR FOR SELECT * FROM large_table');

const batch1 = await client.query('FETCH 100 FROM cursor1');
const batch2 = await client.query('FETCH 100 FROM cursor1');

await client.query('CLOSE cursor1');
await client.commit();
```

### Advisory Locks

```typescript
// Get lock
await client.query('SELECT pg_advisory_lock($1)', [12345]);

// Try lock (non-blocking)
const locked = await client.query('SELECT pg_try_advisory_lock($1)', [12345]);

// Release lock
await client.query('SELECT pg_advisory_unlock($1)', [12345]);
```

## Performance Optimization

### Connection Pooling

```typescript
// Use pool for concurrent requests
const pool = new Pool({ max: 20 });

const queries = Array.from({ length: 100 }, (_, i) =>
  pool.query('SELECT $1::int as id', [i])
);

const results = await Promise.all(queries);
```

### Batch Inserts

```typescript
// Generate values
const values = users.map((user, i) =>
  `($${i * 2 + 1}, $${i * 2 + 2})`
).join(',');

const params = users.flatMap(user => [user.name, user.email]);

await client.query(
  `INSERT INTO users (name, email) VALUES ${values}`,
  params
);
```

### Indexes

```typescript
// Create indexes
await client.query('CREATE INDEX idx_users_email ON users(email)');
await client.query('CREATE INDEX idx_posts_user_created ON posts(user_id, created_at)');

// Analyze index usage
const explain = await client.query(
  'EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1',
  ['alice@example.com']
);
console.log(explain.rows);
```

### Prepared Statements

```typescript
// Prepare once, execute many times
const stmt = await client.prepare('get_user', 'SELECT * FROM users WHERE id = $1');

for (let id = 1; id <= 1000; id++) {
  const user = await client.execute('get_user', [id]);
}
```

## Best Practices

### 1. Use Connection Pooling

```typescript
// Bad - create new connection for each query
for (const query of queries) {
  const client = new Client(config);
  await client.connect();
  await client.query(query);
  await client.end();
}

// Good - use connection pool
const pool = new Pool(config);
for (const query of queries) {
  await pool.query(query);
}
```

### 2. Always Use Parameterized Queries

```typescript
// Bad - SQL injection vulnerability
await client.query(`SELECT * FROM users WHERE email = '${email}'`);

// Good - parameterized query
await client.query('SELECT * FROM users WHERE email = $1', [email]);
```

### 3. Handle Errors Properly

```typescript
try {
  await client.query('INSERT INTO users (email) VALUES ($1)', [email]);
} catch (error) {
  if (error.code === '23505') {
    // Unique violation
    console.error('Email already exists');
  } else {
    throw error;
  }
}
```

### 4. Use Transactions for Related Operations

```typescript
await client.transaction(async (client) => {
  const userResult = await client.query(
    'INSERT INTO users (name) VALUES ($1) RETURNING id',
    ['Alice']
  );
  
  await client.query(
    'INSERT INTO user_settings (user_id) VALUES ($1)',
    [userResult.rows[0].id]
  );
});
```

### 5. Close Connections

```typescript
const client = new Client(config);
try {
  await client.connect();
  await client.query('SELECT 1');
} finally {
  await client.end();
}
```

### 6. Use Indexes

```typescript
// Create indexes for WHERE clauses
await client.query('CREATE INDEX idx_users_email ON users(email)');
await client.query('CREATE INDEX idx_posts_created ON posts(created_at)');

// Composite indexes for multiple columns
await client.query('CREATE INDEX idx_posts_user_created ON posts(user_id, created_at)');
```

### 7. Optimize Queries

```typescript
// Use EXPLAIN to understand query plans
const plan = await client.query('EXPLAIN ANALYZE SELECT * FROM users WHERE email = $1', ['test@example.com']);

// Add appropriate indexes
// Use LIMIT when possible
// Avoid SELECT *
```

## Common Patterns

### Upsert (INSERT ... ON CONFLICT)

```typescript
await client.query(`
  INSERT INTO users (id, name, email)
  VALUES ($1, $2, $3)
  ON CONFLICT (id)
  DO UPDATE SET name = $2, email = $3
`, [1, 'Alice', 'alice@example.com']);
```

### Bulk Update

```typescript
const updates = users.map((user, i) =>
  `($${i * 3 + 1}, $${i * 3 + 2}, $${i * 3 + 3})`
).join(',');

const params = users.flatMap(u => [u.id, u.name, u.email]);

await client.query(`
  UPDATE users SET
    name = updates.name,
    email = updates.email
  FROM (VALUES ${updates}) AS updates(id, name, email)
  WHERE users.id = updates.id
`, params);
```

### Pagination

```typescript
const page = 1;
const pageSize = 20;
const offset = (page - 1) * pageSize;

const result = await client.query(
  'SELECT * FROM users ORDER BY created_at DESC LIMIT $1 OFFSET $2',
  [pageSize, offset]
);
```

## Troubleshooting

### Connection Timeouts

```typescript
const pool = new Pool({
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000
});
```

### Too Many Connections

```typescript
// Check active connections
const result = await client.query(
  'SELECT count(*) FROM pg_stat_activity WHERE datname = current_database()'
);

// Increase pool size or reduce connection usage
const pool = new Pool({ max: 50 });
```

### Slow Queries

```typescript
// Enable query logging
const client = new Client({
  ...config,
  statement_timeout: 5000  // 5 second timeout
});

// Use EXPLAIN ANALYZE
const plan = await client.query('EXPLAIN ANALYZE SELECT * FROM large_table');
```

## Conclusion

The @elide/pg driver provides a robust, high-performance PostgreSQL client for Elide applications. Follow these best practices to build scalable and efficient database applications.
