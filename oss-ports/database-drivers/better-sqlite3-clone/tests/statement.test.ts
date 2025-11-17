/**
 * Statement tests for @elide/better-sqlite3
 */

import Database from '../src';

describe('Statement', () => {
  let db: Database;

  beforeEach(() => {
    db = new Database(':memory:');
    db.exec(`
      CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE,
        age INTEGER
      )
    `);
  });

  afterEach(() => {
    db.close();
  });

  describe('run', () => {
    test('should execute INSERT statement', () => {
      const stmt = db.prepare('INSERT INTO users (name, email, age) VALUES (?, ?, ?)');
      const result = stmt.run('Alice', 'alice@example.com', 28);

      expect(result.changes).toBe(1);
      expect(result.lastInsertRowid).toBe(1);

      stmt.finalize();
    });

    test('should execute with named parameters', () => {
      const stmt = db.prepare('INSERT INTO users (name, email, age) VALUES (@name, @email, @age)');
      const result = stmt.run({ name: 'Bob', email: 'bob@example.com', age: 35 });

      expect(result.changes).toBe(1);
      stmt.finalize();
    });

    test('should execute UPDATE statement', () => {
      db.run('INSERT INTO users (name, email) VALUES (?, ?)', 'Alice', 'alice@example.com');

      const stmt = db.prepare('UPDATE users SET age = ? WHERE name = ?');
      const result = stmt.run(28, 'Alice');

      expect(result.changes).toBe(1);
      stmt.finalize();
    });
  });

  describe('get', () => {
    beforeEach(() => {
      db.exec(`
        INSERT INTO users (name, email, age) VALUES
          ('Alice', 'alice@example.com', 28),
          ('Bob', 'bob@example.com', 35),
          ('Charlie', 'charlie@example.com', 42)
      `);
    });

    test('should return first row', () => {
      const stmt = db.prepare('SELECT * FROM users WHERE name = ?');
      const user = stmt.get('Bob');

      expect(user).toHaveProperty('name', 'Bob');
      expect(user).toHaveProperty('age', 35);

      stmt.finalize();
    });

    test('should return undefined when no match', () => {
      const stmt = db.prepare('SELECT * FROM users WHERE name = ?');
      const user = stmt.get('Nonexistent');

      expect(user).toBeUndefined();

      stmt.finalize();
    });
  });

  describe('all', () => {
    beforeEach(() => {
      db.exec(`
        INSERT INTO users (name, email, age) VALUES
          ('Alice', 'alice@example.com', 28),
          ('Bob', 'bob@example.com', 35),
          ('Charlie', 'charlie@example.com', 42)
      `);
    });

    test('should return all rows', () => {
      const stmt = db.prepare('SELECT * FROM users ORDER BY name');
      const users = stmt.all();

      expect(users).toHaveLength(3);
      expect(users[0]).toHaveProperty('name', 'Alice');
      expect(users[2]).toHaveProperty('name', 'Charlie');

      stmt.finalize();
    });

    test('should return filtered rows', () => {
      const stmt = db.prepare('SELECT * FROM users WHERE age > ?');
      const users = stmt.all(30);

      expect(users).toHaveLength(2);

      stmt.finalize();
    });

    test('should return empty array when no match', () => {
      const stmt = db.prepare('SELECT * FROM users WHERE age > ?');
      const users = stmt.all(100);

      expect(users).toHaveLength(0);

      stmt.finalize();
    });
  });

  describe('iterate', () => {
    beforeEach(() => {
      db.exec(`
        INSERT INTO users (name, email, age) VALUES
          ('Alice', 'alice@example.com', 28),
          ('Bob', 'bob@example.com', 35),
          ('Charlie', 'charlie@example.com', 42)
      `);
    });

    test('should iterate over rows', () => {
      const stmt = db.prepare('SELECT * FROM users ORDER BY name');
      const names: string[] = [];

      for (const user of stmt.iterate()) {
        names.push((user as any).name);
      }

      expect(names).toEqual(['Alice', 'Bob', 'Charlie']);

      stmt.finalize();
    });

    test('should support early break', () => {
      const stmt = db.prepare('SELECT * FROM users ORDER BY name');
      const names: string[] = [];

      for (const user of stmt.iterate()) {
        names.push((user as any).name);
        if (names.length === 2) break;
      }

      expect(names).toHaveLength(2);

      stmt.finalize();
    });
  });

  describe('pluck', () => {
    beforeEach(() => {
      db.exec(`
        INSERT INTO users (name, email, age) VALUES
          ('Alice', 'alice@example.com', 28),
          ('Bob', 'bob@example.com', 35)
      `);
    });

    test('should return only first column', () => {
      const stmt = db.prepare('SELECT name FROM users ORDER BY name');
      const names = stmt.pluck().all();

      expect(names).toEqual(['Alice', 'Bob']);

      stmt.finalize();
    });
  });

  describe('raw', () => {
    beforeEach(() => {
      db.exec(`
        INSERT INTO users (name, email, age) VALUES
          ('Alice', 'alice@example.com', 28)
      `);
    });

    test('should return rows as arrays', () => {
      const stmt = db.prepare('SELECT name, age FROM users');
      const rows = stmt.raw().all();

      expect(Array.isArray(rows[0])).toBe(true);
      expect(rows[0]).toEqual(['Alice', 28]);

      stmt.finalize();
    });
  });

  describe('expand', () => {
    beforeEach(() => {
      db.exec(`
        CREATE TABLE posts (
          id INTEGER PRIMARY KEY,
          user_id INTEGER,
          title TEXT,
          FOREIGN KEY (user_id) REFERENCES users(id)
        );

        INSERT INTO users (name, email) VALUES ('Alice', 'alice@example.com');
        INSERT INTO posts (user_id, title) VALUES (1, 'Hello World');
      `);
    });

    test('should expand joined rows', () => {
      const stmt = db.prepare(`
        SELECT
          users.name as 'users.name',
          posts.title as 'posts.title'
        FROM users
        JOIN posts ON posts.user_id = users.id
      `);

      const rows = stmt.expand().all();

      expect(rows[0]).toHaveProperty('users');
      expect(rows[0]).toHaveProperty('posts');
      expect((rows[0] as any).users.name).toBe('Alice');
      expect((rows[0] as any).posts.title).toBe('Hello World');

      stmt.finalize();
    });
  });

  describe('finalize', () => {
    test('should finalize statement', () => {
      const stmt = db.prepare('SELECT * FROM users');
      expect(stmt.finalized).toBe(false);

      stmt.finalize();
      expect(stmt.finalized).toBe(true);
    });

    test('should throw error when using finalized statement', () => {
      const stmt = db.prepare('SELECT * FROM users');
      stmt.finalize();

      expect(() => stmt.all()).toThrow();
    });
  });
});
