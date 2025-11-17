import mysql from '../src';

async function main() {
  console.log('=== MySQL Connection Pool Example ===\n');

  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    database: 'test',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      price DECIMAL(10, 2) NOT NULL,
      category VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('Pool statistics:');
  console.log('Total connections:', pool.poolSize);
  console.log('Idle connections:', pool.idleSize);
  console.log('Queue size:', pool.queueSize);

  console.log('\n--- Parallel Inserts ---');
  const products = [
    ['Laptop', 999.99, 'Electronics'],
    ['Mouse', 29.99, 'Accessories'],
    ['Keyboard', 79.99, 'Accessories'],
    ['Monitor', 299.99, 'Electronics'],
    ['Desk', 399.99, 'Furniture']
  ];

  const insertPromises = products.map(product =>
    pool.query('INSERT INTO products (name, price, category) VALUES (?, ?, ?)', product)
  );

  await Promise.all(insertPromises);
  console.log(`Inserted ${products.length} products in parallel`);

  console.log('\n--- Query with Pool ---');
  const [rows] = await pool.query('SELECT * FROM products WHERE category = ?', ['Electronics']);
  console.log(`Found ${rows.length} electronics products`);

  console.log('\n--- Concurrent Operations ---');
  const operations = [
    pool.query('SELECT COUNT(*) as count FROM products'),
    pool.query('SELECT AVG(price) as avg_price FROM products'),
    pool.query('SELECT category, COUNT(*) as count FROM products GROUP BY category')
  ];

  const results = await Promise.all(operations);
  console.log('Total products:', results[0][0][0].count);
  console.log('Average price:', results[1][0][0].avg_price);
  console.log('Products by category:', results[2][0]);

  await pool.end();
  console.log('\nPool closed');
}

main().catch(console.error);
