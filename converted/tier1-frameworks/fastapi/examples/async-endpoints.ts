/**
 * Async Endpoints Example
 *
 * Demonstrates async/await request handling in FastAPI on Elide.
 */

import FastAPI from '../src/fastapi';

const app = new FastAPI({
  title: 'Async API',
  description: 'API demonstrating async operations',
  version: '1.0.0',
});

// Mock database
const mockDB = {
  async query(sql: string): Promise<any[]> {
    // Simulate database latency
    await new Promise(resolve => setTimeout(resolve, 50));
    return [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
    ];
  },

  async get(id: number): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 30));
    return { id, name: `Item ${id}`, created_at: new Date() };
  },

  async create(data: any): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 40));
    return { id: Math.floor(Math.random() * 1000), ...data };
  },
};

// Mock external API
const externalAPI = {
  async fetchData(endpoint: string): Promise<any> {
    await new Promise(resolve => setTimeout(resolve, 100));
    return {
      endpoint,
      data: { message: 'External API response' },
      timestamp: new Date().toISOString(),
    };
  },
};

// Async database query
app.get('/items', async () => {
  const items = await mockDB.query('SELECT * FROM items');
  return {
    items,
    count: items.length,
  };
}, {
  summary: 'Get items (async database query)',
  tags: ['Items'],
});

// Async get single item
app.get('/items/{id}', async (req) => {
  const id = parseInt(req.params.id);
  const item = await mockDB.get(id);
  return item;
}, {
  summary: 'Get item by ID (async)',
  tags: ['Items'],
});

// Async create item
app.post('/items', async (req) => {
  const item = await mockDB.create(req.body);
  return item;
}, {
  summary: 'Create item (async)',
  tags: ['Items'],
  status_code: 201,
});

// Parallel async operations
app.get('/dashboard', async () => {
  const start = Date.now();

  // Execute multiple async operations in parallel
  const [users, items, stats] = await Promise.all([
    mockDB.query('SELECT * FROM users'),
    mockDB.query('SELECT * FROM items'),
    Promise.resolve({ total_requests: 1234, uptime: 86400 }),
  ]);

  const duration = Date.now() - start;

  return {
    users: users.length,
    items: items.length,
    stats,
    query_time_ms: duration,
  };
}, {
  summary: 'Dashboard with parallel queries',
  tags: ['Dashboard'],
});

// Async external API call
app.get('/external/{endpoint}', async (req) => {
  const endpoint = req.params.endpoint;
  const data = await externalAPI.fetchData(endpoint);
  return data;
}, {
  summary: 'Fetch from external API',
  tags: ['External'],
});

// Async with timeout
app.get('/timeout-test', async () => {
  const timeout = (ms: number) =>
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    );

  const operation = async () => {
    await new Promise(resolve => setTimeout(resolve, 50));
    return { success: true };
  };

  try {
    const result = await Promise.race([
      operation(),
      timeout(5000), // 5 second timeout
    ]);
    return result;
  } catch (err: any) {
    throw {
      status_code: 504,
      detail: err.message,
    };
  }
}, {
  summary: 'Async operation with timeout',
  tags: ['Testing'],
});

// Async retry logic
app.get('/retry-test', async () => {
  let attempts = 0;
  const maxRetries = 3;

  const unreliableOperation = async () => {
    attempts++;
    if (attempts < 3) {
      throw new Error('Temporary failure');
    }
    return { success: true, attempts };
  };

  for (let i = 0; i < maxRetries; i++) {
    try {
      const result = await unreliableOperation();
      return result;
    } catch (err) {
      if (i === maxRetries - 1) {
        throw {
          status_code: 500,
          detail: 'Operation failed after retries',
        };
      }
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
}, {
  summary: 'Async operation with retry logic',
  tags: ['Testing'],
});

// Async generator (streaming)
app.get('/stream-data', async () => {
  async function* generateData() {
    for (let i = 0; i < 5; i++) {
      await new Promise(resolve => setTimeout(resolve, 50));
      yield { item: i, timestamp: new Date().toISOString() };
    }
  }

  const items = [];
  for await (const item of generateData()) {
    items.push(item);
  }

  return { items };
}, {
  summary: 'Streamed data collection',
  tags: ['Streaming'],
});

// Async error handling
app.get('/error-test', async () => {
  // Simulate async error
  await new Promise(resolve => setTimeout(resolve, 10));
  throw new Error('Async error occurred');
}, {
  summary: 'Async error handling test',
  tags: ['Testing'],
});

// Async batch processing
app.post('/batch-process', async (req) => {
  const items = req.body.items || [];

  const processItem = async (item: any) => {
    await new Promise(resolve => setTimeout(resolve, 20));
    return {
      ...item,
      processed: true,
      processed_at: new Date().toISOString(),
    };
  };

  // Process all items in parallel
  const processed = await Promise.all(
    items.map((item: any) => processItem(item))
  );

  return {
    total: items.length,
    processed: processed.length,
    items: processed,
  };
}, {
  summary: 'Batch process items asynchronously',
  tags: ['Batch'],
});

// Start server
if (require.main === module) {
  const PORT = 8002;
  app.listen(PORT, () => {
    console.log(`Async API running at http://localhost:${PORT}`);
    console.log('All endpoints use async/await for non-blocking operations');
    console.log();
    console.log('Try these endpoints:');
    console.log(`  GET  http://localhost:${PORT}/items`);
    console.log(`  GET  http://localhost:${PORT}/dashboard`);
    console.log(`  POST http://localhost:${PORT}/batch-process`);
    console.log();
    console.log(`API docs at http://localhost:${PORT}/docs`);
  });
}

export default app;
