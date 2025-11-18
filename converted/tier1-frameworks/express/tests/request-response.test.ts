/**
 * Request/Response API Tests
 *
 * Tests for req/res helper methods and properties
 */

import express, { Request, Response } from '../src/index';
import * as http from 'http';

/**
 * Test helper - make HTTP request
 */
function request(method: string, path: string, port: number, headers?: any): Promise<{ status: number, body: string, headers: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method,
      headers: headers || {}
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
    req.end();
  });
}

/**
 * Test 18: res.json() sends JSON
 */
async function testResJson() {
  const app = express();
  const port = 3018;

  app.get('/json', (req, res) => {
    res.json({ success: true, data: [1, 2, 3] });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/json', port);
    const data = JSON.parse(response.body);

    if (!data.success || data.data.length !== 3) {
      throw new Error('JSON response incorrect');
    }

    if (!response.headers['content-type']?.includes('application/json')) {
      throw new Error('Content-Type should be application/json');
    }

    console.log('✓ Test 18: res.json() works');
  } finally {
    server.close();
  }
}

/**
 * Test 19: res.status() sets status code
 */
async function testResStatus() {
  const app = express();
  const port = 3019;

  app.get('/created', (req, res) => {
    res.status(201).json({ created: true });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/created', port);

    if (response.status !== 201) {
      throw new Error(`Expected status 201, got ${response.status}`);
    }

    console.log('✓ Test 19: res.status() works');
  } finally {
    server.close();
  }
}

/**
 * Test 20: res.send() handles different types
 */
async function testResSend() {
  const app = express();
  const port = 3020;

  app.get('/string', (req, res) => res.send('Hello'));
  app.get('/number', (req, res) => res.send(123));
  app.get('/object', (req, res) => res.send({ test: true }));

  const server = app.listen(port);

  try {
    const r1 = await request('GET', '/string', port);
    if (r1.body !== 'Hello') {
      throw new Error('String send failed');
    }

    const r2 = await request('GET', '/number', port);
    if (r2.body !== '123') {
      throw new Error('Number send failed');
    }

    const r3 = await request('GET', '/object', port);
    const obj = JSON.parse(r3.body);
    if (!obj.test) {
      throw new Error('Object send failed');
    }

    console.log('✓ Test 20: res.send() handles multiple types');
  } finally {
    server.close();
  }
}

/**
 * Test 21: req.get() retrieves headers
 */
async function testReqGet() {
  const app = express();
  const port = 3021;

  app.get('/headers', (req, res) => {
    res.json({
      userAgent: req.get('user-agent'),
      contentType: req.get('content-type')
    });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/headers', port, {
      'User-Agent': 'TestAgent/1.0',
      'Content-Type': 'text/plain'
    });

    const data = JSON.parse(response.body);

    if (data.userAgent !== 'TestAgent/1.0') {
      throw new Error('Failed to get user-agent header');
    }

    console.log('✓ Test 21: req.get() retrieves headers');
  } finally {
    server.close();
  }
}

/**
 * Test 22: res.redirect() redirects
 */
async function testResRedirect() {
  const app = express();
  const port = 3022;

  app.get('/old', (req, res) => {
    res.redirect('/new');
  });

  app.get('/new', (req, res) => {
    res.send('New location');
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/old', port);

    if (response.status !== 302) {
      throw new Error(`Expected redirect status 302, got ${response.status}`);
    }

    if (response.headers.location !== '/new') {
      throw new Error(`Expected Location header /new, got ${response.headers.location}`);
    }

    console.log('✓ Test 22: res.redirect() works');
  } finally {
    server.close();
  }
}

/**
 * Test 23: res.set() sets headers
 */
async function testResSet() {
  const app = express();
  const port = 3023;

  app.get('/custom-header', (req, res) => {
    res.set('X-Custom-Header', 'CustomValue');
    res.send('OK');
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/custom-header', port);

    if (response.headers['x-custom-header'] !== 'CustomValue') {
      throw new Error('Custom header not set');
    }

    console.log('✓ Test 23: res.set() sets headers');
  } finally {
    server.close();
  }
}

/**
 * Test 24: req.params extracts route parameters
 */
async function testReqParams() {
  const app = express();
  const port = 3024;

  app.get('/users/:userId/posts/:postId', (req, res) => {
    res.json({
      userId: req.params.userId,
      postId: req.params.postId
    });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/users/42/posts/99', port);
    const data = JSON.parse(response.body);

    if (data.userId !== '42' || data.postId !== '99') {
      throw new Error('Route parameters not extracted correctly');
    }

    console.log('✓ Test 24: req.params works');
  } finally {
    server.close();
  }
}

/**
 * Run all request/response tests
 */
async function runRequestResponseTests() {
  console.log('\n=== Running Request/Response API Tests ===\n');

  try {
    await testResJson();
    await testResStatus();
    await testResSend();
    await testReqGet();
    await testResRedirect();
    await testResSet();
    await testReqParams();

    console.log('\n✓ All request/response tests passed!\n');
  } catch (err) {
    console.error('\n✗ Request/response test failed:', err);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runRequestResponseTests();
}

export { runRequestResponseTests };
