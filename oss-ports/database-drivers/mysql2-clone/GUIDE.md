# Complete MySQL Driver Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Connections](#connections)
3. [Queries](#queries)
4. [Transactions](#transactions)
5. [Prepared Statements](#prepared-statements)
6. [Performance](#performance)
7. [Best Practices](#best-practices)

## Introduction

@elide/mysql2 provides a production-ready MySQL driver with binary protocol support, connection pooling, and prepared statements.

## Connections

### Single Connection

```typescript
import mysql from '@elide/mysql2';

const connection = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  database: 'mydb',
  password: 'secret'
});

await connection.connect();
await connection.query('SELECT 1');
await connection.end();
```

### Connection String

```typescript
const connection = mysql.createConnection('mysql://user:password@localhost:3306/mydb');
```

### Connection Pool

```typescript
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  database: 'mydb',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const [rows] = await pool.query('SELECT * FROM users');
```

## Queries

### Simple Queries

```typescript
// Query without parameters
const [rows, fields] = await connection.query('SELECT * FROM users');

// Query with parameters
const [users] = await connection.query(
  'SELECT * FROM users WHERE email = ?',
  ['alice@example.com']
);

// Multiple parameters
await connection.query(
  'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
  ['Alice', 'alice@example.com', 28]
);
```

### Named Placeholders

```typescript
const [rows] = await connection.query(
  'SELECT * FROM users WHERE name = :name AND age > :age',
  { name: 'Alice', age: 18 }
);
```

### Results

```typescript
const [rows, fields] = await connection.query('SELECT * FROM users');

console.log(rows);           // Array of row objects
console.log(fields);         // Field definitions
console.log(rows.length);    // Row count

// Insert/Update/Delete results
const [result] = await connection.query('INSERT INTO users (name) VALUES (?)', ['Alice']);
console.log(result.insertId);
console.log(result.affectedRows);
```

## Transactions

### Basic Transactions

```typescript
await connection.beginTransaction();
try {
  await connection.query('INSERT INTO users (name) VALUES (?)', ['Alice']);
  await connection.query('INSERT INTO posts (title) VALUES (?)', ['Hello']);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

### Savepoints

```typescript
await connection.beginTransaction();

await connection.query('INSERT INTO users (name) VALUES (?)', ['Alice']);
await connection.query('SAVEPOINT sp1');

await connection.query('INSERT INTO posts (title) VALUES (?)', ['Hello']);
await connection.query('ROLLBACK TO sp1');

await connection.commit();
```

## Prepared Statements

### Creating Prepared Statements

```typescript
const stmt = await connection.prepare('SELECT * FROM users WHERE id = ?');

const [user1] = await stmt.execute([1]);
const [user2] = await stmt.execute([2]);

await stmt.close();
```

### Benefits

- **Performance** - Query parsed once, executed many times
- **Security** - Automatic escaping
- **Binary Protocol** - Efficient data transfer

## Performance

### Batch Inserts

```typescript
const values = users.map(u => [u.name, u.email]);
const placeholders = values.map(() => '(?, ?)').join(',');

await connection.query(
  `INSERT INTO users (name, email) VALUES ${placeholders}`,
  values.flat()
);
```

### Connection Pooling

```typescript
const pool = mysql.createPool({
  connectionLimit: 10,
  queueLimit: 0
});

const queries = Array.from({ length: 100 }, (_, i) =>
  pool.query('SELECT ?::int as id', [i])
);

await Promise.all(queries);
```

### Prepared Statements

```typescript
const stmt = await connection.prepare('SELECT * FROM users WHERE id = ?');

for (let id = 1; id <= 1000; id++) {
  await stmt.execute([id]);
}
```

## Best Practices

### 1. Use Connection Pooling

```typescript
const pool = mysql.createPool({ connectionLimit: 10 });
```

### 2. Parameterized Queries

```typescript
// Bad
await connection.query(`SELECT * FROM users WHERE email = '${email}'`);

// Good
await connection.query('SELECT * FROM users WHERE email = ?', [email]);
```

### 3. Handle Errors

```typescript
try {
  await connection.query('INSERT INTO users (email) VALUES (?)', [email]);
} catch (error) {
  if (error.code === 'ER_DUP_ENTRY') {
    console.error('Duplicate email');
  }
}
```

### 4. Use Transactions

```typescript
await connection.beginTransaction();
try {
  await connection.query(...);
  await connection.query(...);
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
}
```

### 5. Close Connections

```typescript
try {
  await connection.connect();
  await connection.query('SELECT 1');
} finally {
  await connection.end();
}
```
