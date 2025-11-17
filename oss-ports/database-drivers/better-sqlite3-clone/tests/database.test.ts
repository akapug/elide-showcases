/**
 * Database tests for @elide/better-sqlite3
 */

import Database from '../src';
import { existsSync, unlinkSync } from 'fs';

describe('Database', () => {
  const testDb = 'test.db';

  afterEach(() => {
    if (existsSync(testDb)) {
      unlinkSync(testDb);
    }
  });

  describe('constructor', () => {
    test('should create in-memory database', () => {
      const db = new Database(':memory:');
      expect(db.open).toBe(true);
      expect(db.info.memory).toBe(true);
      db.close();
    });

    test('should create file-based database', () => {
      const db = new Database(testDb);
      expect(db.open).toBe(true);
      expect(db.info.filename).toBe(testDb);
      db.close();
    });

    test('should accept options', () => {
      const db = new Database(':memory:', {
        enableWAL: true,
        enableForeignKeys: true,
        timeout: 10000
      });
      expect(db.open).toBe(true);
      db.close();
    });
  });

  describe('exec', () => {
    test('should execute SQL statements', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
      db.exec('INSERT INTO test (value) VALUES ("hello")');

      const result = db.prepare('SELECT * FROM test').get();
      expect(result).toHaveProperty('value', 'hello');
      db.close();
    });

    test('should execute multiple statements', () => {
      const db = new Database(':memory:');
      db.exec(`
        CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);
        CREATE TABLE posts (id INTEGER PRIMARY KEY, user_id INTEGER);
        INSERT INTO users (name) VALUES ('Alice');
      `);

      const user = db.prepare('SELECT * FROM users').get();
      expect(user).toHaveProperty('name', 'Alice');
      db.close();
    });
  });

  describe('prepare', () => {
    test('should prepare statement', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      const stmt = db.prepare('INSERT INTO test (value) VALUES (?)');
      expect(stmt).toBeDefined();
      expect(stmt.source).toContain('INSERT INTO test');

      stmt.finalize();
      db.close();
    });

    test('should prepare multiple statements', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      const insert = db.prepare('INSERT INTO test (value) VALUES (?)');
      const select = db.prepare('SELECT * FROM test WHERE id = ?');

      insert.run('test');
      const result = select.get(1);
      expect(result).toHaveProperty('value', 'test');

      insert.finalize();
      select.finalize();
      db.close();
    });
  });

  describe('transactions', () => {
    test('should execute transaction', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      const insert = db.prepare('INSERT INTO test (value) VALUES (?)');
      const insertMany = db.transaction((values: string[]) => {
        for (const value of values) {
          insert.run(value);
        }
      });

      insertMany(['a', 'b', 'c']);

      const count = db.prepare('SELECT COUNT(*) as count FROM test').get() as any;
      expect(count.count).toBe(3);

      db.close();
    });

    test('should rollback on error', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      const insert = db.prepare('INSERT INTO test (value) VALUES (?)');
      const insertWithError = db.transaction((values: string[]) => {
        for (const value of values) {
          insert.run(value);
        }
        throw new Error('Rollback');
      });

      expect(() => insertWithError(['a', 'b', 'c'])).toThrow('Rollback');

      const count = db.prepare('SELECT COUNT(*) as count FROM test').get() as any;
      expect(count.count).toBe(0);

      db.close();
    });
  });

  describe('query methods', () => {
    test('all() should return all rows', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
      db.exec('INSERT INTO test (value) VALUES ("a"), ("b"), ("c")');

      const rows = db.all('SELECT * FROM test ORDER BY id');
      expect(rows).toHaveLength(3);
      expect(rows[0]).toHaveProperty('value', 'a');

      db.close();
    });

    test('get() should return first row', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');
      db.exec('INSERT INTO test (value) VALUES ("a"), ("b"), ("c")');

      const row = db.get('SELECT * FROM test WHERE id = ?', 2);
      expect(row).toHaveProperty('value', 'b');

      db.close();
    });

    test('run() should execute without returning rows', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      const result = db.run('INSERT INTO test (value) VALUES (?)', 'test');
      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);

      db.close();
    });
  });

  describe('pragma', () => {
    test('should get pragma value', () => {
      const db = new Database(':memory:');
      const mode = db.pragma('journal_mode', { simple: true });
      expect(mode).toBeDefined();
      db.close();
    });

    test('should set pragma value', () => {
      const db = new Database(':memory:', { enableWAL: true });
      db.pragma('journal_mode = WAL');
      const mode = db.pragma('journal_mode', { simple: true });
      expect(mode).toBe('wal');
      db.close();
    });
  });

  describe('user-defined functions', () => {
    test('should register function', () => {
      const db = new Database(':memory:');
      db.function('add', (a: number, b: number) => a + b);

      const result = db.prepare('SELECT add(2, 3) as sum').get() as any;
      expect(result.sum).toBe(5);

      db.close();
    });

    test('should register deterministic function', () => {
      const db = new Database(':memory:');
      db.function('double', { deterministic: true }, (x: number) => x * 2);

      const result = db.prepare('SELECT double(5) as result').get() as any;
      expect(result.result).toBe(10);

      db.close();
    });
  });

  describe('properties', () => {
    test('should track changes', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      db.run('INSERT INTO test (value) VALUES (?)', 'test');
      expect(db.changes).toBeGreaterThan(0);

      db.close();
    });

    test('should track total changes', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      db.run('INSERT INTO test (value) VALUES (?)', 'a');
      db.run('INSERT INTO test (value) VALUES (?)', 'b');

      expect(db.totalChanges).toBeGreaterThanOrEqual(2);

      db.close();
    });

    test('should return last insert rowid', () => {
      const db = new Database(':memory:');
      db.exec('CREATE TABLE test (id INTEGER PRIMARY KEY, value TEXT)');

      db.run('INSERT INTO test (value) VALUES (?)', 'test');
      expect(db.lastInsertRowid).toBe(1);

      db.close();
    });
  });

  describe('close', () => {
    test('should close database', () => {
      const db = new Database(':memory:');
      expect(db.open).toBe(true);

      db.close();
      expect(db.open).toBe(false);
    });

    test('should throw error when using closed database', () => {
      const db = new Database(':memory:');
      db.close();

      expect(() => db.exec('SELECT 1')).toThrow();
    });
  });
});
