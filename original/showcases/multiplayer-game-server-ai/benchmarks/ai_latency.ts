/**
 * AI Latency Benchmark - Measure Python AI decision time
 */

import { GameEngine } from '../game/GameEngine.js';
import { GameLoop } from '../game/GameLoop.js';
import { MapConfig } from '../game/GameState.js';
import { benchmarkAILatency } from '../bridge/PolyglotBridge.js';

const mapConfig: MapConfig = {
  width: 2000,
  height: 2000,
  obstacles: []
};

async function runAILatencyBenchmark(iterations: number = 1000, botCount: number = 10): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        AI LATENCY BENCHMARK - Polyglot Performance       ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Iterations:   ${iterations}`);
  console.log(`  Bots:         ${botCount}`);
  console.log(`  Target:       <1ms per decision`);
  console.log('');

  const engine = new GameEngine(mapConfig);

  // Spawn AI bots
  const aiTanks = [];
  for (let i = 0; i < botCount; i++) {
    const tank = engine.spawnTank(`bot_${i}`, true);
    aiTanks.push(tank);
  }

  // Add some enemy tanks for realistic decisions
  for (let i = 0; i < 5; i++) {
    engine.spawnTank(`enemy_${i}`, false);
  }

  console.log('Running benchmark...\n');

  const results = await benchmarkAILatency(engine.getState(), aiTanks, iterations);

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTS                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`AI Decision Latency (${botCount} bots, ${iterations} iterations):`);
  console.log(`  p50:          ${results.p50.toFixed(2)}ms`);
  console.log(`  p95:          ${results.p95.toFixed(2)}ms`);
  console.log(`  p99:          ${results.p99.toFixed(2)}ms`);
  console.log(`  Max:          ${results.max.toFixed(2)}ms`);
  console.log(`  Average:      ${results.avg.toFixed(2)}ms`);
  console.log('');

  // Per-bot latency
  const perBotLatency = results.avg / botCount;
  console.log(`Per-Bot Latency:`);
  console.log(`  Average:      ${perBotLatency.toFixed(3)}ms`);
  console.log('');

  // Pass/Fail
  const passed = results.p95 < 2.0; // Should be <1ms in Elide, <2ms acceptable
  console.log(`Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log(`  (Target: p95 < 2ms, Elide target: <1ms)`);
  console.log('');

  // Throughput
  const decisionsPerSecond = (1000 / results.avg) * botCount;
  console.log(`Throughput:`);
  console.log(`  Decisions/sec: ${decisionsPerSecond.toFixed(0)}`);
  console.log('');
}

const iterations = parseInt(process.argv[2] || '1000');
const botCount = parseInt(process.argv[3] || '10');

runAILatencyBenchmark(iterations, botCount).catch(console.error);
