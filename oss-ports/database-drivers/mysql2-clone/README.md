# @elide/mysql2

Production-ready MySQL driver for Elide with binary protocol support.

## Features

- **Query Execution** - Execute SQL queries with parameterized values
- **Prepared Statements** - Binary protocol for optimal performance
- **Transactions** - ACID-compliant transaction support
- **Connection Pooling** - Efficient connection management
- **Binary Protocol** - Fast data transfer
- **Multiple Statements** - Execute multiple SQL statements
- **SSL Support** - Secure connections
- **TypeScript** - Full type definitions

## Installation

```bash
npm install @elide/mysql2
```

## Quick Start

```typescript
import mysql from '@elide/mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'test',
  password: 'secret'
});

await connection.connect();

const [rows, fields] = await connection.query('SELECT * FROM users WHERE id = ?', [1]);
console.log(rows);

await connection.end();
```

## Connection Pooling

```typescript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const [rows] = await pool.query('SELECT * FROM users');
await pool.end();
```

## Prepared Statements

```typescript
const stmt = await connection.prepare('SELECT * FROM users WHERE id = ?');
const [rows1] = await stmt.execute([1]);
const [rows2] = await stmt.execute([2]);
await stmt.close();
```

## Transactions

```typescript
await connection.beginTransaction();
try {
  await connection.query('INSERT INTO users (name) VALUES (?)', ['Alice']);
  await connection.query('UPDATE accounts SET balance = balance - 100 WHERE user_id = ?', [1]);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

## Multiple Statements

```typescript
const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  multipleStatements: true
});

const [results] = await connection.query('SELECT 1; SELECT 2; SELECT 3');
console.log(results); // Array of result sets
```

## Escaping Values

```typescript
const userId = 1;
const sql = connection.format('SELECT * FROM users WHERE id = ?', [userId]);

const escaped = connection.escape("It's a string");
const escapedId = connection.escapeId('tableName');
```

## License

Apache-2.0
