import { Connection } from '../src';

describe('MySQL Connection Tests', () => {
  let connection: Connection;

  beforeEach(async () => {
    connection = new Connection({
      host: 'localhost',
      user: 'root',
      database: 'test'
    });
    await connection.connect();
  });

  afterEach(async () => {
    await connection.end();
  });

  describe('Basic Queries', () => {
    test('should execute SELECT query', async () => {
      const [rows] = await connection.query('SELECT 1 as value');
      expect(rows[0].value).toBe(1);
    });

    test('should execute INSERT query', async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_insert (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255)
        )
      `);

      const [result] = await connection.query(
        'INSERT INTO test_insert (name) VALUES (?)',
        ['Test']
      );

      expect(result.affectedRows).toBe(1);
      expect(result.insertId).toBeGreaterThan(0);
    });

    test('should execute UPDATE query', async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_update (
          id INT AUTO_INCREMENT PRIMARY KEY,
          value INT
        )
      `);

      await connection.query('INSERT INTO test_update (value) VALUES (10)');
      const [result] = await connection.query('UPDATE test_update SET value = 20');

      expect(result.affectedRows).toBe(1);
    });

    test('should execute DELETE query', async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_delete (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255)
        )
      `);

      await connection.query('INSERT INTO test_delete (name) VALUES (?)', ['Test']);
      const [result] = await connection.query('DELETE FROM test_delete');

      expect(result.affectedRows).toBe(1);
    });
  });

  describe('Transactions', () => {
    test('should commit transaction', async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_transaction (
          id INT AUTO_INCREMENT PRIMARY KEY,
          value INT
        )
      `);

      await connection.beginTransaction();
      await connection.query('INSERT INTO test_transaction (value) VALUES (1)');
      await connection.query('INSERT INTO test_transaction (value) VALUES (2)');
      await connection.commit();

      const [rows] = await connection.query('SELECT COUNT(*) as count FROM test_transaction');
      expect(rows[0].count).toBe(2);
    });

    test('should rollback transaction', async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_rollback (
          id INT AUTO_INCREMENT PRIMARY KEY,
          value INT
        )
      `);

      await connection.beginTransaction();
      await connection.query('INSERT INTO test_rollback (value) VALUES (1)');
      await connection.rollback();

      const [rows] = await connection.query('SELECT COUNT(*) as count FROM test_rollback');
      expect(rows[0].count).toBe(0);
    });
  });

  describe('Prepared Statements', () => {
    test('should execute prepared statement', async () => {
      await connection.query(`
        CREATE TEMPORARY TABLE test_prepared (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(255)
        )
      `);

      const stmt = await connection.prepare('INSERT INTO test_prepared (name) VALUES (?)');
      await stmt.execute(['Test1']);
      await stmt.execute(['Test2']);

      const [rows] = await connection.query('SELECT COUNT(*) as count FROM test_prepared');
      expect(rows[0].count).toBe(2);
    });
  });
});
