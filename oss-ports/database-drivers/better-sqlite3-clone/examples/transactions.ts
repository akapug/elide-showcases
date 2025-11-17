/**
 * Transaction examples for @elide/better-sqlite3
 */

import Database from '../src';

const db = new Database(':memory:');

// Setup
db.exec(`
  CREATE TABLE accounts (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    balance REAL NOT NULL DEFAULT 0
  );

  CREATE TABLE transactions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    from_account INTEGER,
    to_account INTEGER,
    amount REAL NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (from_account) REFERENCES accounts(id),
    FOREIGN KEY (to_account) REFERENCES accounts(id)
  );
`);

// Insert sample accounts
db.exec(`
  INSERT INTO accounts (id, name, balance) VALUES
    (1, 'Alice', 1000.00),
    (2, 'Bob', 500.00),
    (3, 'Charlie', 750.00);
`);

console.log('--- Initial Account Balances ---');
console.table(db.prepare('SELECT * FROM accounts').all());

/**
 * Example 1: Simple Transaction
 */
console.log('\n--- Example 1: Simple Transaction ---');

const transfer = db.transaction((fromId: number, toId: number, amount: number) => {
  // Debit from source
  db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', amount, fromId);

  // Credit to destination
  db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', amount, toId);

  // Record transaction
  db.run(
    'INSERT INTO transactions (from_account, to_account, amount) VALUES (?, ?, ?)',
    fromId,
    toId,
    amount
  );
});

try {
  transfer(1, 2, 100); // Alice -> Bob: $100
  console.log('Transfer successful!');
  console.table(db.prepare('SELECT * FROM accounts').all());
} catch (error) {
  console.error('Transfer failed:', error);
}

/**
 * Example 2: Transaction with Validation
 */
console.log('\n--- Example 2: Transaction with Validation ---');

const safeTransfer = db.transaction((fromId: number, toId: number, amount: number) => {
  // Check source balance
  const source = db.prepare('SELECT balance FROM accounts WHERE id = ?').get(fromId) as any;
  if (!source) {
    throw new Error('Source account not found');
  }
  if (source.balance < amount) {
    throw new Error('Insufficient funds');
  }

  // Check destination exists
  const dest = db.prepare('SELECT id FROM accounts WHERE id = ?').get(toId);
  if (!dest) {
    throw new Error('Destination account not found');
  }

  // Perform transfer
  db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', amount, fromId);
  db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', amount, toId);
  db.run(
    'INSERT INTO transactions (from_account, to_account, amount) VALUES (?, ?, ?)',
    fromId,
    toId,
    amount
  );

  return { success: true, amount };
});

try {
  const result = safeTransfer(2, 3, 200); // Bob -> Charlie: $200
  console.log('Transfer result:', result);
  console.table(db.prepare('SELECT * FROM accounts').all());
} catch (error) {
  console.error('Transfer failed:', error);
}

// Try insufficient funds
try {
  safeTransfer(2, 1, 1000); // Should fail
} catch (error) {
  console.error('Expected error:', error.message);
}

/**
 * Example 3: Batch Insert Transaction
 */
console.log('\n--- Example 3: Batch Insert Transaction ---');

db.exec('CREATE TABLE logs (id INTEGER PRIMARY KEY, message TEXT, level TEXT)');

const batchInsert = db.transaction((records: Array<{ message: string; level: string }>) => {
  const insert = db.prepare('INSERT INTO logs (message, level) VALUES (?, ?)');

  for (const record of records) {
    insert.run(record.message, record.level);
  }

  return records.length;
});

const logRecords = [
  { message: 'Application started', level: 'INFO' },
  { message: 'User logged in', level: 'INFO' },
  { message: 'Database connected', level: 'DEBUG' },
  { message: 'Error processing request', level: 'ERROR' },
  { message: 'Request completed', level: 'INFO' }
];

console.time('Batch insert');
const inserted = batchInsert(logRecords);
console.timeEnd('Batch insert');
console.log(`Inserted ${inserted} log records`);

/**
 * Example 4: Nested Transaction (Savepoints)
 */
console.log('\n--- Example 4: Manual Transaction Control ---');

db.beginTransaction({ immediate: true });

try {
  // First operation
  db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', 50, 1);

  // Second operation
  db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', 50, 3);

  // Record transaction
  db.run('INSERT INTO transactions (from_account, to_account, amount) VALUES (?, ?, ?)', 1, 3, 50);

  // Commit
  db.commit();
  console.log('Manual transaction committed');
} catch (error) {
  // Rollback on error
  db.rollback();
  console.error('Manual transaction rolled back:', error);
}

console.table(db.prepare('SELECT * FROM accounts').all());

/**
 * Example 5: Transaction Performance Comparison
 */
console.log('\n--- Example 5: Performance Comparison ---');

db.exec('CREATE TABLE performance_test (id INTEGER PRIMARY KEY, value TEXT)');

const insertStmt = db.prepare('INSERT INTO performance_test (value) VALUES (?)');
const count = 10000;

// Without transaction
console.time('Without transaction');
for (let i = 0; i < count; i++) {
  insertStmt.run(`value_${i}`);
}
console.timeEnd('Without transaction');

// Clear table
db.exec('DELETE FROM performance_test');

// With transaction
const batchInsertPerf = db.transaction((n: number) => {
  for (let i = 0; i < n; i++) {
    insertStmt.run(`value_${i}`);
  }
});

console.time('With transaction');
batchInsertPerf(count);
console.timeEnd('With transaction');

const finalCount = db.prepare('SELECT COUNT(*) as count FROM performance_test').get() as any;
console.log(`Final row count: ${finalCount.count}`);

/**
 * Example 6: Transaction Isolation
 */
console.log('\n--- Example 6: Transaction Types ---');

// Immediate transaction - acquires write lock immediately
const immediateTransfer = db.transaction((fromId: number, toId: number, amount: number) => {
  db.run('UPDATE accounts SET balance = balance - ? WHERE id = ?', amount, fromId);
  db.run('UPDATE accounts SET balance = balance + ? WHERE id = ?', amount, toId);
}, { immediate: true });

immediateTransfer(1, 2, 25);
console.log('Immediate transaction completed');

// View final state
console.log('\n--- Final Account Balances ---');
console.table(db.prepare('SELECT * FROM accounts').all());

console.log('\n--- Transaction History ---');
console.table(db.prepare('SELECT * FROM transactions ORDER BY id').all());

db.close();
console.log('\nDatabase closed');
