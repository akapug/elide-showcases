import pino from 'pino';
import { RecommendationEngine } from '../core/recommendation-engine.js';

const logger = pino({ level: 'error' });
const engine = new RecommendationEngine(logger);

const ITERATIONS = 10000;
const TARGET_LATENCY = 50; // ms

async function runBenchmark(algorithm: any) {
  const latencies: number[] = [];
  let successes = 0;

  console.log(`\nBenchmarking ${algorithm}...`);

  for (let i = 0; i < ITERATIONS; i++) {
    const startTime = performance.now();

    try {
      await engine.recommend({
        userId: `user_${i % 1000}`,
        limit: 10,
        algorithm
      });

      const latency = performance.now() - startTime;
      latencies.push(latency);
      successes++;
    } catch (error) {
      // Timeout or error
    }
  }

  // Calculate statistics
  latencies.sort((a, b) => a - b);
  const avg = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const p50 = latencies[Math.floor(latencies.length * 0.5)];
  const p95 = latencies[Math.floor(latencies.length * 0.95)];
  const p99 = latencies[Math.floor(latencies.length * 0.99)];
  const successRate = (successes / ITERATIONS) * 100;

  const passed = p95 < TARGET_LATENCY;

  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║ Algorithm: ${algorithm.padEnd(58)} ║
║ ${passed ? '✅ PASS' : '❌ FAIL'} Meets <${TARGET_LATENCY}ms requirement${' '.repeat(40)} ║
║   Iterations:      ${ITERATIONS.toLocaleString().padEnd(51)} ║
║   Average:         ${avg.toFixed(2)}ms${' '.repeat(48 - avg.toFixed(2).length)} ║
║   P50 (median):    ${p50.toFixed(2)}ms${' '.repeat(48 - p50.toFixed(2).length)} ║
║   P95:             ${p95.toFixed(2)}ms${' '.repeat(48 - p95.toFixed(2).length)} ║
║   P99:             ${p99.toFixed(2)}ms${' '.repeat(48 - p99.toFixed(2).length)} ║
║   Success Rate:    ${successRate.toFixed(1)}%${' '.repeat(49 - successRate.toFixed(1).length)} ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);

  return { algorithm, passed, avg, p50, p95, p99, successRate };
}

async function main() {
  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                      Latency Benchmark Results                        ║
║                  Target: <${TARGET_LATENCY}ms (P95 latency)                         ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);

  const algorithms = [
    'collaborative_filtering',
    'matrix_factorization',
    'neural_cf',
    'content_based',
    'hybrid'
  ];

  const results = [];
  for (const algorithm of algorithms) {
    const result = await runBenchmark(algorithm);
    results.push(result);
  }

  const allPassed = results.every(r => r.passed);

  console.log(`
╔═══════════════════════════════════════════════════════════════════════╗
║                           Summary                                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║ Total Algorithms: ${algorithms.length.toString().padEnd(53)} ║
║ Passed:           ${results.filter(r => r.passed).length.toString().padEnd(53)} ║
║ Failed:           ${results.filter(r => !r.passed).length.toString().padEnd(53)} ║
║ Overall:          ${allPassed ? '✅ ALL PASSED' : '❌ SOME FAILED'}${' '.repeat(44)} ║
╚═══════════════════════════════════════════════════════════════════════╝
  `);

  process.exit(allPassed ? 0 : 1);
}

main().catch(console.error);
