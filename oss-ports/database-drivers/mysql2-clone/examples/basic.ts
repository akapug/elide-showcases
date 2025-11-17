import mysql from '../src';

async function main() {
  console.log('=== MySQL Basic Example ===\n');

  const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    database: 'test',
    password: ''
  });

  await connection.connect();
  console.log('Connected to MySQL');

  await connection.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      age INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('\n--- Insert Operations ---');
  const [insertResult] = await connection.query(
    'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
    ['Alice', 'alice@example.com', 28]
  );
  console.log('Inserted user ID:', insertResult.insertId);

  console.log('\n--- Select Operations ---');
  const [users] = await connection.query('SELECT * FROM users');
  console.log('Total users:', users.length);

  const [user] = await connection.query(
    'SELECT * FROM users WHERE name = ?',
    ['Alice']
  );
  console.log('Found user:', user[0]);

  console.log('\n--- Update Operations ---');
  await connection.query(
    'UPDATE users SET age = ? WHERE name = ?',
    [29, 'Alice']
  );
  console.log('Updated user age');

  console.log('\n--- Transaction Example ---');
  await connection.beginTransaction();
  try {
    await connection.query('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', ['Bob', 'bob@example.com', 35]);
    await connection.query('INSERT INTO users (name, email, age) VALUES (?, ?, ?)', ['Charlie', 'charlie@example.com', 42]);
    await connection.commit();
    console.log('Transaction committed successfully');
  } catch (error) {
    await connection.rollback();
    console.error('Transaction failed, rolled back');
  }

  console.log('\n--- Delete Operations ---');
  await connection.query('DELETE FROM users WHERE age > ?', [40]);
  console.log('Deleted older users');

  await connection.end();
  console.log('\nDisconnected from MySQL');
}

main().catch(console.error);
