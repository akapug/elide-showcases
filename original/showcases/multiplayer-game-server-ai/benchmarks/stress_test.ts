/**
 * Stress Test - Maximum AI bot capacity while maintaining 60 FPS
 */

import { GameEngine } from '../game/GameEngine.js';
import { GameLoop } from '../game/GameLoop.js';
import { MapConfig } from '../game/GameState.js';

const mapConfig: MapConfig = {
  width: 3000,
  height: 3000,
  obstacles: []
};

async function runStressTest(maxBots: number = 30, duration: number = 60000): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          STRESS TEST - Maximum Bot Capacity              ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log(`Configuration:`);
  console.log(`  Max Bots:     ${maxBots}`);
  console.log(`  Duration:     ${duration / 1000}s per test`);
  console.log(`  Target FPS:   60`);
  console.log('');

  const results: any[] = [];

  for (let botCount = 5; botCount <= maxBots; botCount += 5) {
    console.log(`\nTesting with ${botCount} bots...`);

    const engine = new GameEngine(mapConfig);

    // Spawn bots
    for (let i = 0; i < botCount; i++) {
      engine.spawnTank(`bot_${i}`, true);
    }

    const gameLoop = new GameLoop(engine);

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

    gameLoop.start();
    await new Promise((resolve) => setTimeout(resolve, duration));
    gameLoop.stop();

    const avgFPS = fpsReadings.reduce((a, b) => a + b, 0) / fpsReadings.length;
    const minFPS = Math.min(...fpsReadings);

    results.push({
      botCount,
      avgFPS,
      minFPS,
      frameDrops,
      passed: avgFPS >= 59.5 && minFPS >= 58
    });

    console.log(`  Avg FPS: ${avgFPS.toFixed(2)}, Min FPS: ${minFPS.toFixed(2)}, Drops: ${frameDrops}`);
  }

  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║                    RESULTS                               ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  console.log('Bots | Avg FPS | Min FPS | Frame Drops | Status');
  console.log('-----|---------|---------|-------------|-------');

  results.forEach((r) => {
    console.log(
      `${r.botCount.toString().padStart(4)} | ` +
        `${r.avgFPS.toFixed(2).padStart(7)} | ` +
        `${r.minFPS.toFixed(2).padStart(7)} | ` +
        `${r.frameDrops.toString().padStart(11)} | ` +
        `${r.passed ? '✅ PASS' : '❌ FAIL'}`
    );
  });

  const maxCapacity = results.filter((r) => r.passed).length * 5;
  console.log(`\nMaximum Capacity: ${maxCapacity} bots at 60 FPS`);
  console.log('');
}

const maxBots = parseInt(process.argv[2] || '30');
const duration = parseInt(process.argv[3] || '30000');

runStressTest(maxBots, duration).catch(console.error);
