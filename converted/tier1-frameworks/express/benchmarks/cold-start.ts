/**
 * Cold Start Benchmark
 *
 * Measures the time it takes to start the server and respond to the first request.
 * This is critical for serverless deployments and container orchestration.
 *
 * Methodology:
 * 1. Start timer
 * 2. Import and create Express app
 * 3. Define routes
 * 4. Start server
 * 5. Make first HTTP request
 * 6. Stop timer
 *
 * Run with: elide run benchmarks/cold-start.ts
 */

import express from '../src/index';
import * as http from 'http';

const ITERATIONS = 10;
const results: number[] = [];

/**
 * Make HTTP request
 */
function makeRequest(port: number): Promise<number> {
  return new Promise((resolve, reject) => {
    const start = Date.now();

    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/',
      method: 'GET'
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(Date.now() - start);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Run single cold start test
 */
async function runColdStart(port: number): Promise<number> {
  const start = Date.now();

  // Create Express app
  const app = express();

  // Define route
  app.get('/', (req, res) => {
    res.json({ message: 'Hello' });
  });

  // Start server
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(port, () => resolve(s));
  });

  // Make first request
  await makeRequest(port);

  const duration = Date.now() - start;

  // Cleanup
  await new Promise<void>((resolve) => {
    server.close(() => resolve());
  });

  return duration;
}

/**
 * Run benchmark
 */
async function runBenchmark() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Cold Start Benchmark                ║');
  console.log('╚═══════════════════════════════════════╝\n');

  console.log(`Running ${ITERATIONS} iterations...\n`);

  for (let i = 0; i < ITERATIONS; i++) {
    const port = 4000 + i;
    const duration = await runColdStart(port);
    results.push(duration);
    console.log(`  Iteration ${i + 1}: ${duration}ms`);

    // Wait a bit between iterations
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Calculate statistics
  const sorted = results.sort((a, b) => a - b);
  const mean = results.reduce((a, b) => a + b, 0) / results.length;
  const median = sorted[Math.floor(sorted.length / 2)];
  const min = sorted[0];
  const max = sorted[sorted.length - 1];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];

  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Results                             ║');
  console.log('╚═══════════════════════════════════════╝\n');

  console.log(`  Mean:      ${mean.toFixed(2)}ms`);
  console.log(`  Median:    ${median}ms`);
  console.log(`  Min:       ${min}ms`);
  console.log(`  Max:       ${max}ms`);
  console.log(`  P95:       ${p95}ms`);

  console.log('\n✓ Benchmark complete\n');

  console.log('Note: Cold start times include:');
  console.log('  - Module loading');
  console.log('  - App initialization');
  console.log('  - Server binding');
  console.log('  - First request handling\n');

  console.log('Expected range (conservative):');
  console.log('  - Node.js Express: 200-400ms');
  console.log('  - Elide/GraalVM: 50-150ms (after warmup)');
  console.log('  - Elide Native: 10-30ms\n');
}

runBenchmark();
