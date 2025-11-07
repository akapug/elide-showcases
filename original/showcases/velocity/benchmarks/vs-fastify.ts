/**
 * Benchmark: Velocity vs Fastify
 */

import { createApp } from '../core/app';
import { runBenchmark, formatResult, compareResults, waitForServer } from './utils';
import Fastify from 'fastify';

const PORT_VELOCITY = 3005;
const PORT_FASTIFY = 3006;

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

// Fastify server
const fastifyApp = Fastify();

fastifyApp.get('/api/hello', async (request, reply) => {
  return { message: 'Hello, World!' };
});

fastifyApp.get('/api/user/:id', async (request, reply) => {
  const params = request.params as { id: string };
  return {
    id: params.id,
    name: 'John Doe',
    email: 'john@example.com',
  };
});

async function main() {
  console.log('🏁 Starting Velocity vs Fastify benchmark...\n');

  // Start servers
  const velocityServer = velocityApp.listen({ port: PORT_VELOCITY, hostname: '127.0.0.1' });
  console.log(`✓ Velocity server started on port ${PORT_VELOCITY}`);

  await fastifyApp.listen({ port: PORT_FASTIFY, host: '127.0.0.1' });
  console.log(`✓ Fastify server started on port ${PORT_FASTIFY}`);

  // Wait for servers to be ready
  await waitForServer(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`);
  await waitForServer(`http://127.0.0.1:${PORT_FASTIFY}/api/hello`);

  console.log('\n📊 Running benchmarks (10 seconds each)...\n');

  // Benchmark 1: Simple JSON response
  console.log('Test 1: Simple JSON Response (/api/hello)');
  const velocityResult1 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`, 10, 100);
  velocityResult1.framework = 'Velocity';
  formatResult(velocityResult1);

  const fastifyResult1 = await runBenchmark(`http://127.0.0.1:${PORT_FASTIFY}/api/hello`, 10, 100);
  fastifyResult1.framework = 'Fastify';
  formatResult(fastifyResult1);

  compareResults(fastifyResult1, velocityResult1);

  // Benchmark 2: Route with params
  console.log('\n\nTest 2: Route with Params (/api/user/:id)');
  const velocityResult2 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/user/123`, 10, 100);
  velocityResult2.framework = 'Velocity';
  formatResult(velocityResult2);

  const fastifyResult2 = await runBenchmark(`http://127.0.0.1:${PORT_FASTIFY}/api/user/123`, 10, 100);
  fastifyResult2.framework = 'Fastify';
  formatResult(fastifyResult2);

  compareResults(fastifyResult2, velocityResult2);

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nVelocity: ${velocityResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`Fastify:  ${fastifyResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`\nSpeedup: ${(velocityResult1.requestsPerSec / fastifyResult1.requestsPerSec).toFixed(2)}x faster`);
  console.log('='.repeat(80));

  // Cleanup
  velocityServer.stop();
  await fastifyApp.close();

  process.exit(0);
}

main().catch(console.error);
