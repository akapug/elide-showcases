/**
 * RESTful Routing Example
 *
 * Demonstrates:
 * - RESTful API design
 * - CRUD operations
 * - Route parameters
 * - Different HTTP methods
 * - Request body parsing
 */

import { Sinatra } from '../server';

class RoutingApp extends Sinatra.Base {}

// In-memory data store
interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
}

const users: Map<number, User> = new Map([
  [1, { id: 1, name: 'Alice Smith', email: 'alice@example.com', createdAt: '2025-01-01T00:00:00Z' }],
  [2, { id: 2, name: 'Bob Jones', email: 'bob@example.com', createdAt: '2025-01-02T00:00:00Z' }],
  [3, { id: 3, name: 'Carol White', email: 'carol@example.com', createdAt: '2025-01-03T00:00:00Z' }],
]);

let nextId = 4;

// Configure
RoutingApp.before(function() {
  this.contentType('json');
});

// Root - API documentation
RoutingApp.get('/', function() {
  return {
    message: 'RESTful API Example',
    version: '1.0.0',
    endpoints: {
      'GET /': 'API documentation',
      'GET /users': 'List all users',
      'GET /users/:id': 'Get user by ID',
      'POST /users': 'Create new user',
      'PUT /users/:id': 'Update user',
      'DELETE /users/:id': 'Delete user',
      'GET /search?name=query': 'Search users by name'
    }
  };
});

// GET /users - List all users
RoutingApp.get('/users', function() {
  const limit = this.params.limit ? parseInt(this.params.limit) : undefined;
  const userArray = Array.from(users.values());

  return {
    total: userArray.length,
    limit: limit,
    users: limit ? userArray.slice(0, limit) : userArray
  };
});

// GET /users/:id - Get user by ID
RoutingApp.get('/users/:id', function() {
  const id = parseInt(this.params.id);
  const user = users.get(id);

  if (!user) {
    this.status(404);
    return { error: 'User not found' };
  }

  return { user };
});

// POST /users - Create new user
RoutingApp.post('/users', function() {
  let data: any = {};

  try {
    data = JSON.parse(this.request.body);
  } catch (e) {
    this.status(400);
    return { error: 'Invalid JSON in request body' };
  }

  const { name, email } = data;

  if (!name || !email) {
    this.status(400);
    return { error: 'Name and email are required' };
  }

  const newUser: User = {
    id: nextId++,
    name,
    email,
    createdAt: new Date().toISOString()
  };

  users.set(newUser.id, newUser);

  this.status(201);
  return { user: newUser };
});

// PUT /users/:id - Update user
RoutingApp.put('/users/:id', function() {
  const id = parseInt(this.params.id);
  const user = users.get(id);

  if (!user) {
    this.status(404);
    return { error: 'User not found' };
  }

  let data: any = {};

  try {
    data = JSON.parse(this.request.body);
  } catch (e) {
    this.status(400);
    return { error: 'Invalid JSON in request body' };
  }

  const { name, email } = data;

  if (name) user.name = name;
  if (email) user.email = email;

  users.set(id, user);

  return { user };
});

// DELETE /users/:id - Delete user
RoutingApp.delete('/users/:id', function() {
  const id = parseInt(this.params.id);

  if (!users.has(id)) {
    this.status(404);
    return { error: 'User not found' };
  }

  users.delete(id);

  this.status(204);
  return null;
});

// GET /search - Search users
RoutingApp.get('/search', function() {
  const nameQuery = (this.params.name || '').toLowerCase();

  const results = Array.from(users.values()).filter(user =>
    user.name.toLowerCase().includes(nameQuery) ||
    user.email.toLowerCase().includes(nameQuery)
  );

  return {
    query: nameQuery,
    count: results.length,
    results
  };
});

// Error handlers
RoutingApp.notFound(function(error) {
  return {
    error: 'Not Found',
    message: 'The requested endpoint does not exist',
    path: this.request.path
  };
});

RoutingApp.error(500, function(error) {
  return {
    error: 'Internal Server Error',
    message: error.message
  };
});

// Start server
RoutingApp.run({ port: 4569 });

console.log('✓ RESTful API server running on http://localhost:4569');
console.log('\n  Try these commands:');
console.log('  curl http://localhost:4569/');
console.log('  curl http://localhost:4569/users');
console.log('  curl http://localhost:4569/users/1');
console.log('  curl http://localhost:4569/users?limit=2');
console.log('  curl http://localhost:4569/search?name=alice');
console.log('  curl -X POST http://localhost:4569/users -H "Content-Type: application/json" -d \'{"name":"Dave","email":"dave@example.com"}\'');
console.log('  curl -X PUT http://localhost:4569/users/1 -H "Content-Type: application/json" -d \'{"name":"Alice Johnson"}\'');
console.log('  curl -X DELETE http://localhost:4569/users/3');
