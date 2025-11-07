/**
 * Benchmark: Velocity vs Express
 */

import { createApp } from '../core/app';
import { runBenchmark, formatResult, compareResults, waitForServer } from './utils';
import express from 'express';

const PORT_VELOCITY = 3003;
const PORT_EXPRESS = 3004;

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

// Express server
const expressApp = express();
expressApp.use(express.json());

expressApp.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello, World!' });
});

expressApp.get('/api/user/:id', (req, res) => {
  res.json({
    id: req.params.id,
    name: 'John Doe',
    email: 'john@example.com',
  });
});

async function main() {
  console.log('🏁 Starting Velocity vs Express benchmark...\n');

  // Start servers
  const velocityServer = velocityApp.listen({ port: PORT_VELOCITY, hostname: '127.0.0.1' });
  console.log(`✓ Velocity server started on port ${PORT_VELOCITY}`);

  const expressServer = expressApp.listen(PORT_EXPRESS, '127.0.0.1', () => {
    console.log(`✓ Express server started on port ${PORT_EXPRESS}`);
  });

  // Wait for servers to be ready
  await waitForServer(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`);
  await waitForServer(`http://127.0.0.1:${PORT_EXPRESS}/api/hello`);

  console.log('\n📊 Running benchmarks (10 seconds each)...\n');

  // Benchmark 1: Simple JSON response
  console.log('Test 1: Simple JSON Response (/api/hello)');
  const velocityResult1 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/hello`, 10, 100);
  velocityResult1.framework = 'Velocity';
  formatResult(velocityResult1);

  const expressResult1 = await runBenchmark(`http://127.0.0.1:${PORT_EXPRESS}/api/hello`, 10, 100);
  expressResult1.framework = 'Express';
  formatResult(expressResult1);

  compareResults(expressResult1, velocityResult1);

  // Benchmark 2: Route with params
  console.log('\n\nTest 2: Route with Params (/api/user/:id)');
  const velocityResult2 = await runBenchmark(`http://127.0.0.1:${PORT_VELOCITY}/api/user/123`, 10, 100);
  velocityResult2.framework = 'Velocity';
  formatResult(velocityResult2);

  const expressResult2 = await runBenchmark(`http://127.0.0.1:${PORT_EXPRESS}/api/user/123`, 10, 100);
  expressResult2.framework = 'Express';
  formatResult(expressResult2);

  compareResults(expressResult2, velocityResult2);

  // Summary
  console.log('\n\n' + '='.repeat(80));
  console.log('OVERALL SUMMARY');
  console.log('='.repeat(80));
  console.log(`\nVelocity: ${velocityResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`Express:  ${expressResult1.requestsPerSec.toLocaleString()} req/sec (simple)`);
  console.log(`\nSpeedup: ${(velocityResult1.requestsPerSec / expressResult1.requestsPerSec).toFixed(2)}x faster`);
  console.log('='.repeat(80));

  // Cleanup
  velocityServer.stop();
  expressServer.close();

  process.exit(0);
}

main().catch(console.error);
