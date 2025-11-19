import Database from '../src';

describe('Integration Tests', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(':memory:');
  });

  afterEach(() => {
    db.close();
  });

  describe('Complex Queries', () => {
    test('should handle complex joins', () => {
      db.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
        CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER, title TEXT);
        CREATE TABLE comments (id INTEGER PRIMARY KEY, post_id INTEGER, text TEXT);
      `);

      db.run('INSERT INTO users (name) VALUES (?)', 'Alice');
      db.run('INSERT INTO posts (user_id, title) VALUES (?, ?)', 1, 'Post 1');
      db.run('INSERT INTO comments (post_id, text) VALUES (?, ?)', 1, 'Comment 1');

      const result = db.prepare(`
        SELECT users.name, posts.title, comments.text
        FROM users
        JOIN posts ON posts.user_id = users.id
        JOIN comments ON comments.post_id = posts.id
      `).all();

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        name: 'Alice',
        title: 'Post 1',
        text: 'Comment 1'
      });
    });

    test('should handle subqueries', () => {
      db.exec(`
        CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
        INSERT INTO products VALUES (1, 'Product A', 10), (2, 'Product B', 20), (3, 'Product C', 15);
      `);

      const result = db.prepare(`
        SELECT * FROM products
        WHERE price > (SELECT AVG(price) FROM products)
      `).all();

      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Product B');
    });

    test('should handle window functions', () => {
      db.exec(`
        CREATE TABLE sales (id INTEGER PRIMARY KEY, product TEXT, amount REAL);
        INSERT INTO sales VALUES
          (1, 'A', 100), (2, 'B', 200), (3, 'A', 150),
          (4, 'B', 180), (5, 'A', 120), (6, 'B', 220);
      `);

      const result = db.prepare(`
        SELECT
          product,
          amount,
          SUM(amount) OVER (PARTITION BY product) as total,
          AVG(amount) OVER (PARTITION BY product) as avg,
          ROW_NUMBER() OVER (PARTITION BY product ORDER BY amount DESC) as rank
        FROM sales
        ORDER BY product, rank
      `).all();

      expect(result).toHaveLength(6);
      expect(result[0].product).toBe('A');
      expect(result[0].rank).toBe(1);
    });

    test('should handle CTEs', () => {
      db.exec(`
        CREATE TABLE employees (id INTEGER PRIMARY KEY, name TEXT, manager_id INTEGER, salary REAL);
        INSERT INTO employees VALUES
          (1, 'CEO', NULL, 200000),
          (2, 'VP', 1, 150000),
          (3, 'Manager', 2, 100000),
          (4, 'Employee', 3, 50000);
      `);

      const result = db.prepare(`
        WITH RECURSIVE org_chart AS (
          SELECT id, name, manager_id, salary, 0 as level
          FROM employees WHERE manager_id IS NULL
          UNION ALL
          SELECT e.id, e.name, e.manager_id, e.salary, oc.level + 1
          FROM employees e
          JOIN org_chart oc ON e.manager_id = oc.id
        )
        SELECT * FROM org_chart ORDER BY level, name
      `).all();

      expect(result).toHaveLength(4);
      expect(result[0].level).toBe(0);
      expect(result[3].level).toBe(3);
    });
  });

  describe('Performance', () => {
    test('should handle large datasets efficiently', () => {
      db.exec('CREATE TABLE large_table (id INTEGER PRIMARY KEY, value TEXT)');

      const insert = db.prepare('INSERT INTO large_table (value) VALUES (?)');
      const insertMany = db.transaction((n: number) => {
        for (let i = 0; i < n; i++) {
          insert.run(`value${i}`);
        }
      });

      const start = Date.now();
      insertMany(10000);
      const duration = Date.now() - start;

      expect(duration).toBeLessThan(1000);

      const count = db.prepare('SELECT COUNT(*) as count FROM large_table').get() as any;
      expect(count.count).toBe(10000);
    });

    test('should benefit from indexes', () => {
      db.exec(`
        CREATE TABLE indexed_table (id INTEGER PRIMARY KEY, name TEXT, category TEXT);
        CREATE INDEX idx_category ON indexed_table(category);
      `);

      const insert = db.prepare('INSERT INTO indexed_table (name, category) VALUES (?, ?)');
      const insertMany = db.transaction((n: number) => {
        for (let i = 0; i < n; i++) {
          insert.run(`name${i}`, ['A', 'B', 'C'][i % 3]);
        }
      });

      insertMany(10000);

      const start = Date.now();
      const results = db.prepare('SELECT * FROM indexed_table WHERE category = ?').all('A');
      const duration = Date.now() - start;

      expect(results.length).toBeGreaterThan(3000);
      expect(duration).toBeLessThan(50);
    });
  });

  describe('Edge Cases', () => {
    test('should handle NULL values correctly', () => {
      db.exec('CREATE TABLE nullable (id INTEGER PRIMARY KEY, value TEXT)');
      db.run('INSERT INTO nullable (value) VALUES (NULL)');

      const result = db.prepare('SELECT * FROM nullable').get();
      expect(result).toHaveProperty('value', null);
    });

    test('should handle empty strings', () => {
      db.exec('CREATE TABLE strings (id INTEGER PRIMARY KEY, value TEXT)');
      db.run('INSERT INTO strings (value) VALUES (?)', '');

      const result = db.prepare('SELECT * FROM strings').get() as any;
      expect(result.value).toBe('');
    });

    test('should handle special characters', () => {
      db.exec('CREATE TABLE special (id INTEGER PRIMARY KEY, value TEXT)');
      const specialChars = "Hello 'world' with \"quotes\" and \\backslashes\\";
      db.run('INSERT INTO special (value) VALUES (?)', specialChars);

      const result = db.prepare('SELECT * FROM special').get() as any;
      expect(result.value).toBe(specialChars);
    });

    test('should handle large integers', () => {
      db.exec('CREATE TABLE big_ints (id INTEGER PRIMARY KEY, value INTEGER)');
      const bigInt = Number.MAX_SAFE_INTEGER;
      db.run('INSERT INTO big_ints (value) VALUES (?)', bigInt);

      const result = db.prepare('SELECT * FROM big_ints').get() as any;
      expect(result.value).toBe(bigInt);
    });
  });

  describe('Concurrent Operations', () => {
    test('should handle multiple readers', async () => {
      db.exec(`
        CREATE TABLE concurrent (id INTEGER PRIMARY KEY, value TEXT);
        INSERT INTO concurrent (value) VALUES ('test1'), ('test2'), ('test3');
      `);

      const reads = Array.from({ length: 10 }, () =>
        Promise.resolve(db.prepare('SELECT * FROM concurrent').all())
      );

      const results = await Promise.all(reads);
      results.forEach(result => {
        expect(result).toHaveLength(3);
      });
    });

    test('should serialize writes in transactions', () => {
      db.exec('CREATE TABLE writes (id INTEGER PRIMARY KEY, value TEXT)');

      const write = db.transaction((value: string) => {
        db.run('INSERT INTO writes (value) VALUES (?)', value);
      });

      write('a');
      write('b');
      write('c');

      const results = db.prepare('SELECT * FROM writes ORDER BY id').all();
      expect(results).toHaveLength(3);
      expect(results.map((r: any) => r.value)).toEqual(['a', 'b', 'c']);
    });
  });
});
