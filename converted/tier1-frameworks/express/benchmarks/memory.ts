/**
 * Memory Usage Benchmark
 *
 * Measures memory footprint under different loads.
 *
 * Methodology:
 * 1. Measure baseline memory
 * 2. Create server and measure
 * 3. Handle requests and measure peak
 * 4. Compare with baseline
 *
 * Run with: elide run benchmarks/memory.ts
 */

import express from '../src/index';
import * as http from 'http';

/**
 * Get memory usage in MB
 */
function getMemoryMB() {
  const usage = process.memoryUsage();
  return {
    rss: (usage.rss / 1024 / 1024).toFixed(2),
    heapUsed: (usage.heapUsed / 1024 / 1024).toFixed(2),
    heapTotal: (usage.heapTotal / 1024 / 1024).toFixed(2),
    external: (usage.external / 1024 / 1024).toFixed(2)
  };
}

/**
 * Make HTTP request
 */
function makeRequest(port: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: 'localhost',
      port,
      path: '/test',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve());
    });

    req.on('error', reject);
    req.write(JSON.stringify({ test: 'data', items: new Array(100).fill('test') }));
    req.end();
  });
}

/**
 * Force garbage collection if available
 */
function forceGC() {
  if (global.gc) {
    global.gc();
  }
}

/**
 * Run benchmark
 */
async function runBenchmark() {
  console.log('\n╔═══════════════════════════════════════╗');
  console.log('║   Memory Usage Benchmark              ║');
  console.log('╚═══════════════════════════════════════╝\n');

  console.log('Note: Run with --expose-gc flag for accurate GC measurements\n');

  // Baseline
  forceGC();
  await new Promise(resolve => setTimeout(resolve, 100));
  const baseline = getMemoryMB();

  console.log('Baseline (before server):');
  console.log(`  RSS:       ${baseline.rss} MB`);
  console.log(`  Heap Used: ${baseline.heapUsed} MB`);
  console.log(`  Heap Total: ${baseline.heapTotal} MB\n`);

  // Create server
  const app = express();
  app.use(express.json());

  const data: any[] = [];

  app.post('/test', (req, res) => {
    // Store some data to measure memory growth
    data.push({ ...req.body, timestamp: Date.now() });

    // Limit array size
    if (data.length > 1000) {
      data.splice(0, 500);
    }

    res.json({ success: true, count: data.length });
  });

  app.get('/memory', (req, res) => {
    res.json(getMemoryMB());
  });

  const PORT = 4200;
  const server = await new Promise<any>((resolve) => {
    const s = app.listen(PORT, () => resolve(s));
  });

  forceGC();
  await new Promise(resolve => setTimeout(resolve, 100));
  const afterServer = getMemoryMB();

  console.log('After server creation:');
  console.log(`  RSS:       ${afterServer.rss} MB (+${(parseFloat(afterServer.rss) - parseFloat(baseline.rss)).toFixed(2)} MB)`);
  console.log(`  Heap Used: ${afterServer.heapUsed} MB (+${(parseFloat(afterServer.heapUsed) - parseFloat(baseline.heapUsed)).toFixed(2)} MB)\n`);

  // Handle requests
  console.log('Handling 10,000 requests...');
  for (let i = 0; i < 10000; i++) {
    await makeRequest(PORT);

    if (i % 1000 === 0) {
      process.stdout.write(`\r  Progress: ${i}/10000`);
    }
  }
  console.log('\r  Progress: 10000/10000 ✓\n');

  // Measure peak
  const peak = getMemoryMB();

  console.log('Peak memory (during load):');
  console.log(`  RSS:       ${peak.rss} MB`);
  console.log(`  Heap Used: ${peak.heapUsed} MB\n`);

  // Force GC and measure steady state
  forceGC();
  await new Promise(resolve => setTimeout(resolve, 500));
  const steadyState = getMemoryMB();

  console.log('Steady state (after GC):');
  console.log(`  RSS:       ${steadyState.rss} MB`);
  console.log(`  Heap Used: ${steadyState.heapUsed} MB\n`);

  console.log('╔═══════════════════════════════════════╗');
  console.log('║   Results                             ║');
  console.log('╚═══════════════════════════════════════╝\n');

  console.log(`  Baseline RSS:      ${baseline.rss} MB`);
  console.log(`  Server RSS:        ${afterServer.rss} MB`);
  console.log(`  Peak RSS:          ${peak.rss} MB`);
  console.log(`  Steady State RSS:  ${steadyState.rss} MB\n`);

  const overhead = parseFloat(steadyState.rss) - parseFloat(baseline.rss);
  console.log(`  Memory Overhead:   ${overhead.toFixed(2)} MB\n`);

  console.log('✓ Benchmark complete\n');

  console.log('Expected ranges (conservative):');
  console.log('  Node.js Express:');
  console.log('    - Baseline: 40-60 MB RSS');
  console.log('    - Under load: 80-120 MB RSS');
  console.log('  Elide/GraalVM:');
  console.log('    - Baseline: 30-50 MB RSS (20-40% less)');
  console.log('    - Under load: 50-80 MB RSS (30-50% less)');
  console.log('  Elide Native Image:');
  console.log('    - Baseline: 10-25 MB RSS (60-75% less)');
  console.log('    - Under load: 20-40 MB RSS (65-75% less)\n');

  server.close();
}

runBenchmark();
