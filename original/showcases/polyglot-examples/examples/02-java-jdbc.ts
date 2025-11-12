/**
 * Example 2: Using Java JDBC from TypeScript
 *
 * Demonstrates:
 * - Importing Java classes
 * - Using Java JDBC API
 * - Working with Java Collections
 * - Database operations from TypeScript
 *
 * Performance: ~1-2ms overhead per query (excluding actual DB time)
 */

// Import Java's polyglot API
const Java = Polyglot.import('java');

/**
 * Create an in-memory H2 database connection
 */
function createConnection() {
  console.log('Creating JDBC connection...');

  // Import Java classes
  const DriverManager = Java.type('java.sql.DriverManager');

  // Create in-memory H2 database
  // In production, use actual database URLs
  const url = 'jdbc:h2:mem:testdb';
  const connection = DriverManager.getConnection(url);

  console.log('✓ Connection established');
  return connection;
}

/**
 * Initialize database schema
 */
function initializeDatabase(connection: any) {
  console.log('\nInitializing database schema...');

  const statement = connection.createStatement();

  // Create users table
  statement.execute(`
    CREATE TABLE users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) NOT NULL,
      age INT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create orders table
  statement.execute(`
    CREATE TABLE orders (
      id INT PRIMARY KEY AUTO_INCREMENT,
      user_id INT,
      product VARCHAR(100),
      amount DECIMAL(10, 2),
      status VARCHAR(20),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  statement.close();
  console.log('✓ Schema created');
}

/**
 * Insert sample data using prepared statements
 */
function insertSampleData(connection: any) {
  console.log('\nInserting sample data...');

  // Use prepared statements for safety
  const userStmt = connection.prepareStatement(
    'INSERT INTO users (name, email, age) VALUES (?, ?, ?)'
  );

  const users = [
    ['Alice Johnson', 'alice@example.com', 28],
    ['Bob Smith', 'bob@example.com', 35],
    ['Carol White', 'carol@example.com', 42],
    ['David Brown', 'david@example.com', 31],
  ];

  for (const [name, email, age] of users) {
    userStmt.setString(1, name);
    userStmt.setString(2, email);
    userStmt.setInt(3, age);
    userStmt.executeUpdate();
  }

  userStmt.close();

  // Insert orders
  const orderStmt = connection.prepareStatement(
    'INSERT INTO orders (user_id, product, amount, status) VALUES (?, ?, ?, ?)'
  );

  const orders = [
    [1, 'Laptop', 999.99, 'completed'],
    [1, 'Mouse', 29.99, 'completed'],
    [2, 'Keyboard', 79.99, 'pending'],
    [3, 'Monitor', 299.99, 'completed'],
    [4, 'Webcam', 89.99, 'shipped'],
  ];

  for (const [userId, product, amount, status] of orders) {
    orderStmt.setInt(1, userId);
    orderStmt.setString(2, product);
    orderStmt.setDouble(3, amount);
    orderStmt.setString(4, status);
    orderStmt.executeUpdate();
  }

  orderStmt.close();
  console.log(`✓ Inserted ${users.length} users and ${orders.length} orders`);
}

/**
 * Query data and process results
 */
function queryData(connection: any) {
  console.log('\nQuerying data...');

  const start = Date.now();

  const statement = connection.createStatement();
  const resultSet = statement.executeQuery(`
    SELECT
      u.name,
      u.email,
      COUNT(o.id) as order_count,
      COALESCE(SUM(o.amount), 0) as total_spent
    FROM users u
    LEFT JOIN orders o ON u.id = o.user_id
    GROUP BY u.id, u.name, u.email
    ORDER BY total_spent DESC
  `);

  console.log('\nCustomer Report:');
  console.log('─'.repeat(70));
  console.log('Name\t\t\tEmail\t\t\t\tOrders\tTotal');
  console.log('─'.repeat(70));

  // Process result set
  const results = [];
  while (resultSet.next()) {
    const row = {
      name: resultSet.getString('name'),
      email: resultSet.getString('email'),
      orderCount: resultSet.getInt('order_count'),
      totalSpent: resultSet.getDouble('total_spent'),
    };
    results.push(row);

    console.log(
      `${row.name.padEnd(20)}\t${row.email.padEnd(20)}\t${row.orderCount}\t$${row.totalSpent.toFixed(2)}`
    );
  }

  resultSet.close();
  statement.close();

  const duration = Date.now() - start;
  console.log('─'.repeat(70));
  console.log(`Query time: ${duration}ms`);

  return results;
}

/**
 * Demonstrate transactions
 */
function demonstrateTransaction(connection: any) {
  console.log('\n\nDemonstrating transactions...');

  try {
    // Disable auto-commit for transaction
    connection.setAutoCommit(false);

    const stmt = connection.prepareStatement(
      'UPDATE orders SET status = ? WHERE status = ?'
    );
    stmt.setString(1, 'processing');
    stmt.setString(2, 'pending');

    const updated = stmt.executeUpdate();
    stmt.close();

    console.log(`Updated ${updated} orders`);

    // Commit transaction
    connection.commit();
    console.log('✓ Transaction committed');

    // Re-enable auto-commit
    connection.setAutoCommit(true);
  } catch (error) {
    console.error('Transaction failed, rolling back...');
    connection.rollback();
    throw error;
  }
}

/**
 * Use batch operations for efficiency
 */
function demonstrateBatch(connection: any) {
  console.log('\nDemonstrating batch operations...');

  const stmt = connection.prepareStatement(
    'INSERT INTO users (name, email, age) VALUES (?, ?, ?)'
  );

  // Add multiple operations to batch
  const batchUsers = [
    ['Emily Davis', 'emily@example.com', 26],
    ['Frank Miller', 'frank@example.com', 39],
    ['Grace Lee', 'grace@example.com', 33],
  ];

  for (const [name, email, age] of batchUsers) {
    stmt.setString(1, name);
    stmt.setString(2, email);
    stmt.setInt(3, age);
    stmt.addBatch();
  }

  const start = Date.now();
  const results = stmt.executeBatch();
  const duration = Date.now() - start;

  stmt.close();

  console.log(`✓ Batch inserted ${results.length} users in ${duration}ms`);
}

// Main execution
console.log('='.repeat(70));
console.log('Polyglot Example 2: Java JDBC from TypeScript');
console.log('='.repeat(70));

try {
  const connection = createConnection();

  initializeDatabase(connection);
  insertSampleData(connection);
  queryData(connection);
  demonstrateTransaction(connection);
  demonstrateBatch(connection);

  // Final query to show all changes
  console.log('\n\nFinal state:');
  queryData(connection);

  connection.close();
  console.log('\n✓ Example completed successfully!');
} catch (error) {
  console.error('Error:', error);
  console.log('\nNote: This example requires H2 database driver.');
  console.log('Add to dependencies or use another JDBC driver.');
}
