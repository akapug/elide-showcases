import { Client, Pool } from '../src';

async function basicExample() {
  console.log('=== Basic PostgreSQL Example ===\n');
  
  const client = new Client({
    host: 'localhost',
    database: 'myapp',
    user: 'postgres'
  });

  await client.connect();

  await client.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await client.query('INSERT INTO users (name, email) VALUES ($1, $2)', ['Alice', 'alice@example.com']);
  
  const result = await client.query('SELECT * FROM users WHERE name = $1', ['Alice']);
  console.log('User:', result.rows[0]);

  await client.end();
}

async function poolExample() {
  console.log('\n=== Connection Pool Example ===\n');
  
  const pool = new Pool({
    host: 'localhost',
    database: 'myapp',
    max: 20
  });

  const results = await Promise.all([
    pool.query('SELECT COUNT(*) FROM users'),
    pool.query('SELECT * FROM users ORDER BY created_at DESC LIMIT 10'),
    pool.query('SELECT DISTINCT name FROM users')
  ]);

  console.log('Total users:', results[0].rows[0].count);
  console.log('Recent users:', results[1].rows.length);

  await pool.end();
}

async function transactionExample() {
  console.log('\n=== Transaction Example ===\n');
  
  const client = new Client({ host: 'localhost', database: 'myapp' });
  await client.connect();

  await client.transaction(async (client) => {
    await client.query(`
      CREATE TABLE IF NOT EXISTS accounts (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255),
        balance DECIMAL(10, 2)
      )
    `);

    await client.query('INSERT INTO accounts (name, balance) VALUES ($1, $2)', ['Alice', 1000]);
    await client.query('INSERT INTO accounts (name, balance) VALUES ($1, $2)', ['Bob', 500]);
    
    await client.query('UPDATE accounts SET balance = balance - $1 WHERE name = $2', [100, 'Alice']);
    await client.query('UPDATE accounts SET balance = balance + $1 WHERE name = $2', [100, 'Bob']);
  });

  const accounts = await client.query('SELECT * FROM accounts');
  console.log('Accounts after transaction:', accounts.rows);

  await client.end();
}

async function listenNotifyExample() {
  console.log('\n=== LISTEN/NOTIFY Example ===\n');
  
  const listener = new Client({ host: 'localhost', database: 'myapp' });
  const notifier = new Client({ host: 'localhost', database: 'myapp' });

  await listener.connect();
  await notifier.connect();

  await listener.listen('events', (notification) => {
    console.log('Received notification:', notification);
  });

  await notifier.notify('events', 'Hello from PostgreSQL!');

  setTimeout(async () => {
    await listener.end();
    await notifier.end();
  }, 100);
}

async function main() {
  await basicExample();
  await poolExample();
  await transactionExample();
  await listenNotifyExample();
}

main().catch(console.error);
