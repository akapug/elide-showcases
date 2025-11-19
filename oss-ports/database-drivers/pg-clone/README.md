# @elide/pg

Production-ready PostgreSQL driver for Elide.

## Features

- **Query Execution** - Execute SQL queries with parameterized values
- **Prepared Statements** - Reusable query optimization
- **Transactions** - ACID-compliant transaction support
- **Connection Pooling** - Efficient connection management
- **LISTEN/NOTIFY** - Real-time notifications
- **COPY Protocol** - Bulk data import/export
- **SSL Support** - Secure connections
- **TypeScript** - Full type definitions

## Installation

```bash
npm install @elide/pg
```

## Quick Start

```typescript
import { Client } from '@elide/pg';

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  user: 'user',
  password: 'password'
});

await client.connect();

const result = await client.query('SELECT * FROM users WHERE id = $1', [1]);
console.log(result.rows);

await client.end();
```

## Connection Pooling

```typescript
import { Pool } from '@elide/pg';

const pool = new Pool({
  host: 'localhost',
  database: 'mydb',
  max: 20,
  idleTimeoutMillis: 30000
});

const result = await pool.query('SELECT NOW()');
await pool.end();
```

## Transactions

```typescript
await client.begin();
try {
  await client.query('INSERT INTO accounts (name, balance) VALUES ($1, $2)', ['Alice', 1000]);
  await client.query('UPDATE accounts SET balance = balance - 100 WHERE name = $1', ['Alice']);
  await client.commit();
} catch (error) {
  await client.rollback();
  throw error;
}

// Or use helper method
await client.transaction(async (client) => {
  await client.query('INSERT INTO users (name) VALUES ($1)', ['Alice']);
  await client.query('INSERT INTO posts (title) VALUES ($1)', ['Hello']);
});
```

## LISTEN/NOTIFY

```typescript
await client.listen('my_channel', (notification) => {
  console.log('Received:', notification.payload);
});

// From another client
await otherClient.notify('my_channel', 'Hello World!');
```

## Prepared Statements

```typescript
const stmt = await client.prepare('get_user', 'SELECT * FROM users WHERE id = $1');
const result1 = await stmt.execute([1]);
const result2 = await stmt.execute([2]);
await stmt.close();
```

## License

Apache-2.0
