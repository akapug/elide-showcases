import { Connection, Pool } from '../src';

describe('MySQL Advanced Tests', () => {
  let connection: Connection;

  beforeAll(async () => {
    connection = new Connection({
      host: 'localhost',
      user: 'root',
      database: 'test'
    });
    await connection.connect();
  });

  afterAll(async () => {
    await connection.end();
  });

  describe('Data Types', () => {
    beforeEach(async () => {
      await connection.query('DROP TABLE IF EXISTS data_types_test');
    });

    test('should handle integer types', async () => {
      await connection.query(`
        CREATE TABLE data_types_test (
          tinyint_col TINYINT,
          smallint_col SMALLINT,
          mediumint_col MEDIUMINT,
          int_col INT,
          bigint_col BIGINT
        )
      `);

      await connection.query(
        'INSERT INTO data_types_test VALUES (?, ?, ?, ?, ?)',
        [10, 1000, 100000, 1000000, 10000000000]
      );

      const [rows] = await connection.query('SELECT * FROM data_types_test');
      expect(rows[0].tinyint_col).toBe(10);
      expect(rows[0].int_col).toBe(1000000);
    });

    test('should handle string types', async () => {
      await connection.query(`
        CREATE TABLE data_types_test (
          varchar_col VARCHAR(255),
          text_col TEXT,
          char_col CHAR(10)
        )
      `);

      await connection.query(
        'INSERT INTO data_types_test VALUES (?, ?, ?)',
        ['Variable length', 'Long text content', 'Fixed']
      );

      const [rows] = await connection.query('SELECT * FROM data_types_test');
      expect(rows[0].varchar_col).toBe('Variable length');
      expect(rows[0].text_col).toBe('Long text content');
    });

    test('should handle date and time types', async () => {
      await connection.query(`
        CREATE TABLE data_types_test (
          date_col DATE,
          time_col TIME,
          datetime_col DATETIME,
          timestamp_col TIMESTAMP
        )
      `);

      const now = new Date();
      await connection.query(
        'INSERT INTO data_types_test VALUES (?, ?, ?, ?)',
        [now, now, now, now]
      );

      const [rows] = await connection.query('SELECT * FROM data_types_test');
      expect(rows[0].datetime_col).toBeInstanceOf(Date);
    });

    test('should handle JSON type', async () => {
      await connection.query(`
        CREATE TABLE data_types_test (
          json_col JSON
        )
      `);

      const jsonData = { name: 'Test', value: 123, nested: { key: 'value' } };
      await connection.query(
        'INSERT INTO data_types_test VALUES (?)',
        [JSON.stringify(jsonData)]
      );

      const [rows] = await connection.query('SELECT * FROM data_types_test');
      const parsed = JSON.parse(rows[0].json_col);
      expect(parsed).toEqual(jsonData);
    });
  });

  describe('Advanced Queries', () => {
    beforeEach(async () => {
      await connection.query('DROP TABLE IF EXISTS test_data');
      await connection.query(`
        CREATE TABLE test_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          category VARCHAR(50),
          value DECIMAL(10, 2),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);

      for (let i = 0; i < 100; i++) {
        await connection.query(
          'INSERT INTO test_data (category, value) VALUES (?, ?)',
          [['A', 'B', 'C'][i % 3], Math.random() * 1000]
        );
      }
    });

    test('should handle window functions', async () => {
      const [rows] = await connection.query(`
        SELECT
          category,
          value,
          ROW_NUMBER() OVER (PARTITION BY category ORDER BY value DESC) as \`rank\`,
          AVG(value) OVER (PARTITION BY category) as avg_value
        FROM test_data
        ORDER BY category, \`rank\`
        LIMIT 10
      `);

      expect(rows.length).toBeGreaterThan(0);
      expect(rows[0]).toHaveProperty('rank');
    });

    test('should handle CTEs', async () => {
      const [rows] = await connection.query(`
        WITH category_stats AS (
          SELECT
            category,
            COUNT(*) as count,
            AVG(value) as avg_value,
            MAX(value) as max_value
          FROM test_data
          GROUP BY category
        )
        SELECT * FROM category_stats
        WHERE avg_value > 400
        ORDER BY avg_value DESC
      `);

      expect(rows).toBeDefined();
    });

    test('should handle subqueries', async () => {
      const [rows] = await connection.query(`
        SELECT * FROM test_data
        WHERE value > (SELECT AVG(value) FROM test_data)
        ORDER BY value DESC
        LIMIT 10
      `);

      expect(rows.length).toBeGreaterThan(0);
    });
  });

  describe('Transactions', () => {
    beforeEach(async () => {
      await connection.query('DROP TABLE IF EXISTS accounts');
      await connection.query(`
        CREATE TABLE accounts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          balance DECIMAL(10, 2) NOT NULL
        )
      `);

      await connection.query('INSERT INTO accounts (name, balance) VALUES (?, ?)', ['Alice', 1000]);
      await connection.query('INSERT INTO accounts (name, balance) VALUES (?, ?)', ['Bob', 500]);
    });

    test('should handle transaction commit', async () => {
      await connection.beginTransaction();

      await connection.query('UPDATE accounts SET balance = balance - 100 WHERE name = ?', ['Alice']);
      await connection.query('UPDATE accounts SET balance = balance + 100 WHERE name = ?', ['Bob']);

      await connection.commit();

      const [alice] = await connection.query('SELECT balance FROM accounts WHERE name = ?', ['Alice']);
      const [bob] = await connection.query('SELECT balance FROM accounts WHERE name = ?', ['Bob']);

      expect(alice[0].balance).toBe(900);
      expect(bob[0].balance).toBe(600);
    });

    test('should handle transaction rollback', async () => {
      await connection.beginTransaction();

      await connection.query('UPDATE accounts SET balance = balance - 100 WHERE name = ?', ['Alice']);
      await connection.query('UPDATE accounts SET balance = balance + 100 WHERE name = ?', ['Bob']);

      await connection.rollback();

      const [alice] = await connection.query('SELECT balance FROM accounts WHERE name = ?', ['Alice']);
      const [bob] = await connection.query('SELECT balance FROM accounts WHERE name = ?', ['Bob']);

      expect(alice[0].balance).toBe(1000);
      expect(bob[0].balance).toBe(500);
    });
  });

  describe('Performance Features', () => {
    test('should handle batch operations', async () => {
      await connection.query('DROP TABLE IF EXISTS batch_test');
      await connection.query(`
        CREATE TABLE batch_test (
          id INT AUTO_INCREMENT PRIMARY KEY,
          value VARCHAR(100)
        )
      `);

      const values = Array.from({ length: 100 }, (_, i) => [`value${i}`]);
      const placeholders = values.map(() => '(?)').join(',');

      await connection.query(
        `INSERT INTO batch_test (value) VALUES ${placeholders}`,
        values.flat()
      );

      const [rows] = await connection.query('SELECT COUNT(*) as count FROM batch_test');
      expect(rows[0].count).toBe(100);
    });

    test('should handle EXPLAIN', async () => {
      await connection.query('DROP TABLE IF EXISTS explain_test');
      await connection.query(`
        CREATE TABLE explain_test (
          id INT AUTO_INCREMENT PRIMARY KEY,
          value INT,
          INDEX idx_value (value)
        )
      `);

      const [rows] = await connection.query('EXPLAIN SELECT * FROM explain_test WHERE value = 100');
      expect(rows).toBeDefined();
      expect(rows.length).toBeGreaterThan(0);
    });
  });
});
