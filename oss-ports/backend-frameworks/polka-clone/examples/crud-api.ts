/**
 * CRUD API Example for Polka Clone
 *
 * Complete RESTful API with Create, Read, Update, Delete operations
 */

import polka from '../src/polka.ts';

const app = polka();

// ==================== IN-MEMORY DATABASE ====================

interface User {
  id: number;
  email: string;
  username: string;
  fullName: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

interface Post {
  id: number;
  userId: number;
  title: string;
  content: string;
  status: string;
  createdAt: string;
  updatedAt: string;
}

const users: User[] = [
  {
    id: 1,
    email: 'alice@example.com',
    username: 'alice',
    fullName: 'Alice Johnson',
    role: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

const posts: Post[] = [
  {
    id: 1,
    userId: 1,
    title: 'First Post',
    content: 'Hello World!',
    status: 'published',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  }
];

let nextUserId = 2;
let nextPostId = 2;

// ==================== USER CRUD ====================

// List users
app.get('/users', (req, res) => {
  const { role, search } = req.query;

  let filtered = users;

  if (role) {
    filtered = filtered.filter(u => u.role === role);
  }

  if (search) {
    filtered = filtered.filter(u =>
      u.username.includes(search) || u.fullName.includes(search)
    );
  }

  res.json({ users: filtered, count: filtered.length });
});

// Get user by ID
app.get('/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === parseInt(id));

  if (!user) {
    res.statusCode = 404;
    res.json({ error: 'User not found' });
    return;
  }

  res.json({ user });
});

// Create user
app.post('/users', (req, res) => {
  const { email, username, fullName, role = 'user' } = req.body || {};

  if (!email || !username) {
    res.statusCode = 400;
    res.json({ error: 'Email and username are required' });
    return;
  }

  if (users.some(u => u.email === email)) {
    res.statusCode = 409;
    res.json({ error: 'Email already exists' });
    return;
  }

  const user: User = {
    id: nextUserId++,
    email,
    username,
    fullName: fullName || '',
    role,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  users.push(user);

  res.statusCode = 201;
  res.json({ message: 'User created', user });
});

// Update user
app.put('/users/:id', (req, res) => {
  const { id } = req.params;
  const user = users.find(u => u.id === parseInt(id));

  if (!user) {
    res.statusCode = 404;
    res.json({ error: 'User not found' });
    return;
  }

  const { email, username, fullName, role } = req.body || {};

  if (email) user.email = email;
  if (username) user.username = username;
  if (fullName) user.fullName = fullName;
  if (role) user.role = role;

  user.updatedAt = new Date().toISOString();

  res.json({ message: 'User updated', user });
});

// Delete user
app.delete('/users/:id', (req, res) => {
  const { id } = req.params;
  const index = users.findIndex(u => u.id === parseInt(id));

  if (index === -1) {
    res.statusCode = 404;
    res.json({ error: 'User not found' });
    return;
  }

  users.splice(index, 1);

  res.statusCode = 204;
  res.end();
});

// ==================== POST CRUD ====================

// List posts
app.get('/posts', (req, res) => {
  const { status, userId } = req.query;

  let filtered = posts;

  if (status) {
    filtered = filtered.filter(p => p.status === status);
  }

  if (userId) {
    filtered = filtered.filter(p => p.userId === parseInt(userId));
  }

  res.json({ posts: filtered, count: filtered.length });
});

// Get post by ID
app.get('/posts/:id', (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === parseInt(id));

  if (!post) {
    res.statusCode = 404;
    res.json({ error: 'Post not found' });
    return;
  }

  res.json({ post });
});

// Create post
app.post('/posts', (req, res) => {
  const { userId, title, content, status = 'draft' } = req.body || {};

  if (!userId || !title || !content) {
    res.statusCode = 400;
    res.json({ error: 'userId, title, and content are required' });
    return;
  }

  const post: Post = {
    id: nextPostId++,
    userId,
    title,
    content,
    status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  posts.push(post);

  res.statusCode = 201;
  res.json({ message: 'Post created', post });
});

// Update post
app.put('/posts/:id', (req, res) => {
  const { id } = req.params;
  const post = posts.find(p => p.id === parseInt(id));

  if (!post) {
    res.statusCode = 404;
    res.json({ error: 'Post not found' });
    return;
  }

  const { title, content, status } = req.body || {};

  if (title) post.title = title;
  if (content) post.content = content;
  if (status) post.status = status;

  post.updatedAt = new Date().toISOString();

  res.json({ message: 'Post updated', post });
});

// Delete post
app.delete('/posts/:id', (req, res) => {
  const { id } = req.params;
  const index = posts.findIndex(p => p.id === parseInt(id));

  if (index === -1) {
    res.statusCode = 404;
    res.json({ error: 'Post not found' });
    return;
  }

  posts.splice(index, 1);

  res.statusCode = 204;
  res.end();
});

// ==================== STATS ====================

app.get('/stats', (req, res) => {
  res.json({
    users: {
      total: users.length,
      byRole: {
        admin: users.filter(u => u.role === 'admin').length,
        user: users.filter(u => u.role === 'user').length
      }
    },
    posts: {
      total: posts.length,
      published: posts.filter(p => p.status === 'published').length,
      draft: posts.filter(p => p.status === 'draft').length
    }
  });
});

// ==================== ROOT ====================

app.get('/', (req, res) => {
  res.json({
    message: 'Polka CRUD API',
    endpoints: {
      users: [
        'GET    /users - List users',
        'GET    /users/:id - Get user',
        'POST   /users - Create user',
        'PUT    /users/:id - Update user',
        'DELETE /users/:id - Delete user'
      ],
      posts: [
        'GET    /posts - List posts',
        'GET    /posts/:id - Get post',
        'POST   /posts - Create post',
        'PUT    /posts/:id - Update post',
        'DELETE /posts/:id - Delete post'
      ],
      other: [
        'GET    /stats - API statistics'
      ]
    }
  });
});

// ==================== START SERVER ====================

app.listen(3700, () => {
  console.log('\n📝 Polka CRUD API listening on port 3700\n');
  console.log('Endpoints:');
  console.log('  GET    /users - List users');
  console.log('  GET    /users/:id - Get user');
  console.log('  POST   /users - Create user');
  console.log('  PUT    /users/:id - Update user');
  console.log('  DELETE /users/:id - Delete user');
  console.log('  GET    /posts - List posts');
  console.log('  GET    /posts/:id - Get post');
  console.log('  POST   /posts - Create post');
  console.log('  PUT    /posts/:id - Update post');
  console.log('  DELETE /posts/:id - Delete post');
  console.log('  GET    /stats - Statistics\n');
  console.log('Examples:');
  console.log('  curl http://localhost:3700/users');
  console.log('  curl -X POST http://localhost:3700/users -d "{\\"email\\":\\"user@example.com\\",\\"username\\":\\"newuser\\"}"');
  console.log('  curl http://localhost:3700/stats\n');
});
