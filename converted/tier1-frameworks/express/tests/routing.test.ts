/**
 * Routing Tests
 *
 * Tests for HTTP method routing (GET, POST, PUT, DELETE, PATCH, etc.)
 */

import express, { Request, Response, NextFunction } from '../src/index';
import * as http from 'http';

/**
 * Test helper - make HTTP request
 */
function request(method: string, path: string, port: number, body?: any): Promise<{ status: number, body: string, headers: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: body ? {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(JSON.stringify(body))
      } : {}
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
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

/**
 * Test 1: GET route
 */
async function testGetRoute() {
  const app = express();
  const port = 3001;

  app.get('/hello', (req: Request, res: Response) => {
    res.json({ message: 'Hello World' });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/hello', port);
    const data = JSON.parse(response.body);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (data.message !== 'Hello World') {
      throw new Error(`Expected "Hello World", got "${data.message}"`);
    }

    console.log('✓ Test 1: GET route works');
  } finally {
    server.close();
  }
}

/**
 * Test 2: POST route
 */
async function testPostRoute() {
  const app = express();
  const port = 3002;

  app.use(express.json());

  app.post('/users', (req: Request, res: Response) => {
    res.status(201).json({ id: 1, ...req.body });
  });

  const server = app.listen(port);

  try {
    const response = await request('POST', '/users', port, { name: 'John' });
    const data = JSON.parse(response.body);

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    if (data.name !== 'John' || data.id !== 1) {
      throw new Error(`Expected user object, got ${JSON.stringify(data)}`);
    }

    console.log('✓ Test 2: POST route works');
  } finally {
    server.close();
  }
}

/**
 * Test 3: PUT route
 */
async function testPutRoute() {
  const app = express();
  const port = 3003;

  app.use(express.json());

  app.put('/users/:id', (req: Request, res: Response) => {
    res.json({ id: req.params.id, ...req.body, updated: true });
  });

  const server = app.listen(port);

  try {
    const response = await request('PUT', '/users/123', port, { name: 'Jane' });
    const data = JSON.parse(response.body);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (data.id !== '123' || data.name !== 'Jane' || !data.updated) {
      throw new Error(`Expected updated user, got ${JSON.stringify(data)}`);
    }

    console.log('✓ Test 3: PUT route works');
  } finally {
    server.close();
  }
}

/**
 * Test 4: DELETE route
 */
async function testDeleteRoute() {
  const app = express();
  const port = 3004;

  app.delete('/users/:id', (req: Request, res: Response) => {
    res.json({ deleted: true, id: req.params.id });
  });

  const server = app.listen(port);

  try {
    const response = await request('DELETE', '/users/456', port);
    const data = JSON.parse(response.body);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (!data.deleted || data.id !== '456') {
      throw new Error(`Expected deleted response, got ${JSON.stringify(data)}`);
    }

    console.log('✓ Test 4: DELETE route works');
  } finally {
    server.close();
  }
}

/**
 * Test 5: PATCH route
 */
async function testPatchRoute() {
  const app = express();
  const port = 3005;

  app.use(express.json());

  app.patch('/users/:id', (req: Request, res: Response) => {
    res.json({ id: req.params.id, ...req.body, patched: true });
  });

  const server = app.listen(port);

  try {
    const response = await request('PATCH', '/users/789', port, { email: 'john@example.com' });
    const data = JSON.parse(response.body);

    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    if (data.id !== '789' || data.email !== 'john@example.com' || !data.patched) {
      throw new Error(`Expected patched user, got ${JSON.stringify(data)}`);
    }

    console.log('✓ Test 5: PATCH route works');
  } finally {
    server.close();
  }
}

/**
 * Test 6: Route with multiple parameters
 */
async function testMultipleParams() {
  const app = express();
  const port = 3006;

  app.get('/api/:version/users/:id', (req: Request, res: Response) => {
    res.json({
      version: req.params.version,
      userId: req.params.id
    });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/api/v2/users/999', port);
    const data = JSON.parse(response.body);

    if (data.version !== 'v2' || data.userId !== '999') {
      throw new Error(`Expected params v2 and 999, got ${JSON.stringify(data)}`);
    }

    console.log('✓ Test 6: Multiple route parameters work');
  } finally {
    server.close();
  }
}

/**
 * Test 7: Query string parsing
 */
async function testQueryString() {
  const app = express();
  const port = 3007;

  app.get('/search', (req: Request, res: Response) => {
    res.json({ query: req.query });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/search?q=test&limit=10', port);
    const data = JSON.parse(response.body);

    if (data.query.q !== 'test' || data.query.limit !== '10') {
      throw new Error(`Expected query params, got ${JSON.stringify(data)}`);
    }

    console.log('✓ Test 7: Query string parsing works');
  } finally {
    server.close();
  }
}

/**
 * Run all routing tests
 */
async function runRoutingTests() {
  console.log('\n=== Running Routing Tests ===\n');

  try {
    await testGetRoute();
    await testPostRoute();
    await testPutRoute();
    await testDeleteRoute();
    await testPatchRoute();
    await testMultipleParams();
    await testQueryString();

    console.log('\n✓ All routing tests passed!\n');
  } catch (err) {
    console.error('\n✗ Routing test failed:', err);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runRoutingTests();
}

export { runRoutingTests };
