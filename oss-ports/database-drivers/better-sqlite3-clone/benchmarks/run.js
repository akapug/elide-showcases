/**
 * Performance benchmarks for @elide/better-sqlite3
 */

const Database = require('../dist');
const { performance } = require('perf_hooks');

function benchmark(name, fn, iterations = 1000) {
  const start = performance.now();
  fn(iterations);
  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (iterations / duration) * 1000;

  console.log(`${name}:`);
  console.log(`  Total: ${duration.toFixed(2)}ms`);
  console.log(`  Per operation: ${(duration / iterations).toFixed(4)}ms`);
  console.log(`  Operations/sec: ${opsPerSec.toFixed(0)}`);
  console.log();
}

console.log('=== @elide/better-sqlite3 Benchmarks ===\n');

const db = new Database(':memory:');

// Setup
db.exec(`
  CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    age INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX idx_users_email ON users(email);
  CREATE INDEX idx_users_age ON users(age);
`);

// Benchmark 1: Insert without transaction
console.log('--- Benchmark 1: Insert (without transaction) ---');
const insertStmt = db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
benchmark('Insert without transaction', (n) => {
  for (let i = 0; i < n; i++) {
    insertStmt.run(`User${i}`, `user${i}@example.com`, 20 + (i % 50));
  }
}, 1000);

// Clear
db.exec('DELETE FROM users');

// Benchmark 2: Insert with transaction
console.log('--- Benchmark 2: Insert (with transaction) ---');
const batchInsert = db.transaction((n) => {
  for (let i = 0; i < n; i++) {
    insertStmt.run(`User${i}`, `user${i}@example.com`, 20 + (i % 50));
  }
});
benchmark('Insert with transaction', batchInsert, 10000);

// Benchmark 3: Select by primary key
console.log('--- Benchmark 3: Select by primary key ---');
const selectById = db.prepare('SELECT * FROM users WHERE id = ?');
benchmark('Select by primary key', (n) => {
  for (let i = 0; i < n; i++) {
    selectById.get((i % 10000) + 1);
  }
}, 10000);

// Benchmark 4: Select by indexed column
console.log('--- Benchmark 4: Select by indexed column ---');
const selectByAge = db.prepare('SELECT * FROM users WHERE age = ?');
benchmark('Select by indexed column', (n) => {
  for (let i = 0; i < n; i++) {
    selectByAge.all(20 + (i % 50));
  }
}, 1000);

// Benchmark 5: Update with transaction
console.log('--- Benchmark 5: Update (with transaction) ---');
const updateStmt = db.prepare('UPDATE users SET age = ? WHERE id = ?');
const batchUpdate = db.transaction((n) => {
  for (let i = 0; i < n; i++) {
    updateStmt.run(30 + (i % 40), (i % 10000) + 1);
  }
});
benchmark('Update with transaction', batchUpdate, 10000);

// Benchmark 6: Delete with transaction
console.log('--- Benchmark 6: Delete (with transaction) ---');
const deleteStmt = db.prepare('DELETE FROM users WHERE id = ?');
const batchDelete = db.transaction((n) => {
  for (let i = 0; i < n; i++) {
    deleteStmt.run((i % 10000) + 1);
  }
});
benchmark('Delete with transaction', batchDelete, 5000);

// Refill for remaining benchmarks
db.exec('DELETE FROM users');
batchInsert(10000);

// Benchmark 7: Complex join query
console.log('--- Benchmark 7: Complex join query ---');
db.exec(`
  CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

const insertPost = db.prepare('INSERT INTO posts (user_id, title, content) VALUES (?, ?, ?)');
const batchInsertPosts = db.transaction((n) => {
  for (let i = 0; i < n; i++) {
    insertPost.run(
      (i % 10000) + 1,
      `Post ${i}`,
      `Content for post ${i}`
    );
  }
});
batchInsertPosts(20000);

const complexQuery = db.prepare(`
  SELECT
    users.id,
    users.name,
    users.email,
    COUNT(posts.id) as post_count
  FROM users
  LEFT JOIN posts ON posts.user_id = users.id
  GROUP BY users.id
  HAVING post_count > 0
  ORDER BY post_count DESC
  LIMIT 100
`);

benchmark('Complex join query', (n) => {
  for (let i = 0; i < n; i++) {
    complexQuery.all();
  }
}, 100);

// Benchmark 8: Aggregate functions
console.log('--- Benchmark 8: Aggregate functions ---');
const aggregateQuery = db.prepare(`
  SELECT
    age,
    COUNT(*) as count,
    AVG(id) as avg_id,
    MIN(id) as min_id,
    MAX(id) as max_id
  FROM users
  GROUP BY age
`);

benchmark('Aggregate query', (n) => {
  for (let i = 0; i < n; i++) {
    aggregateQuery.all();
  }
}, 1000);

// Benchmark 9: Full table scan
console.log('--- Benchmark 9: Full table scan ---');
const fullScan = db.prepare('SELECT * FROM users');
benchmark('Full table scan', (n) => {
  for (let i = 0; i < n; i++) {
    fullScan.all();
  }
}, 100);

// Benchmark 10: Iterator vs all()
console.log('--- Benchmark 10: Iterator vs all() ---');
const iterQuery = db.prepare('SELECT * FROM users LIMIT 1000');

console.time('Iterator');
for (const row of iterQuery.iterate()) {
  // Process row
}
console.timeEnd('Iterator');

console.time('all()');
const rows = iterQuery.all();
for (const row of rows) {
  // Process row
}
console.timeEnd('all()');
console.log();

// Memory stats
console.log('--- Memory Statistics ---');
const stats = db.stats;
console.log(`Current memory: ${(stats.memory.current / 1024 / 1024).toFixed(2)} MB`);
console.log(`Peak memory: ${(stats.memory.highwater / 1024 / 1024).toFixed(2)} MB`);
console.log(`Total changes: ${stats.totalChanges}`);
console.log();

db.close();

console.log('=== Benchmarks Complete ===');
