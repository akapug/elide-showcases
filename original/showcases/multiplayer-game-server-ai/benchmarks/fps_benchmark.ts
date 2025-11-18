/**
 * FPS Benchmark - Test frame rate consistency with AI bots
 */

import { GameEngine } from '../game/GameEngine.js';
import { GameLoop } from '../game/GameLoop.js';
import { MapConfig } from '../game/GameState.js';

const mapConfig: MapConfig = {
  width: 2000,
  height: 2000,
  obstacles: [
    { x: 400, y: 400, width: 100, height: 100 },
    { x: 1500, y: 400, width: 100, height: 100 },
    { x: 950, y: 950, width: 100, height: 100 }
  ]
};

async function runFPSBenchmark(duration: number = 60000, botCount: number = 10): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          FPS BENCHMARK - 60 FPS Consistency Test         ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Duration:     ${duration / 1000}s`);
  console.log(`  AI Bots:      ${botCount}`);
  console.log(`  Target FPS:   60`);
  console.log('');

  const engine = new GameEngine(mapConfig);

  // Spawn AI bots
  for (let i = 0; i < botCount; i++) {
    engine.spawnTank(`bot_${i}`, true);
  }

  const gameLoop = new GameLoop(engine);

  // Collect metrics
  const frameTimes: number[] = [];
  const fpsReadings: number[] = [];
  let frameDrops = 0;

  gameLoop.onMetrics((metrics) => {
    frameTimes.push(metrics.frameTime);
    fpsReadings.push(metrics.fps);

    if (metrics.frameTime > 16.67 * 1.2) {
      frameDrops++;
    }
  });

  // Start test
  const startTime = Date.now();
  gameLoop.start();

  // Wait for duration
  await new Promise((resolve) => setTimeout(resolve, duration));

  gameLoop.stop();

  // Calculate statistics
  const avgFPS = fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length;
  const minFPS = Math.min(...fpsReadings);
  const maxFPS = Math.max(...fpsReadings);

  frameTimes.sort((a, b) => a - b);
  const p50 = frameTimes[Math.floor(frameTimes.length * 0.5)];
  const p95 = frameTimes[Math.floor(frameTimes.length * 0.95)];
  const p99 = frameTimes[Math.floor(frameTimes.length * 0.99)];

  const stdDev = Math.sqrt(
    frameTimes.reduce((sum, t) => sum + Math.pow(t - p50, 2), 0) / frameTimes.length
  );

  // Report results
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTS                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`FPS Statistics:`);
  console.log(`  Target:       60.00 FPS`);
  console.log(`  Average:      ${avgFPS.toFixed(2)} FPS`);
  console.log(`  Min:          ${minFPS.toFixed(2)} FPS`);
  console.log(`  Max:          ${maxFPS.toFixed(2)} FPS`);
  console.log('');

  console.log(`Frame Time:`);
  console.log(`  p50:          ${p50.toFixed(2)}ms`);
  console.log(`  p95:          ${p95.toFixed(2)}ms`);
  console.log(`  p99:          ${p99.toFixed(2)}ms`);
  console.log(`  Std Dev:      ${stdDev.toFixed(2)}ms`);
  console.log('');

  console.log(`Stability:`);
  console.log(`  Frame Drops:  ${frameDrops} (${((frameDrops / frameTimes.length) * 100).toFixed(2)}%)`);
  console.log('');

  // Pass/Fail
  const passed = avgFPS >= 59.5 && frameDrops < frameTimes.length * 0.01;
  console.log(`Result: ${passed ? '✅ PASSED' : '❌ FAILED'}`);
  console.log('');
}

// Run benchmark
const botCount = parseInt(process.argv[2] || '10');
const duration = parseInt(process.argv[3] || '60000');

runFPSBenchmark(duration, botCount).catch(console.error);
