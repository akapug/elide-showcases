/**
 * Benchmark: Velocity vs Hono
 */

import { createApp } from '../core/app';
import { runBenchmark, formatResult, compareResults, waitForServer } from './utils';
import { Hono } from 'hono';

const PORT_VELOCITY = 3001;
const PORT_HONO = 3002;

// Velocity server
const velocityApp = createApp();
velocityApp.get('/api/hello', (ctx) => {
  return ctx.jsonResponse({ message: 'Hello, World!' });
});

velocityApp.get('/api/user/:id', (ctx) => {
  return ctx.jsonResponse({
    id: ctx.param('id'),
    name: 'John Doe',
    email: 'john@example.com',
  });
});

velocityApp.post('/api/data', async (ctx) => {
  const body = await ctx.json();
  return ctx.jsonResponse({ received: body });
});

// Hono server
const honoApp = new Hono();

honoApp.get('/api/hello', (c) => {
  return c.json({ message: 'Hello, World!' });
});

honoApp.get('/api/user/:id', (c) => {
  return c.json({
    id: c.req.param('id'),
    name: 'John Doe',
    email: 'john@example.com',
  });
});

honoApp.post('/api/data', async (c) => {
  const body = await c.req.json();
  return c.json({ received: body });
});

async function main() {
  console.log('🏁 Starting Velocity vs Hono benchmark...\n');

  // Start servers
  const velocityServer = velocityApp.listen({ port: PORT_VELOCITY, hostname: '127.0.0.1' });
  console.log(`✓ Velocity server started on port ${PORT_VELOCITY}`);

  const honoServer = Bun.serve({
    port: PORT_HONO,
    hostname: '127.0.0.1',
    fetch: honoApp.fetch,
  });
  console.log(`✓ Hono server started on port ${PORT_HONO}`);

  // Wait for servers to be ready
  await waitForServer(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`);
  await waitForServer(`http://127.0.0.1:${PORT_HONO}/api/hello`);

  console.log('\n📊 Running benchmarks (10 seconds each)...\n');

  // Benchmark 1: Simple JSON response
  console.log('Test 1: Simple JSON Response (/api/hello)');
  const velocityResult1 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`, 10, 100);
  velocityResult1.framework = 'Velocity';
  formatResult(velocityResult1);

  const honoResult1 = await runBenchmark(`http://127.0.0.1:${PORT_HONO}/api/hello`, 10, 100);
  honoResult1.framework = 'Hono';
  formatResult(honoResult1);

  compareResults(honoResult1, velocityResult1);

  // Benchmark 2: Route with params
  console.log('\n\nTest 2: Route with Params (/api/user/:id)');
  const velocityResult2 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/user/123`, 10, 100);
  velocityResult2.framework = 'Velocity';
  formatResult(velocityResult2);

  const honoResult2 = await runBenchmark(`http://127.0.0.1:${PORT_HONO}/api/user/123`, 10, 100);
  honoResult2.framework = 'Hono';
  formatResult(honoResult2);

  compareResults(honoResult2, velocityResult2);

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nVelocity: ${velocityResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`Hono:     ${honoResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`\nSpeedup: ${(velocityResult1.requestsPerSec / honoResult1.requestsPerSec).toFixed(2)}x faster`);
  console.log('='.repeat(80));

  // Cleanup
  velocityServer.stop();
  honoServer.stop();

  process.exit(0);
}

main().catch(console.error);
