/**
 * FastAPI Async Tests
 * Tests for async request handling and concurrent operations.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import FastAPI from '../src/fastapi';

describe('FastAPI Async Operations', () => {
  let app: FastAPI;

  beforeEach(() => {
    app = new FastAPI({ title: 'Async Test API' });
  });

  it('should handle async route handler', async () => {
    app.get('/async', async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
      return { message: 'async response' };
    });

    const routes = app.getRoutes();
    const route = routes.get('/async')?.get('GET');
    expect(route).toBeDefined();

    if (route) {
      const result = await route.handler({});
      expect(result).toEqual({ message: 'async response' });
    }
  });

  it('should handle multiple async operations', async () => {
    app.get('/multi-async', async () => {
      const [result1, result2, result3] = await Promise.all([
        Promise.resolve({ data: 1 }),
        Promise.resolve({ data: 2 }),
        Promise.resolve({ data: 3 }),
      ]);

      return {
        results: [result1, result2, result3],
      };
    });

    const routes = app.getRoutes();
    const route = routes.get('/multi-async')?.get('GET');

    if (route) {
      const result = await route.handler({});
      expect(result.results).toHaveLength(3);
    }
  });

  it('should handle async errors', async () => {
    app.get('/async-error', async () => {
      throw new Error('Async error');
    });

    const routes = app.getRoutes();
    const route = routes.get('/async-error')?.get('GET');

    if (route) {
      await expect(route.handler({})).rejects.toThrow('Async error');
    }
  });

  it('should handle database async operations', async () => {
    const mockDB = {
      query: async (sql: string) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return [{ id: 1, name: 'Test' }];
      },
    };

    app.get('/db-query', async () => {
      const results = await mockDB.query('SELECT * FROM users');
      return { users: results };
    });

    const routes = app.getRoutes();
    const route = routes.get('/db-query')?.get('GET');

    if (route) {
      const result = await route.handler({});
      expect(result.users).toHaveLength(1);
      expect(result.users[0].name).toBe('Test');
    }
  });

  it('should handle async file operations', async () => {
    const mockFS = {
      readFile: async (path: string) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return 'file contents';
      },
    };

    app.get('/read-file', async () => {
      const contents = await mockFS.readFile('/path/to/file.txt');
      return { contents };
    });

    const routes = app.getRoutes();
    const route = routes.get('/read-file')?.get('GET');

    if (route) {
      const result = await route.handler({});
      expect(result.contents).toBe('file contents');
    }
  });

  it('should handle async HTTP requests', async () => {
    const mockHTTP = {
      get: async (url: string) => {
        await new Promise(resolve => setTimeout(resolve, 5));
        return { data: { message: 'external API response' } };
      },
    };

    app.get('/external-api', async () => {
      const response = await mockHTTP.get('https://api.example.com/data');
      return response.data;
    });

    const routes = app.getRoutes();
    const route = routes.get('/external-api')?.get('GET');

    if (route) {
      const result = await route.handler({});
      expect(result.message).toBe('external API response');
    }
  });

  it('should handle concurrent requests', async () => {
    let requestCount = 0;

    app.get('/concurrent', async () => {
      requestCount++;
      await new Promise(resolve => setTimeout(resolve, 10));
      return { request: requestCount };
    });

    const routes = app.getRoutes();
    const route = routes.get('/concurrent')?.get('GET');

    if (route) {
      // Simulate concurrent requests
      const results = await Promise.all([
        route.handler({}),
        route.handler({}),
        route.handler({}),
      ]);

      expect(results).toHaveLength(3);
      expect(requestCount).toBe(3);
    }
  });

  it('should handle async generators (streaming)', async () => {
    async function* generateData() {
      for (let i = 0; i < 3; i++) {
        await new Promise(resolve => setTimeout(resolve, 5));
        yield { item: i };
      }
    }

    app.get('/stream', async () => {
      const items = [];
      for await (const item of generateData()) {
        items.push(item);
      }
      return { items };
    });

    const routes = app.getRoutes();
    const route = routes.get('/stream')?.get('GET');

    if (route) {
      const result = await route.handler({});
      expect(result.items).toHaveLength(3);
    }
  });

  it('should handle Promise.race for timeouts', async () => {
    const timeout = (ms: number) =>
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), ms)
      );

    const operation = async () => {
      await new Promise(resolve => setTimeout(resolve, 5));
      return { data: 'success' };
    };

    app.get('/with-timeout', async () => {
      return await Promise.race([
        operation(),
        timeout(100),
      ]);
    });

    const routes = app.getRoutes();
    const route = routes.get('/with-timeout')?.get('GET');

    if (route) {
      const result = await route.handler({});
      expect(result.data).toBe('success');
    }
  });

  it('should handle async retry logic', async () => {
    let attempts = 0;

    const unreliableOperation = async () => {
      attempts++;
      if (attempts < 3) {
        throw new Error('Temporary failure');
      }
      return { success: true };
    };

    const retryOperation = async (maxRetries: number) => {
      for (let i = 0; i < maxRetries; i++) {
        try {
          return await unreliableOperation();
        } catch (err) {
          if (i === maxRetries - 1) throw err;
          await new Promise(resolve => setTimeout(resolve, 10));
        }
      }
    };

    app.get('/retry', async () => {
      return await retryOperation(5);
    });

    const routes = app.getRoutes();
    const route = routes.get('/retry')?.get('GET');

    if (route) {
      const result = await route.handler({});
      expect(result.success).toBe(true);
      expect(attempts).toBe(3);
    }
  });
});
