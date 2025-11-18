/**
 * Error Handling Tests
 *
 * Tests for error handling middleware and error propagation
 */

import express, { Request, Response, NextFunction } from '../src/index';
import * as http from 'http';

/**
 * Test helper - make HTTP request
 */
function request(method: string, path: string, port: number): Promise<{ status: number, body: string, headers: any }> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port,
      path,
      method
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
 * Test 14: Error middleware catches thrown errors
 */
async function testErrorCatching() {
  const app = express();
  const port = 3014;

  app.get('/error', (req, res, next) => {
    throw new Error('Test error');
  });

  // Error handling middleware
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(500).json({ error: err.message });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/error', port);

    if (response.status !== 500) {
      throw new Error(`Expected status 500, got ${response.status}`);
    }

    const data = JSON.parse(response.body);
    if (data.error !== 'Test error') {
      throw new Error(`Expected error message, got ${data.error}`);
    }

    console.log('✓ Test 14: Error middleware catches errors');
  } finally {
    server.close();
  }
}

/**
 * Test 15: next(err) propagates error
 */
async function testNextError() {
  const app = express();
  const port = 3015;

  app.get('/fail', (req, res, next) => {
    next(new Error('Custom error'));
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({ caught: true, message: err.message });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/fail', port);
    const data = JSON.parse(response.body);

    if (!data.caught || data.message !== 'Custom error') {
      throw new Error(`Error not propagated correctly`);
    }

    console.log('✓ Test 15: next(err) propagates errors');
  } finally {
    server.close();
  }
}

/**
 * Test 16: Custom error status codes
 */
async function testCustomErrorStatus() {
  const app = express();
  const port = 3016;

  app.get('/notfound', (req, res, next) => {
    const err: any = new Error('Resource not found');
    err.status = 404;
    next(err);
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    res.status(err.status || 500).json({ error: err.message });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/notfound', port);

    if (response.status !== 404) {
      throw new Error(`Expected status 404, got ${response.status}`);
    }

    console.log('✓ Test 16: Custom error status codes work');
  } finally {
    server.close();
  }
}

/**
 * Test 17: Multiple error handlers
 */
async function testMultipleErrorHandlers() {
  const app = express();
  const port = 3017;
  const log: string[] = [];

  app.get('/multi', (req, res, next) => {
    next(new Error('Multi error'));
  });

  // First error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    log.push('handler1');
    next(err); // Pass to next error handler
  });

  // Second error handler
  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    log.push('handler2');
    res.status(500).json({ handlers: log, error: err.message });
  });

  const server = app.listen(port);

  try {
    const response = await request('GET', '/multi', port);
    const data = JSON.parse(response.body);

    if (data.handlers.join(',') !== 'handler1,handler2') {
      throw new Error(`Error handlers didn't execute in order`);
    }

    console.log('✓ Test 17: Multiple error handlers work');
  } finally {
    server.close();
  }
}

/**
 * Run all error handling tests
 */
async function runErrorHandlingTests() {
  console.log('\n=== Running Error Handling Tests ===\n');

  try {
    await testErrorCatching();
    await testNextError();
    await testCustomErrorStatus();
    await testMultipleErrorHandlers();

    console.log('\n✓ All error handling tests passed!\n');
  } catch (err) {
    console.error('\n✗ Error handling test failed:', err);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  runErrorHandlingTests();
}

export { runErrorHandlingTests };
