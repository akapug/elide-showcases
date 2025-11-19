# SQLite Performance Guide

## Introduction

This guide covers performance optimization techniques for @elide/better-sqlite3, helping you achieve maximum throughput and minimal latency.

## Configuration

### WAL Mode

Write-Ahead Logging provides better concurrency:

```typescript
const db = new Database('app.db', { enableWAL: true });
```

Benefits:
- Multiple readers don't block writers
- Writers don't block readers
- Better concurrency for read-heavy workloads

### Cache Size

Increase cache for better performance:

```typescript
const db = new Database('app.db', { cacheSize: -64000 }); // 64MB

// Or dynamically:
db.pragma('cache_size = -64000');
```

### Page Size

Optimize page size (must be set before data is added):

```typescript
db.pragma('page_size = 4096');  // 4KB pages
db.pragma('page_size = 8192');  // 8KB pages (better for large records)
```

### Synchronous Mode

Balance durability vs performance:

```typescript
// Full safety (slowest)
db.pragma('synchronous = FULL');

// Good balance (default with WAL)
db.pragma('synchronous = NORMAL');

// Fastest (risk of corruption on crash)
db.pragma('synchronous = OFF');
```

## Transactions

### Always Use Transactions for Bulk Operations

```typescript
// Slow: ~20 inserts/sec
for (let i = 0; i < 10000; i++) {
  db.run('INSERT INTO data (value) VALUES (?)', i);
}

// Fast: ~50,000+ inserts/sec
const insertMany = db.transaction((values) => {
  const stmt = db.prepare('INSERT INTO data (value) VALUES (?)');
  values.forEach(v => stmt.run(v));
});

insertMany(Array.from({ length: 10000 }, (_, i) => i));
```

### Transaction Types

```typescript
// Default (deferred)
const fn = db.transaction(() => {});

// Immediate (acquires write lock immediately)
const fn = db.transaction(() => {}, { immediate: true });

// Exclusive (blocks all other connections)
const fn = db.transaction(() => {}, { exclusive: true });
```

## Prepared Statements

### Reuse Statements

```typescript
// Bad: Prepare statement every time
for (let i = 0; i < 1000; i++) {
  db.prepare('INSERT INTO data (value) VALUES (?)').run(i);
}

// Good: Prepare once, reuse
const stmt = db.prepare('INSERT INTO data (value) VALUES (?)');
for (let i = 0; i < 1000; i++) {
  stmt.run(i);
}
stmt.finalize();
```

### Statement Caching

```typescript
class DatabaseWrapper {
  private stmts: Map<string, Statement> = new Map();

  getStatement(sql: string): Statement {
    if (!this.stmts.has(sql)) {
      this.stmts.set(sql, this.db.prepare(sql));
    }
    return this.stmts.get(sql)!;
  }

  run(sql: string, ...params: any[]) {
    return this.getStatement(sql).run(...params);
  }
}
```

## Indexes

### Create Appropriate Indexes

```typescript
// Index frequently queried columns
db.exec('CREATE INDEX idx_user_email ON users(email)');

// Composite indexes for multiple columns
db.exec('CREATE INDEX idx_post_user_date ON posts(user_id, created_at)');

// Covering indexes (include all query columns)
db.exec('CREATE INDEX idx_user_cover ON users(email, name, age)');
```

### Index Analysis

```typescript
// Check if index is used
const plan = db.prepare('EXPLAIN QUERY PLAN SELECT * FROM users WHERE email = ?').all('test@example.com');
console.log(plan);

// Should show "SEARCH" not "SCAN"
// SEARCH means index is used
// SCAN means full table scan
```

### Analyze Database

```typescript
// Update statistics
db.exec('ANALYZE');

// Analyze specific table
db.exec('ANALYZE users');
```

## Query Optimization

### Use LIMIT

```typescript
// Bad: Fetch all rows
const users = db.prepare('SELECT * FROM users').all();

// Good: Limit results
const users = db.prepare('SELECT * FROM users LIMIT 100').all();
```

### Avoid SELECT *

```typescript
// Bad: Fetch all columns
const users = db.prepare('SELECT * FROM users').all();

// Good: Select only needed columns
const users = db.prepare('SELECT id, name, email FROM users').all();
```

### Use Iterators for Large Results

```typescript
// Bad: Load all rows in memory
const rows = db.prepare('SELECT * FROM large_table').all();

// Good: Iterate one row at a time
const stmt = db.prepare('SELECT * FROM large_table');
for (const row of stmt.iterate()) {
  // Process row
}
```

## Benchmarks

### Insert Performance

```typescript
// Without transaction: ~20 ops/sec
const insert = db.prepare('INSERT INTO data (value) VALUES (?)');
console.time('No transaction');
for (let i = 0; i < 1000; i++) {
  insert.run(i);
}
console.timeEnd('No transaction');

// With transaction: ~50,000+ ops/sec
const insertTx = db.transaction((values) => {
  values.forEach(v => insert.run(v));
});

console.time('With transaction');
insertTx(Array.from({ length: 10000 }, (_, i) => i));
console.timeEnd('With transaction');
```

### Query Performance

```typescript
// Setup
db.exec(`
  CREATE TABLE data (id INTEGER PRIMARY KEY, value INTEGER);
  CREATE INDEX idx_value ON data(value);
`);

const insertMany = db.transaction((count) => {
  const stmt = db.prepare('INSERT INTO data (value) VALUES (?)');
  for (let i = 0; i < count; i++) {
    stmt.run(Math.floor(Math.random() * 1000));
  }
});
insertMany(100000);

// Benchmark indexed query
console.time('Indexed query');
for (let i = 0; i < 1000; i++) {
  db.prepare('SELECT * FROM data WHERE value = ?').all(i % 1000);
}
console.timeEnd('Indexed query');

// Benchmark full scan
console.time('Full scan');
for (let i = 0; i < 100; i++) {
  db.prepare('SELECT * FROM data').all();
}
console.timeEnd('Full scan');
```

## Memory Management

### Vacuum

```typescript
// Reclaim unused space
db.exec('VACUUM');

// Incremental vacuum
db.pragma('auto_vacuum = INCREMENTAL');
db.exec('PRAGMA incremental_vacuum');
```

### Temp Store

```typescript
// Use memory for temporary tables
db.pragma('temp_store = MEMORY');
```

### Memory-Mapped I/O

```typescript
// Enable memory-mapped I/O (30GB limit)
db.pragma('mmap_size = 30000000000');
```

## Monitoring

### Statistics

```typescript
const stats = db.stats;
console.log('Memory usage:', {
  current: stats.memory.current,
  peak: stats.memory.highwater
});

console.log('Changes:', {
  total: stats.totalChanges,
  current: stats.changes
});
```

### Query Profiling

```typescript
// Enable verbose logging
const db = new Database('app.db', {
  verbose: (sql) => {
    console.log('Executed:', sql);
  }
});
```

## Production Tips

1. **Use WAL mode** for better concurrency
2. **Always use transactions** for bulk operations
3. **Create indexes** for frequently queried columns
4. **Use prepared statements** for repeated queries
5. **Monitor memory usage** and vacuum regularly
6. **Profile queries** with EXPLAIN QUERY PLAN
7. **Set appropriate pragmas** for your use case
8. **Use iterators** for large result sets
9. **Avoid SELECT *** - select only needed columns
10. **Regular ANALYZE** to keep statistics up to date

## Conclusion

Following these optimization techniques can improve SQLite performance by 100-1000x for typical workloads. Always measure performance with realistic data and usage patterns.
