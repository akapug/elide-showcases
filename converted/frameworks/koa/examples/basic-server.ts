/**
 * Basic Koa Server Example
 *
 * Demonstrates:
 * - Creating a Koa application
 * - Adding simple middleware
 * - Handling requests and responses
 * - Running the server
 */

import { Koa } from '../server';

const app = new Koa();

// Simple response middleware
app.use(async (ctx) => {
  ctx.body = {
    message: 'Hello from Koa on Elide!',
    timestamp: new Date().toISOString(),
    method: ctx.method,
    path: ctx.path
  };
});

// Start server
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`✓ Koa server running on http://localhost:${PORT}`);
  console.log('  Try: curl http://localhost:3000');
});
