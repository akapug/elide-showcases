/**
 * RESTful API Example
 *
 * A complete CRUD API with in-memory database
 */

import express from '../src/index';

const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory database
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const users: User[] = [];
let nextId = 1;

// Routes

// List all users
app.get('/api/users', (req, res) => {
  res.json({
    total: users.length,
    users
  });
});

// Get user by ID
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// Create new user
app.post('/api/users', (req, res) => {
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'name and email are required' });
  }

  const user: User = {
    id: nextId++,
    name,
    email,
    createdAt: new Date().toISOString()
  };

  users.push(user);

  res.status(201).json(user);
});

// Update user
app.put('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, email } = req.body;

  if (name) user.name = name;
  if (email) user.email = email;

  res.json(user);
});

// Partially update user
app.patch('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  Object.assign(user, req.body);

  res.json(user);
});

// Delete user
app.delete('/api/users/:id', (req, res) => {
  const index = users.findIndex(u => u.id === parseInt(req.params.id));

  if (index === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  users.splice(index, 1);

  res.status(204).send('');
});

// Search users
app.get('/api/users/search', (req, res) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'q parameter is required' });
  }

  const query = q.toString().toLowerCase();
  const results = users.filter(u =>
    u.name.toLowerCase().includes(query) ||
    u.email.toLowerCase().includes(query)
  );

  res.json({
    query: q,
    total: results.length,
    results
  });
});

// API documentation
app.get('/', (req, res) => {
  res.json({
    title: 'User API',
    version: '1.0.0',
    endpoints: {
      'GET /api/users': 'List all users',
      'GET /api/users/:id': 'Get user by ID',
      'POST /api/users': 'Create new user',
      'PUT /api/users/:id': 'Update user',
      'PATCH /api/users/:id': 'Partially update user',
      'DELETE /api/users/:id': 'Delete user',
      'GET /api/users/search?q=term': 'Search users'
    }
  });
});

// Start server
const PORT = 3002;
app.listen(PORT, () => {
  console.log(`\n✓ REST API running on http://localhost:${PORT}`);
  console.log('\nTry these commands:');
  console.log(`  curl http://localhost:${PORT}/`);
  console.log(`  curl -X POST http://localhost:${PORT}/api/users -H "Content-Type: application/json" -d '{"name":"John","email":"john@example.com"}'`);
  console.log(`  curl http://localhost:${PORT}/api/users`);
  console.log(`  curl http://localhost:${PORT}/api/users/1`);
  console.log(`  curl -X PUT http://localhost:${PORT}/api/users/1 -H "Content-Type: application/json" -d '{"name":"John Doe"}'`);
  console.log(`  curl -X DELETE http://localhost:${PORT}/api/users/1`);
  console.log('');
});
