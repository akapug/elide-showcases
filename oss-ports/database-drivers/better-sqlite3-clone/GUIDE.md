# Complete SQLite Driver Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Basic Usage](#basic-usage)
4. [Advanced Features](#advanced-features)
5. [Performance Optimization](#performance-optimization)
6. [Best Practices](#best-practices)
7. [Troubleshooting](#troubleshooting)

## Introduction

The @elide/better-sqlite3 driver provides a production-ready SQLite implementation with both synchronous and asynchronous APIs, optimized for the Elide runtime.

### Key Features

- **Synchronous Operations** - No callback hell, just straightforward code
- **Prepared Statements** - Reusable queries with parameter binding
- **Transactions** - ACID-compliant with automatic rollback on errors
- **User-Defined Functions** - Extend SQL with custom JavaScript functions
- **Backup Support** - Online backup with progress tracking
- **WAL Mode** - Write-Ahead Logging for better concurrency
- **Type Safety** - Full TypeScript support with generics

## Installation

```bash
npm install @elide/better-sqlite3
```

## Basic Usage

### Opening a Database

```typescript
import Database from '@elide/better-sqlite3';

// File-based database
const db = new Database('myapp.db');

// In-memory database
const dbMem = new Database(':memory:');

// With options
const dbOpts = new Database('myapp.db', {
  readonly: false,
  fileMustExist: false,
  timeout: 5000,
  verbose: console.log
});
```

### Creating Tables

```typescript
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_username ON users(username);
  CREATE INDEX idx_email ON users(email);
`);
```

### Inserting Data

```typescript
// Simple insert
db.run('INSERT INTO users (username, email) VALUES (?, ?)', 'alice', 'alice@example.com');

// Prepared statement
const insert = db.prepare('INSERT INTO users (username, email) VALUES (?, ?)');
const info = insert.run('bob', 'bob@example.com');
console.log('Inserted row ID:', info.lastInsertRowid);

// Named parameters
const insertNamed = db.prepare('INSERT INTO users (username, email) VALUES (@username, @email)');
insertNamed.run({ username: 'charlie', email: 'charlie@example.com' });
```

### Querying Data

```typescript
// Get single row
const user = db.prepare('SELECT * FROM users WHERE username = ?').get('alice');
console.log(user);

// Get all rows
const users = db.prepare('SELECT * FROM users').all();
console.log(`Found ${users.length} users`);

// Iterate over rows
const stmt = db.prepare('SELECT * FROM users');
for (const user of stmt.iterate()) {
  console.log(user.username);
}
```

### Updating Data

```typescript
// Update single row
const changes = db.run('UPDATE users SET email = ? WHERE username = ?', 
  'alice@newdomain.com', 'alice');
console.log(`Updated ${changes.changes} rows`);

// Update multiple rows
db.run('UPDATE users SET email = lower(email)');
```

### Deleting Data

```typescript
// Delete single row
db.run('DELETE FROM users WHERE username = ?', 'bob');

// Delete multiple rows
db.run('DELETE FROM users WHERE created_at < datetime("now", "-1 year")');

// Delete all rows
db.run('DELETE FROM users');
```

## Advanced Features

### Transactions

Transactions ensure atomicity - either all operations succeed or none do.

```typescript
// Transaction wrapper
const transfer = db.transaction((fromId, toId, amount) => {
  db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', amount, fromId);
  db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', amount, toId);
});

// Use the transaction
try {
  transfer(1, 2, 100);
  console.log('Transfer successful');
} catch (error) {
  console.error('Transfer failed:', error);
  // Automatically rolled back
}
```

### Manual Transaction Control

```typescript
db.beginTransaction();
try {
  db.run('INSERT INTO logs (message) VALUES (?)', 'Transaction started');
  db.run('UPDATE stats SET count = count + 1');
  db.commit();
} catch (error) {
  db.rollback();
  throw error;
}
```

### User-Defined Functions

Extend SQL with custom JavaScript functions:

```typescript
// Simple function
db.function('add', (a, b) => a + b);
const result = db.prepare('SELECT add(2, 3) as sum').get();
// { sum: 5 }

// Deterministic function (can be optimized)
db.function('reverse', { deterministic: true }, (str) => {
  return str.split('').reverse().join('');
});

// Variadic function
db.function('sum_all', { varargs: true }, (...args) => {
  return args.reduce((sum, val) => sum + val, 0);
});
```

### User-Defined Aggregates

Create custom aggregate functions:

```typescript
db.aggregate('avg_squares', {
  start: () => ({ sum: 0, count: 0 }),
  step: (context, value) => {
    context.sum += value * value;
    context.count++;
    return context;
  },
  finalize: (context) => {
    return context.count > 0 ? context.sum / context.count : null;
  }
});

const result = db.prepare('SELECT avg_squares(value) FROM data').get();
```

### Database Backup

```typescript
// Simple backup
const backup = db.backup('backup.db');
backup.executeSync();

// Backup with progress
const backup = db.backup('backup.db', {
  progress: ({ totalPages, remainingPages, percentComplete }) => {
    console.log(`Backup: ${percentComplete.toFixed(2)}%`);
  },
  pageSize: 100,
  pauseBetweenPages: 250
});

await backup.execute();
```

### Statement Options

```typescript
// Return raw arrays instead of objects
const stmt = db.prepare('SELECT name, email FROM users');
const rows = stmt.raw().all();
// [['alice', 'alice@example.com'], ['bob', 'bob@example.com']]

// Return only first column (pluck)
const emails = db.prepare('SELECT email FROM users').pluck().all();
// ['alice@example.com', 'bob@example.com']

// Expand joined rows into nested objects
const stmt = db.prepare(`
  SELECT 
    users.name as 'users.name',
    posts.title as 'posts.title'
  FROM users
  JOIN posts ON posts.user_id = users.id
`);
const results = stmt.expand().all();
// [{ users: { name: 'Alice' }, posts: { title: 'Hello' } }]
```

## Performance Optimization

### WAL Mode

Write-Ahead Logging mode improves concurrency:

```typescript
const db = new Database('myapp.db', { enableWAL: true });

// Or manually:
db.pragma('journal_mode = WAL');
```

### Cache Configuration

```typescript
const db = new Database('myapp.db', {
  cacheSize: -64000  // 64MB cache
});

// Or manually:
db.pragma('cache_size = -64000');
```

### Batch Operations

Always use transactions for bulk operations:

```typescript
// Slow - each insert is a transaction
for (let i = 0; i < 10000; i++) {
  db.run('INSERT INTO data (value) VALUES (?)', i);
}

// Fast - single transaction
const insertMany = db.transaction((values) => {
  const insert = db.prepare('INSERT INTO data (value) VALUES (?)');
  for (const value of values) {
    insert.run(value);
  }
});

insertMany(Array.from({ length: 10000 }, (_, i) => i));
```

### Indexes

Create indexes for frequently queried columns:

```typescript
db.exec(`
  CREATE INDEX idx_user_email ON users(email);
  CREATE INDEX idx_post_created ON posts(created_at);
  CREATE INDEX idx_comment_post ON comments(post_id, created_at);
`);
```

### Prepared Statements

Reuse prepared statements for better performance:

```typescript
// Prepare once
const insert = db.prepare('INSERT INTO users (name) VALUES (?)');

// Use many times
for (let i = 0; i < 1000; i++) {
  insert.run(`User ${i}`);
}

// Finalize when done
insert.finalize();
```

## Best Practices

### 1. Always Use Prepared Statements

```typescript
// Bad
db.run(`INSERT INTO users (name) VALUES ('${userInput}')`);

// Good
db.run('INSERT INTO users (name) VALUES (?)', userInput);
```

### 2. Use Transactions for Batch Operations

```typescript
const insertMany = db.transaction((items) => {
  const insert = db.prepare('INSERT INTO items (name) VALUES (?)');
  items.forEach(item => insert.run(item));
});
```

### 3. Close Database Connections

```typescript
const db = new Database('myapp.db');

try {
  // Use database
} finally {
  db.close();
}
```

### 4. Handle Errors Properly

```typescript
try {
  db.transaction(() => {
    db.run('INSERT INTO users (username) VALUES (?)', 'alice');
    db.run('INSERT INTO users (username) VALUES (?)', 'alice'); // Duplicate!
  })();
} catch (error) {
  console.error('Transaction failed:', error);
  // Handle error appropriately
}
```

### 5. Use Indexes Wisely

```typescript
// Create indexes for WHERE, JOIN, and ORDER BY columns
db.exec(`
  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_posts_user ON posts(user_id);
`);

// Verify index usage
const explain = db.prepare('EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?').all('test@example.com');
console.log(explain);
```

## Troubleshooting

### Database Locked

If you get "database is locked" errors:

```typescript
// Increase timeout
const db = new Database('myapp.db', { timeout: 10000 });

// Enable WAL mode
db.pragma('journal_mode = WAL');
```

### Memory Usage

For large datasets:

```typescript
// Use iterators instead of all()
const stmt = db.prepare('SELECT * FROM large_table');
for (const row of stmt.iterate()) {
  // Process one row at a time
}

// Or use pagination
const pageSize = 1000;
const stmt = db.prepare('SELECT * FROM large_table LIMIT ? OFFSET ?');
for (let page = 0; ; page++) {
  const rows = stmt.all(pageSize, page * pageSize);
  if (rows.length === 0) break;
  // Process page
}
```

### Performance Issues

```typescript
// Analyze query performance
db.pragma('analysis_limit = 1000');
db.exec('ANALYZE');

// Check statistics
const stats = db.pragma('stats');
console.log(stats);

// Use EXPLAIN to understand query plans
const plan = db.prepare('EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?').all('test@example.com');
console.log(plan);
```

## Conclusion

The @elide/better-sqlite3 driver provides a powerful, efficient, and easy-to-use interface for SQLite databases. Follow the best practices in this guide to build robust and performant applications.

For more information, see the [API Reference](./README.md) and [Examples](./examples/).
