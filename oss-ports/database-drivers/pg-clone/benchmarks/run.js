const { Client, Pool } = require('../dist');
const { performance } = require('perf_hooks');

async function benchmark(name, fn, iterations = 1000) {
  const start = performance.now();
  await fn(iterations);
  const end = performance.now();
  const duration = end - start;
  const opsPerSec = (iterations / duration) * 1000;
  console.log(`${name}: ${opsPerSec.toFixed(0)} ops/sec (${duration.toFixed(2)}ms for ${iterations} ops)`);
}

async function main() {
  const client = new Client({
    host: 'localhost',
    database: 'benchmark',
    user: 'postgres'
  });

  await client.connect();

  await client.query('DROP TABLE IF EXISTS test_table');
  await client.query(`
    CREATE TABLE test_table (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      value INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('=== PostgreSQL Benchmarks ===\n');

  // Insert benchmarks
  console.log('--- Insert Operations ---');
  await benchmark('INSERT (sequential)', async (n) => {
    for (let i = 0; i < n; i++) {
      await client.query('INSERT INTO test_table (name, value) VALUES ($1, $2)', [`name${i}`, i]);
    }
  }, 1000);

  // Select benchmarks
  console.log('\n--- Select Operations ---');
  await benchmark('SELECT by ID', async (n) => {
    for (let i = 0; i < n; i++) {
      await client.query('SELECT * FROM test_table WHERE id = $1', [i % 1000]);
    }
  }, 1000);

  await benchmark('SELECT with LIMIT', async (n) => {
    for (let i = 0; i < n; i++) {
      await client.query('SELECT * FROM test_table LIMIT 100');
    }
  }, 100);

  // Update benchmarks
  console.log('\n--- Update Operations ---');
  await benchmark('UPDATE by ID', async (n) => {
    for (let i = 0; i < n; i++) {
      await client.query('UPDATE test_table SET value = $1 WHERE id = $2', [i * 2, i % 1000]);
    }
  }, 1000);

  // Transaction benchmarks
  console.log('\n--- Transaction Operations ---');
  await benchmark('Transaction (3 operations)', async (n) => {
    for (let i = 0; i < n; i++) {
      await client.begin();
      try {
        await client.query('INSERT INTO test_table (name, value) VALUES ($1, $2)', [`tx${i}`, i]);
        await client.query('UPDATE test_table SET value = value + 1 WHERE id = $1', [i % 1000]);
        await client.query('SELECT * FROM test_table WHERE id = $1', [i % 1000]);
        await client.commit();
      } catch (error) {
        await client.rollback();
        throw error;
      }
    }
  }, 100);

  // Prepared statement benchmarks
  console.log('\n--- Prepared Statement Operations ---');
  const stmt = await client.prepare('get_by_id', 'SELECT * FROM test_table WHERE id = $1', 1);
  
  await benchmark('Prepared SELECT', async (n) => {
    for (let i = 0; i < n; i++) {
      await client.execute('get_by_id', [i % 1000]);
    }
  }, 1000);

  await client.end();
  console.log('\n=== Benchmarks Complete ===');
}

main().catch(console.error);
