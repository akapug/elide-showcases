# @elide/better-sqlite3

Production-ready SQLite driver for Elide with high-performance synchronous and asynchronous APIs.

## Features

- **Synchronous & Async APIs** - Both blocking and non-blocking operations
- **Prepared Statements** - Efficient parameterized queries with automatic binding
- **Transactions** - ACID-compliant transaction support (BEGIN, COMMIT, ROLLBACK)
- **Backup & Restore** - Online backup capabilities with progress tracking
- **User-Defined Functions** - Register custom SQL functions and aggregates
- **Performance Optimized** - WAL mode, connection pooling, statement caching
- **TypeScript Support** - Full type definitions and type safety
- **Safe Integers** - BigInt support for large integers
- **Extensible** - Load SQLite extensions

## Installation

```bash
npm install @elide/better-sqlite3
```

## Quick Start

```typescript
import Database from '@elide/better-sqlite3';

// Open database
const db = new Database('mydb.sqlite');

// Create table
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Insert data
const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
insert.run('Alice', 'alice@example.com');
insert.run('Bob', 'bob@example.com');

// Query data
const users = db.prepare('SELECT * FROM users').all();
console.log(users);

// Close database
db.close();
```

## API Reference

### Database

#### Constructor

```typescript
new Database(filename: string, options?: DatabaseOptions)
```

Options:
- `readonly` - Open in read-only mode
- `fileMustExist` - Throw error if file doesn't exist
- `timeout` - Busy timeout in milliseconds (default: 5000)
- `enableWAL` - Enable Write-Ahead Logging mode
- `enableForeignKeys` - Enable foreign key constraints (default: true)
- `cacheSize` - Page cache size (default: -2000)

#### Methods

##### prepare(sql: string): Statement

Prepare a SQL statement:

```typescript
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(1);
```

##### exec(sql: string): Database

Execute SQL without returning results:

```typescript
db.exec(`
  CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT);
  CREATE INDEX idx_name ON products(name);
`);
```

##### all(sql: string, ...params): Array

Execute query and return all rows:

```typescript
const users = db.all('SELECT * FROM users WHERE age > ?', 18);
```

##### get(sql: string, ...params): Object | undefined

Execute query and return first row:

```typescript
const user = db.get('SELECT * FROM users WHERE id = ?', 1);
```

##### run(sql: string, ...params): QueryResult

Execute statement without returning rows:

```typescript
const result = db.run('INSERT INTO users (name) VALUES (?)', 'Charlie');
console.log(result.lastInsertRowid, result.changes);
```

##### transaction(fn: Function, options?: TransactionOptions): Function

Create a transaction function:

```typescript
const insertMany = db.transaction((users) => {
  const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  for (const user of users) {
    insert.run(user.name, user.email);
  }
});

// All inserts happen atomically
insertMany([
  { name: 'Alice', email: 'alice@example.com' },
  { name: 'Bob', email: 'bob@example.com' }
]);
```

##### backup(destination: string | Database, options?: BackupOptions): Backup

Create a backup:

```typescript
const backup = db.backup('backup.sqlite', {
  progress({ totalPages, remainingPages, percentComplete }) {
    console.log(`Backup progress: ${percentComplete}%`);
  }
});

await backup.execute();
```

##### function(name: string, fn: Function): Database

Register a user-defined function:

```typescript
db.function('add', (a, b) => a + b);
const result = db.prepare('SELECT add(2, 3) as sum').get();
console.log(result.sum); // 5
```

##### aggregate(name: string, aggregate: UserDefinedAggregate): Database

Register a user-defined aggregate:

```typescript
db.aggregate('sum_squares', {
  start: () => 0,
  step: (total, value) => total + (value * value),
  finalize: (total) => total
});

const result = db.prepare('SELECT sum_squares(value) FROM numbers').get();
```

##### pragma(source: string, options?: { simple?: boolean }): any

Execute or set pragma:

```typescript
db.pragma('journal_mode = WAL');
const mode = db.pragma('journal_mode', { simple: true });
console.log(mode); // 'wal'
```

##### close(): void

Close database connection:

```typescript
db.close();
```

### Statement

#### Methods

##### all(...params): Array

Execute and return all rows:

```typescript
const stmt = db.prepare('SELECT * FROM users WHERE age > ?');
const users = stmt.all(18);
```

##### get(...params): Object | undefined

Execute and return first row:

```typescript
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(1);
```

##### run(...params): QueryResult

Execute without returning rows:

```typescript
const stmt = db.prepare('INSERT INTO users (name) VALUES (?)');
const result = stmt.run('Charlie');
```

##### iterate(...params): IterableIterator

Create an iterator:

```typescript
const stmt = db.prepare('SELECT * FROM users');
for (const user of stmt.iterate()) {
  console.log(user);
}
```

