import { Pool } from '../src';

async function main() {
  console.log('=== PostgreSQL Connection Pool Example ===\n');

  const pool = new Pool({
    host: 'localhost',
    database: 'myapp',
    user: 'postgres',
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS tasks (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      completed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Pool statistics:');
  console.log('Total connections:', pool.totalCount);
  console.log('Idle connections:', pool.idleCount);
  console.log('Waiting requests:', pool.waitingCount);

  console.log('\n--- Parallel Queries ---');
  const queries = Array.from({ length: 10 }, (_, i) =>
    pool.query('INSERT INTO tasks (title) VALUES ($1)', [`Task ${i + 1}`])
  );

  await Promise.all(queries);
  console.log('Inserted 10 tasks in parallel');

  console.log('\n--- Query with Pool ---');
  const result = await pool.query('SELECT * FROM tasks ORDER BY id LIMIT 5');
  console.log(`Retrieved ${result.rows.length} tasks`);

  console.log('\n--- Concurrent Operations ---');
  const operations = [
    pool.query('SELECT COUNT(*) as count FROM tasks'),
    pool.query('SELECT * FROM tasks WHERE completed = FALSE'),
    pool.query('UPDATE tasks SET completed = TRUE WHERE id = $1', [1]),
    pool.query('DELETE FROM tasks WHERE id > $1', [100])
  ];

  const results = await Promise.all(operations);
  console.log('Count:', results[0].rows[0].count);
  console.log('Incomplete tasks:', results[1].rows.length);

  await pool.end();
  console.log('\nPool closed');
}

main().catch(console.error);
