/**
 * Benchmark: Velocity vs Bun's built-in server
 */

import { createApp } from '../core/app';
import { runBenchmark, formatResult, compareResults, waitForServer } from './utils';

const PORT_VELOCITY = 3007;
const PORT_BUN = 3008;

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

// Bun built-in server
const bunServer = Bun.serve({
  port: PORT_BUN,
  hostname: '127.0.0.1',
  fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/api/hello') {
      return new Response(JSON.stringify({ message: 'Hello, World!' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (url.pathname.startsWith('/api/user/')) {
      const id = url.pathname.split('/')[3];
      return new Response(
        JSON.stringify({
          id,
          name: 'John Doe',
          email: 'john@example.com',
        }),
        {
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    return new Response('Not found', { status: 404 });
  },
});

async function main() {
  console.log('🏁 Starting Velocity vs Bun built-in server benchmark...\n');

  // Start Velocity server
  const velocityServer = velocityApp.listen({ port: PORT_VELOCITY, hostname: '127.0.0.1' });
  console.log(`✓ Velocity server started on port ${PORT_VELOCITY}`);
  console.log(`✓ Bun server started on port ${PORT_BUN}`);

  // Wait for servers to be ready
  await waitForServer(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`);
  await waitForServer(`http://127.0.0.1:${PORT_BUN}/api/hello`);

  console.log('\n📊 Running benchmarks (10 seconds each)...\n');

  // Benchmark 1: Simple JSON response
  console.log('Test 1: Simple JSON Response (/api/hello)');
  const velocityResult1 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`, 10, 100);
  velocityResult1.framework = 'Velocity';
  formatResult(velocityResult1);

  const bunResult1 = await runBenchmark(`http://127.0.0.1:${PORT_BUN}/api/hello`, 10, 100);
  bunResult1.framework = 'Bun (raw)';
  formatResult(bunResult1);

  compareResults(bunResult1, velocityResult1);

  // Benchmark 2: Route with params
  console.log('\n\nTest 2: Route with Params (/api/user/:id)');
  const velocityResult2 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/user/123`, 10, 100);
  velocityResult2.framework = 'Velocity';
  formatResult(velocityResult2);

  const bunResult2 = await runBenchmark(`http://127.0.0.1:${PORT_BUN}/api/user/123`, 10, 100);
  bunResult2.framework = 'Bun (raw)';
  formatResult(bunResult2);

  compareResults(bunResult2, velocityResult2);

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nVelocity:  ${velocityResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`Bun (raw): ${bunResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`\nOverhead: ${((1 - velocityResult1.requestsPerSec / bunResult1.requestsPerSec) * 100).toFixed(1)}%`);
  console.log('='.repeat(80));

  // Cleanup
  velocityServer.stop();
  bunServer.stop();

  process.exit(0);
}

main().catch(console.error);
