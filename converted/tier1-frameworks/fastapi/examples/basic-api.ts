/**
 * Basic FastAPI Example
 *
 * Demonstrates basic API creation with FastAPI on Elide.
 */

import FastAPI from '../src/fastapi';

const app = new FastAPI({
  title: 'Basic API',
  description: 'A simple FastAPI application',
  version: '1.0.0',
});

// Simple GET endpoint
app.get('/', async () => {
  return { message: 'Welcome to FastAPI on Elide!' };
});

// GET endpoint with path parameter
app.get('/users/{user_id}', async (req) => {
  return {
    user_id: req.params.user_id,
    name: 'John Doe',
  };
});

// GET endpoint with query parameters
app.get('/search', async (req) => {
  return {
    query: req.query.q,
    limit: req.query.limit || 10,
    results: [],
  };
});

// POST endpoint with body
app.post('/users', async (req) => {
  return {
    id: Math.floor(Math.random() * 1000),
    ...req.body,
    created_at: new Date().toISOString(),
  };
}, {
  summary: 'Create a new user',
  tags: ['Users'],
  status_code: 201,
});

// PUT endpoint
app.put('/users/{id}', async (req) => {
  return {
    id: req.params.id,
    ...req.body,
    updated_at: new Date().toISOString(),
  };
}, {
  summary: 'Update user',
  tags: ['Users'],
});

// DELETE endpoint
app.delete('/users/{id}', async (req) => {
  return {
    deleted: true,
    id: req.params.id,
  };
}, {
  summary: 'Delete user',
  tags: ['Users'],
  status_code: 204,
});

// Health check endpoint
app.get('/health', async () => {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
  };
}, {
  tags: ['Health'],
});

// Start server
if (require.main === module) {
  const PORT = 8000;
  app.listen(PORT, () => {
    console.log(`FastAPI server running at http://localhost:${PORT}`);
    console.log(`API documentation at http://localhost:${PORT}/docs`);
    console.log(`ReDoc documentation at http://localhost:${PORT}/redoc`);
    console.log(`OpenAPI schema at http://localhost:${PORT}/openapi.json`);
  });
}

export default app;
