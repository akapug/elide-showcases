const mysql = require('../dist');
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
  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'benchmark'
  });

  await connection.connect();

  await connection.query('DROP TABLE IF EXISTS test_table');
  await connection.query(`
    CREATE TABLE test_table (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      value INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('=== MySQL Benchmarks ===\n');

  // Insert benchmarks
  console.log('--- Insert Operations ---');
  await benchmark('INSERT (sequential)', async (n) => {
    for (let i = 0; i < n; i++) {
      await connection.query('INSERT INTO test_table (name, value) VALUES (?, ?)', [`name${i}`, i]);
    }
  }, 1000);

  // Select benchmarks
  console.log('\n--- Select Operations ---');
  await benchmark('SELECT by ID', async (n) => {
    for (let i = 0; i < n; i++) {
      await connection.query('SELECT * FROM test_table WHERE id = ?', [i % 1000]);
    }
  }, 1000);

  // Update benchmarks
  console.log('\n--- Update Operations ---');
  await benchmark('UPDATE by ID', async (n) => {
    for (let i = 0; i < n; i++) {
      await connection.query('UPDATE test_table SET value = ? WHERE id = ?', [i * 2, i % 1000]);
    }
  }, 1000);

  // Execute (prepared) benchmarks
  console.log('\n--- Prepared Statement Operations ---');
  const stmt = await connection.prepare('SELECT * FROM test_table WHERE id = ?');
  
  await benchmark('Prepared SELECT', async (n) => {
    for (let i = 0; i < n; i++) {
      await stmt.execute([i % 1000]);
    }
  }, 1000);

  await connection.end();
  console.log('\n=== Benchmarks Complete ===');
}

main().catch(console.error);