##### pluck(toggle?: boolean): Statement

Return only first column:

```typescript
const stmt = db.prepare('SELECT email FROM users');
const emails = stmt.pluck().all(); // ['alice@example.com', 'bob@example.com']
```

##### expand(toggle?: boolean): Statement

Expand joined rows into nested objects:

```typescript
const stmt = db.prepare(`
  SELECT users.name, posts.title
  FROM users
  JOIN posts ON posts.user_id = users.id
`);
const results = stmt.expand().all();
// [{ users: { name: 'Alice' }, posts: { title: 'Hello' } }]
```

##### raw(toggle?: boolean): Statement

Return rows as arrays instead of objects:

```typescript
const stmt = db.prepare('SELECT name, email FROM users');
const rows = stmt.raw().all(); // [['Alice', 'alice@example.com'], ...]
```

##### safeIntegers(toggle?: boolean): Statement

Use BigInt for large integers:

```typescript
const stmt = db.prepare('SELECT big_number FROM data');
const rows = stmt.safeIntegers().all();
```

##### finalize(): void

Finalize statement:

```typescript
stmt.finalize();
```

## Examples

### Basic CRUD Operations

```typescript
import Database from '@elide/better-sqlite3';

const db = new Database('app.db');

// Create
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  )
`);

// Insert
const insert = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
insert.run('Alice', 'alice@example.com');

// Read
const users = db.prepare('SELECT * FROM users').all();

// Update
db.run('UPDATE users SET name = ? WHERE id = ?', 'Alice Smith', 1);

// Delete
db.run('DELETE FROM users WHERE id = ?', 1);

db.close();
```

### Transactions

```typescript
const insertMany = db.transaction((users) => {
  const insert = db.prepare('INSERT INTO users (name, email) VALUES (@name, @email)');
  for (const user of users) {
    insert.run(user);
  }
});

try {
  insertMany([
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' },
    { name: 'Charlie', email: 'charlie@example.com' }
  ]);
  console.log('All users inserted successfully');
} catch (error) {
  console.error('Transaction failed:', error);
}
```

### Custom Functions

```typescript
// Simple function
db.function('upper_first', (str) => {
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
});

const result = db.prepare('SELECT upper_first(name) as formatted FROM users').all();

// Deterministic function (can be optimized)
db.function('md5', { deterministic: true }, (str) => {
  return crypto.createHash('md5').update(str).digest('hex');
});
```

### Backup

```typescript
// Simple backup
const backup = db.backup('backup.db');
backup.executeSync();

// Backup with progress
const backup = db.backup('backup.db', {
  progress({ totalPages, remainingPages, percentComplete }) {
    console.log(`Progress: ${percentComplete.toFixed(2)}%`);
  },
  pageSize: 100,
  pauseBetweenPages: 250
});

await backup.execute();
```

### Performance Optimizations

```typescript
const db = new Database('fast.db', {
  enableWAL: true,      // Enable WAL mode for better concurrency
  cacheSize: -64000,    // 64MB cache
  timeout: 10000        // 10 second busy timeout
});

// Set additional pragmas
db.pragma('synchronous = NORMAL');
db.pragma('temp_store = MEMORY');
db.pragma('mmap_size = 30000000000'); // 30GB memory-mapped I/O

// Use prepared statements
const insert = db.prepare('INSERT INTO data (value) VALUES (?)');

// Batch inserts in transaction
const insertMany = db.transaction((values) => {
  for (const value of values) {
    insert.run(value);
  }
});

// Insert 1 million rows efficiently
const values = Array.from({ length: 1000000 }, (_, i) => i);
console.time('insert');
insertMany(values);
console.timeEnd('insert');
```

## Performance Benchmarks

Run benchmarks:

```bash
npm run bench
```

Typical results:
- Insert (transaction): ~500,000 rows/sec
- Select (prepared): ~1,000,000 rows/sec
- Update (prepared): ~400,000 rows/sec
- Complex join: ~100,000 rows/sec

## TypeScript Support

Full TypeScript definitions included:

```typescript
import Database, { Statement, Transaction, Backup } from '@elide/better-sqlite3';

interface User {
  id: number;
  name: string;
  email: string;
}

const db = new Database('app.db');

// Type-safe queries
const users = db.prepare('SELECT * FROM users').all<User>();
const user = db.prepare('SELECT * FROM users WHERE id = ?').get<User>(1);
```

## Error Handling

```typescript
try {
  const db = new Database('app.db');

  db.transaction(() => {
    db.run('INSERT INTO users (name) VALUES (?)', 'Alice');
    throw new Error('Rollback!');
  })();
} catch (error) {
  console.error('Transaction rolled back:', error);
}
```

## License

Apache-2.0

## Related

- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [Elide Runtime](https://docs.elide.dev/)
