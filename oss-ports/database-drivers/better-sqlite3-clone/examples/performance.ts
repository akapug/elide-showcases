import Database from '../src';

console.log('=== SQLite Performance Optimization Examples ===\n');

const db = new Database(':memory:', {
  enableWAL: true,
  cacheSize: -64000,
  pageSize: 4096
});

db.exec(`
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA temp_store = MEMORY;
  PRAGMA mmap_size = 30000000000;
  PRAGMA page_size = 4096;
  PRAGMA cache_size = -64000;
`);

console.log('--- Optimized Settings ---');
console.log('Journal mode:', db.pragma('journal_mode', { simple: true }));
console.log('Synchronous:', db.pragma('synchronous', { simple: true }));
console.log('Cache size:', db.pragma('cache_size', { simple: true }));
console.log('Page size:', db.pragma('page_size', { simple: true }));

db.exec(`
  CREATE TABLE benchmark_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    value REAL NOT NULL,
    timestamp INTEGER NOT NULL,
    metadata TEXT
  );
  
  CREATE INDEX idx_category ON benchmark_data(category);
  CREATE INDEX idx_timestamp ON benchmark_data(timestamp);
  CREATE INDEX idx_value ON benchmark_data(value);
`);

console.log('\n--- Batch Insert Performance ---');
const insertStmt = db.prepare(
  'INSERT INTO benchmark_data (category, value, timestamp, metadata) VALUES (?, ?, ?, ?)'
);

const batchInsert = db.transaction((count: number) => {
  for (let i = 0; i < count; i++) {
    insertStmt.run(
      ['A', 'B', 'C', 'D'][i % 4],
      Math.random() * 1000,
      Date.now(),
      JSON.stringify({ index: i, random: Math.random() })
    );
  }
});

console.time('Insert 100,000 rows');
batchInsert(100000);
console.timeEnd('Insert 100,000 rows');

console.log('\n--- Query Performance ---');
console.time('SELECT with index');
const categoryA = db.prepare('SELECT * FROM benchmark_data WHERE category = ?').all('A');
console.timeEnd('SELECT with index');
console.log(`Found ${categoryA.length} rows`);

console.time('Aggregate query');
const stats = db.prepare(`
  SELECT 
    category,
    COUNT(*) as count,
    AVG(value) as avg_value,
    MIN(value) as min_value,
    MAX(value) as max_value,
    SUM(value) as total_value
  FROM benchmark_data
  GROUP BY category
  ORDER BY total_value DESC
`).all();
console.timeEnd('Aggregate query');
console.log('Statistics:', stats);

console.log('\n--- Complex Join Performance ---');
db.exec(`
  CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT, email TEXT);
  CREATE TABLE orders (id INTEGER PRIMARY KEY, user_id INTEGER, amount REAL);
  CREATE TABLE order_items (id INTEGER PRIMARY KEY, order_id INTEGER, product TEXT, quantity INTEGER);
`);

const insertUsers = db.transaction((count: number) => {
  const stmt = db.prepare('INSERT INTO users (name, email) VALUES (?, ?)');
  for (let i = 0; i < count; i++) {
    stmt.run(`User${i}`, `user${i}@example.com`);
  }
});

const insertOrders = db.transaction((count: number) => {
  const stmt = db.prepare('INSERT INTO orders (user_id, amount) VALUES (?, ?)');
  for (let i = 0; i < count; i++) {
    stmt.run((i % 1000) + 1, Math.random() * 1000);
  }
});

const insertOrderItems = db.transaction((count: number) => {
  const stmt = db.prepare('INSERT INTO order_items (order_id, product, quantity) VALUES (?, ?, ?)');
  for (let i = 0; i < count; i++) {
    stmt.run((i % 10000) + 1, `Product${i % 100}`, Math.floor(Math.random() * 10) + 1);
  }
});

console.time('Insert test data');
insertUsers(1000);
insertOrders(10000);
insertOrderItems(50000);
console.timeEnd('Insert test data');

console.time('Complex join query');
const orderSummary = db.prepare(`
  SELECT 
    u.name,
    u.email,
    COUNT(DISTINCT o.id) as order_count,
    COUNT(oi.id) as item_count,
    SUM(o.amount) as total_spent
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  LEFT JOIN order_items oi ON oi.order_id = o.id
  GROUP BY u.id
  HAVING total_spent > 1000
  ORDER BY total_spent DESC
  LIMIT 10
`).all();
console.timeEnd('Complex join query');
console.log(`Found ${orderSummary.length} high-value customers`);

console.log('\n--- Update Performance ---');
console.time('Batch update');
const batchUpdate = db.transaction(() => {
  db.run('UPDATE benchmark_data SET value = value * 1.1 WHERE category = ?', 'A');
  db.run('UPDATE benchmark_data SET value = value * 0.9 WHERE category = ?', 'B');
  db.run('UPDATE benchmark_data SET metadata = ? WHERE category = ?', '{"updated": true}', 'C');
});
batchUpdate();
console.timeEnd('Batch update');

console.log('\n--- Delete Performance ---');
console.time('Batch delete');
const batchDelete = db.transaction(() => {
  db.run('DELETE FROM benchmark_data WHERE value < ?', 100);
});
batchDelete();
console.timeEnd('Batch delete');

const finalCount = db.prepare('SELECT COUNT(*) as count FROM benchmark_data').get() as any;
console.log(`Final row count: ${finalCount.count}`);

console.log('\n--- Database Statistics ---');
console.log('Total changes:', db.totalChanges);
console.log('Memory usage:', db.stats.memory);

db.close();
console.log('\nPerformance examples complete!');
