/**
 * Basic usage examples for @elide/better-sqlite3
 */

import Database from '../src';

// Create or open database
const db = new Database('example.db', {
  enableWAL: true,
  enableForeignKeys: true
});

console.log('Database opened:', db.info);

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    age INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
`);

console.log('Tables created');

// Insert users
const insertUser = db.prepare(`
  INSERT INTO users (name, email, age)
  VALUES (@name, @email, @age)
`);

const users = [
  { name: 'Alice Johnson', email: 'alice@example.com', age: 28 },
  { name: 'Bob Smith', email: 'bob@example.com', age: 35 },
  { name: 'Charlie Brown', email: 'charlie@example.com', age: 42 },
  { name: 'Diana Prince', email: 'diana@example.com', age: 31 }
];

console.log('\nInserting users...');
for (const user of users) {
  const result = insertUser.run(user);
  console.log(`Inserted ${user.name} with ID ${result.lastInsertRowid}`);
}

// Insert posts
const insertPost = db.prepare(`
  INSERT INTO posts (user_id, title, content)
  VALUES (?, ?, ?)
`);

const posts = [
  [1, 'Getting Started with SQLite', 'SQLite is a great embedded database...'],
  [1, 'Advanced SQL Techniques', 'Let me show you some advanced queries...'],
  [2, 'Performance Tips', 'Here are some ways to optimize your queries...'],
  [3, 'Database Design', 'Good database design is crucial...'],
  [4, 'Security Best Practices', 'Always sanitize your inputs...']
];

console.log('\nInserting posts...');
for (const post of posts) {
  insertPost.run(...post);
}

// Query all users
console.log('\n--- All Users ---');
const allUsers = db.prepare('SELECT * FROM users').all();
console.table(allUsers);

// Query single user
console.log('\n--- Single User ---');
const user = db.prepare('SELECT * FROM users WHERE id = ?').get(1);
console.log(user);

// Query with join
console.log('\n--- Users with Posts ---');
const usersWithPosts = db.prepare(`
  SELECT
    users.name,
    users.email,
    COUNT(posts.id) as post_count
  FROM users
  LEFT JOIN posts ON posts.user_id = users.id
  GROUP BY users.id
  ORDER BY post_count DESC
`).all();
console.table(usersWithPosts);

// Query posts with user info (expanded)
console.log('\n--- Posts with User Info (Expanded) ---');
const postsWithUsers = db.prepare(`
  SELECT
    posts.id as 'posts.id',
    posts.title as 'posts.title',
    users.id as 'users.id',
    users.name as 'users.name'
  FROM posts
  JOIN users ON users.id = posts.user_id
  LIMIT 3
`).expand().all();
console.log(JSON.stringify(postsWithUsers, null, 2));

// Update example
console.log('\n--- Update User ---');
const updateResult = db.run('UPDATE users SET age = ? WHERE name = ?', 29, 'Alice Johnson');
console.log(`Updated ${updateResult.changes} row(s)`);

// Delete example (using transaction)
console.log('\n--- Delete with Transaction ---');
const deleteUser = db.transaction((userId) => {
  db.run('DELETE FROM posts WHERE user_id = ?', userId);
  db.run('DELETE FROM users WHERE id = ?', userId);
});

try {
  deleteUser(4);
  console.log('User and posts deleted successfully');
} catch (error) {
  console.error('Delete failed:', error);
}

// Statistics
console.log('\n--- Database Statistics ---');
console.log('Total changes:', db.totalChanges);
console.log('Last insert rowid:', db.lastInsertRowid);
console.log('Memory usage:', db.stats.memory);

// Cleanup
db.close();
console.log('\nDatabase closed');
