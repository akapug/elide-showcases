/**
 * Integration Tests
 *
 * End-to-end tests for complex scenarios and edge cases
 */

import express, { Request, Response, NextFunction } from '../src/index';
import * as http from 'http';

/**
 * Test helper - make HTTP request
 */
function request(method: string, path: string, port: number, headers?: any, body?: any): Promise<{ status: number, body: string, headers: any }> {
  return new Promise((resolve, reject) => {
    const bodyStr = body ? JSON.stringify(body) : '';
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: {
        ...headers,
        ...(body ? {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(bodyStr)
        } : {})
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode!,
          body: data,
          headers: res.headers
        });
      });
    });

    req.on('error', reject);

    if (body) {
      req.write(bodyStr);
    }

    req.end();
  });
}

/**
 * Test 25: Complete REST API
 */
async function testRestAPI() {
  const app = express();
  const port = 3025;

  app.use(express.json());

  // In-memory database
  const users: any[] = [];
  let nextId = 1;

  // Routes
  app.get('/api/users', (req, res) => {
    res.json(users);
  });

  app.post('/api/users', (req, res) => {
    const user = { id: nextId++, ...req.body };
    users.push(user);
    res.status(201).json(user);
  });

  app.get('/api/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  });

  app.put('/api/users/:id', (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    Object.assign(user, req.body);
    res.json(user);
  });

  app.delete('/api/users/:id', (req, res) => {
    const index = users.findIndex(u => u.id === parseInt(req.params.id));
    if (index === -1) {
      return res.status(404).json({ error: 'User not found' });
    }
    users.splice(index, 1);
    res.status(204).send('');
  });

  const server = app.listen(port);

  try {
    // Create user
    const r1 = await request('POST', '/api/users', port, {}, { name: 'Alice' });
    const user1 = JSON.parse(r1.body);
    if (r1.status !== 201 || !user1.id) {
      throw new Error('Failed to create user');
    }

    // Get all users
    const r2 = await request('GET', '/api/users', port);
    const allUsers = JSON.parse(r2.body);
    if (allUsers.length !== 1) {
      throw new Error('Failed to get users');
    }

    // Get single user
    const r3 = await request('GET', `/api/users/${user1.id}`, port);
    const getUser = JSON.parse(r3.body);
    if (getUser.name !== 'Alice') {
      throw new Error('Failed to get single user');
    }

    // Update user
    const r4 = await request('PUT', `/api/users/${user1.id}`, port, {}, { name: 'Alice Updated' });
    const updatedUser = JSON.parse(r4.body);
    if (updatedUser.name !== 'Alice Updated') {
      throw new Error('Failed to update user');
    }

    // Delete user
    const r5 = await request('DELETE', `/api/users/${user1.id}`, port);
    if (r5.status !== 204) {
      throw new Error('Failed to delete user');
    }

    // Verify deletion
    const r6 = await request('GET', '/api/users', port);
    const finalUsers = JSON.parse(r6.body);
    if (finalUsers.length !== 0) {
      throw new Error('User not deleted');
    }

    console.log('✓ Test 25: Complete REST API works');
  } finally {
    server.close();
  }
}

/**
 * Test 26: Router mounting
 */
async function testRouterMounting() {
  const app = express();
  const port = 3026;

  // Create sub-router
  const apiRouter = express.Router();

  apiRouter.get('/status', (req, res) => {
    res.json({ status: 'OK' });
  });

  apiRouter.get('/version', (req, res) => {
    res.json({ version: '1.0.0' });
  });

  // Mount router
  app.use('/api', apiRouter);

  const server = app.listen(port);

  try {
    const r1 = await request('GET', '/api/status', port);
    const data1 = JSON.parse(r1.body);
    if (data1.status !== 'OK') {
      throw new Error('Router mounting failed');
    }

    const r2 = await request('GET', '/api/version', port);
    const data2 = JSON.parse(r2.body);
    if (data2.version !== '1.0.0') {
      throw new Error('Router mounting failed');
    }

    console.log('✓ Test 26: Router mounting works');
  } finally {
    server.close();
  }
}

/**
 * Test 27: app.route() chaining
 */
async function testRouteChaining() {
  const app = express();
  const port = 3027;

  app.use(express.json());

  app.route('/book')
    .get((req, res) => {
      res.json({ method: 'GET' });
    })
    .post((req, res) => {
      res.json({ method: 'POST', data: req.body });
    })
    .put((req, res) => {
      res.json({ method: 'PUT' });
    });

  const server = app.listen(port);

  try {
    const r1 = await request('GET', '/book', port);
    const d1 = JSON.parse(r1.body);
    if (d1.method !== 'GET') {
      throw new Error('GET route in chain failed');
    }

    const r2 = await request('POST', '/book', port, {}, { title: 'Test' });
    const d2 = JSON.parse(r2.body);
    if (d2.method !== 'POST' || d2.data.title !== 'Test') {
      throw new Error('POST route in chain failed');
    }

    const r3 = await request('PUT', '/book', port);
    const d3 = JSON.parse(r3.body);
    if (d3.method !== 'PUT') {
      throw new Error('PUT route in chain failed');
    }

    console.log('✓ Test 27: app.route() chaining works');
  } finally {
    server.close();
  }
}

/**
 * Test 28: 404 handling
 */
async function testNotFound() {
  const app = express();
  const port = 3028;

  app.get('/exists', (req, res) => {
    res.send('OK');
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/does-not-exist', port);

    if (response.status !== 404) {
      throw new Error(`Expected 404, got ${response.status}`);
    }

    console.log('✓ Test 28: 404 handling works');
  } finally {
    server.close();
  }
}

/**
 * Run all integration tests
 */
async function runIntegrationTests() {
  console.log('\n=== Running Integration Tests ===\n');

  try {
    await testRestAPI();
    await testRouterMounting();
    await testRouteChaining();
    await testNotFound();

    console.log('\n✓ All integration tests passed!\n');
  } catch (err) {
    console.error('\n✗ Integration test failed:', err);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runIntegrationTests();
}

export { runIntegrationTests };
