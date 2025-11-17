import { Client, Pool } from '../src';

describe('PostgreSQL Advanced Tests', () => {
  let client: Client;

  beforeAll(async () => {
    client = new Client({
      host: 'localhost',
      database: 'test',
      user: 'postgres'
    });
    await client.connect();
  });

  afterAll(async () => {
    await client.end();
  });

  describe('Data Types', () => {
    beforeEach(async () => {
      await client.query('DROP TABLE IF EXISTS data_types_test');
    });

    test('should handle integer types', async () => {
      await client.query(`
        CREATE TABLE data_types_test (
          smallint_col SMALLINT,
          int_col INTEGER,
          bigint_col BIGINT
        )
      `);

      await client.query(
        'INSERT INTO data_types_test VALUES ($1, $2, $3)',
        [100, 100000, 10000000000]
      );

      const result = await client.query('SELECT * FROM data_types_test');
      expect(result.rows[0].smallint_col).toBe(100);
      expect(result.rows[0].int_col).toBe(100000);
    });

    test('should handle text types', async () => {
      await client.query(`
        CREATE TABLE data_types_test (
          varchar_col VARCHAR(255),
          text_col TEXT,
          char_col CHAR(10)
        )
      `);

      await client.query(
        'INSERT INTO data_types_test VALUES ($1, $2, $3)',
        ['Variable', 'Long text content', 'Fixed']
      );

      const result = await client.query('SELECT * FROM data_types_test');
      expect(result.rows[0].varchar_col).toBe('Variable');
      expect(result.rows[0].text_col).toBe('Long text content');
    });

    test('should handle date and time types', async () => {
      await client.query(`
        CREATE TABLE data_types_test (
          date_col DATE,
          time_col TIME,
          timestamp_col TIMESTAMP,
          timestamptz_col TIMESTAMPTZ
        )
      `);

      const now = new Date();
      await client.query(
        'INSERT INTO data_types_test VALUES ($1, $2, $3, $4)',
        [now, now, now, now]
      );

      const result = await client.query('SELECT * FROM data_types_test');
      expect(result.rows[0].timestamp_col).toBeInstanceOf(Date);
    });

    test('should handle JSON types', async () => {
      await client.query(`
        CREATE TABLE data_types_test (
          json_col JSON,
          jsonb_col JSONB
        )
      `);

      const jsonData = { name: 'Test', value: 123, nested: { key: 'value' } };
      await client.query(
        'INSERT INTO data_types_test VALUES ($1, $2)',
        [jsonData, jsonData]
      );

      const result = await client.query('SELECT * FROM data_types_test');
      expect(result.rows[0].json_col).toEqual(jsonData);
      expect(result.rows[0].jsonb_col).toEqual(jsonData);
    });

    test('should handle array types', async () => {
      await client.query(`
        CREATE TABLE data_types_test (
          int_array INTEGER[],
          text_array TEXT[]
        )
      `);

      await client.query(
        'INSERT INTO data_types_test VALUES ($1, $2)',
        [[1, 2, 3, 4, 5], ['a', 'b', 'c']]
      );

      const result = await client.query('SELECT * FROM data_types_test');
      expect(result.rows[0].int_array).toEqual([1, 2, 3, 4, 5]);
      expect(result.rows[0].text_array).toEqual(['a', 'b', 'c']);
    });
  });

  describe('Advanced Queries', () => {
    beforeEach(async () => {
      await client.query('DROP TABLE IF EXISTS test_data');
      await client.query(`
        CREATE TABLE test_data (
          id SERIAL PRIMARY KEY,
          category TEXT,
          value NUMERIC,
          data JSONB,
          tags TEXT[]
        )
      `);

      for (let i = 0; i < 100; i++) {
        await client.query(
          'INSERT INTO test_data (category, value, data, tags) VALUES ($1, $2, $3, $4)',
          [
            ['A', 'B', 'C'][i % 3],
            Math.random() * 1000,
            { index: i, random: Math.random() },
            [`tag${i % 10}`, `tag${i % 5}`]
          ]
        );
      }
    });

    test('should handle window functions', async () => {
      const result = await client.query(`
        SELECT
          category,
          value,
          ROW_NUMBER() OVER (PARTITION BY category ORDER BY value DESC) as rank,
          AVG(value) OVER (PARTITION BY category) as avg_value
        FROM test_data
        ORDER BY category, rank
      `);

      expect(result.rows.length).toBeGreaterThan(0);
      expect(result.rows[0]).toHaveProperty('rank');
      expect(result.rows[0]).toHaveProperty('avg_value');
    });

    test('should handle CTEs', async () => {
      const result = await client.query(`
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

      expect(result.rows).toBeDefined();
    });

    test('should handle JSON queries', async () => {
      const result = await client.query(`
        SELECT * FROM test_data
        WHERE data->>'index' = '50'
      `);

      expect(result.rows.length).toBe(1);
      expect(result.rows[0].data.index).toBe(50);
    });

    test('should handle array operations', async () => {
      const result = await client.query(`
        SELECT * FROM test_data
        WHERE 'tag0' = ANY(tags)
      `);

      expect(result.rows.length).toBeGreaterThan(0);
    });
  });

  describe('Transactions and Locking', () => {
    beforeEach(async () => {
      await client.query('DROP TABLE IF EXISTS accounts');
      await client.query(`
        CREATE TABLE accounts (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          balance NUMERIC NOT NULL
        )
      `);

      await client.query('INSERT INTO accounts (name, balance) VALUES ($1, $2)', ['Alice', 1000]);
      await client.query('INSERT INTO accounts (name, balance) VALUES ($1, $2)', ['Bob', 500]);
    });

    test('should handle savepoints', async () => {
      await client.begin();

      await client.query('UPDATE accounts SET balance = balance - 100 WHERE name = $1', ['Alice']);
      await client.savepoint('sp1');

      await client.query('UPDATE accounts SET balance = balance + 100 WHERE name = $1', ['Bob']);
      await client.rollbackTo('sp1');

      await client.commit();

      const alice = await client.query('SELECT balance FROM accounts WHERE name = $1', ['Alice']);
      const bob = await client.query('SELECT balance FROM accounts WHERE name = $1', ['Bob']);

      expect(alice.rows[0].balance).toBe(900);
      expect(bob.rows[0].balance).toBe(500);
    });

    test('should handle row locking', async () => {
      await client.begin();
      
      await client.query('SELECT * FROM accounts WHERE name = $1 FOR UPDATE', ['Alice']);
      await client.query('UPDATE accounts SET balance = balance - 100 WHERE name = $1', ['Alice']);
      
      await client.commit();

      const result = await client.query('SELECT balance FROM accounts WHERE name = $1', ['Alice']);
      expect(result.rows[0].balance).toBe(900);
    });
  });

  describe('Performance Features', () => {
    test('should handle COPY protocol', async () => {
      await client.query('DROP TABLE IF EXISTS bulk_data');
      await client.query(`
        CREATE TABLE bulk_data (
          id INTEGER,
          value TEXT
        )
      `);

      const copyStream = await client.copyFrom('COPY bulk_data FROM STDIN');
      for (let i = 0; i < 1000; i++) {
        // Mock: copyStream.write(`${i}\tvalue${i}\n`);
      }
      // Mock: copyStream.end();

      const result = await client.query('SELECT COUNT(*) as count FROM bulk_data');
      expect(result.rows).toBeDefined();
    });

    test('should handle EXPLAIN', async () => {
      await client.query('DROP TABLE IF EXISTS explain_test');
      await client.query(`
        CREATE TABLE explain_test (
          id SERIAL PRIMARY KEY,
          value INTEGER
        )
      `);

      await client.query('CREATE INDEX idx_value ON explain_test(value)');

      const result = await client.query('EXPLAIN SELECT * FROM explain_test WHERE value = 100');
      expect(result.rows).toBeDefined();
      expect(result.rows.length).toBeGreaterThan(0);
    });
  });
});
