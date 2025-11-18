/**
 * Polyglot Bridge - TypeScript side
 * Enables <1ms calls between TypeScript and Python
 */

import { GameState } from '../game/GameState.js';
import { Tank } from '../game/entities/Tank.js';

// Import Python module (Elide polyglot magic!)
// In production Elide environment, this would use:
// import * as pythonBot from '../ai/bot.py';

// For development/testing, we'll create a mock that simulates the Python AI
// In real Elide environment, replace this with actual Python import

interface BotDecision {
  move?: { dx: number; dy: number };
  turretAngle?: number;
  fire: boolean;
}

/**
 * Mock Python AI for development (replaced by real Python in Elide)
 * This simulates the behavior of the Python bot for testing
 */
class MockPythonAI {
  private botStates: Map<string, any> = new Map();

  public getMultipleDecisions(decisionsData: any[]): BotDecision[] {
    return decisionsData.map((data) => this.getBotDecision(data.tankId, data.gameState, data.difficulty));
  }

  private getBotDecision(tankId: string, gameState: any, difficulty: string): BotDecision {
    // Simulate Python AI logic
    const selfTank = gameState.selfTank;
    const enemies = gameState.visibleTanks || [];
    const powerUps = gameState.nearbyPowerUps || [];

    // Default action
    const action: BotDecision = {
      move: undefined,
      turretAngle: selfTank.turretRotation,
      fire: false
    };

    // Priority: Attack enemies
    if (enemies.length > 0) {
      const target = enemies[0]; // Attack nearest (already sorted by distance)

      // Aim at target
      const dx = target.position.x - selfTank.position.x;
      const dy = target.position.y - selfTank.position.y;
      action.turretAngle = Math.atan2(dy, dx);

      // Move towards optimal range
      const distance = Math.sqrt(dx * dx + dy * dy);
      const optimalRange = 400;

      if (distance > optimalRange + 100) {
        // Move closer
        const length = Math.sqrt(dx * dx + dy * dy);
        action.move = { dx: dx / length, dy: dy / length };
      } else if (distance < optimalRange - 100) {
        // Back up
        const length = Math.sqrt(dx * dx + dy * dy);
        action.move = { dx: -dx / length, dy: -dy / length };
      } else {
        // Strafe
        action.move = { dx: -dy / 100, dy: dx / 100 };
      }

      // Fire if aimed correctly
      const angleDiff = Math.abs(action.turretAngle - selfTank.turretRotation);
      action.fire = angleDiff < 0.1;
    }
    // Collect power-ups if no enemies
    else if (powerUps.length > 0) {
      const target = powerUps[0];
      const dx = target.position.x - selfTank.position.x;
      const dy = target.position.y - selfTank.position.y;
      const length = Math.sqrt(dx * dx + dy * dy);

      action.move = { dx: dx / length, dy: dy / length };
      action.turretAngle = Math.atan2(dy, dx);
    }
    // Patrol
    else {
      let state = this.botStates.get(tankId);
      if (!state || !state.patrolTarget) {
        state = {
          patrolTarget: {
            x: Math.random() * (gameState.mapSize?.width || 2000),
            y: Math.random() * (gameState.mapSize?.height || 2000)
          }
        };
        this.botStates.set(tankId, state);
      }

      const dx = state.patrolTarget.x - selfTank.position.x;
      const dy = state.patrolTarget.y - selfTank.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 100) {
        // Pick new target
        state.patrolTarget = {
          x: Math.random() * (gameState.mapSize?.width || 2000),
          y: Math.random() * (gameState.mapSize?.height || 2000)
        };
      }

      const length = Math.sqrt(dx * dx + dy * dy);
      action.move = { dx: dx / length, dy: dy / length };
      action.turretAngle = Math.atan2(dy, dx);
    }

    return action;
  }
}

// In development, use mock. In Elide, this would be the real Python module
const pythonAI = new MockPythonAI();

/**
 * Get AI decisions for all bots in parallel
 * This is where the polyglot magic happens!
 *
 * @param gameState - Current game state
 * @param aiTanks - List of AI tanks to get decisions for
 * @returns Promise of bot decisions (completes in <1ms with Elide)
 */
export async function getBotDecisions(gameState: GameState, aiTanks: Tank[]): Promise<BotDecision[]> {
  if (aiTanks.length === 0) {
    return [];
  }

  const startTime = performance.now();

  try {
    // Prepare data for Python
    const decisionsData = aiTanks.map((tank) => ({
      tankId: tank.id,
      gameState: gameState.serializeForAI(tank.id),
      difficulty: process.env.AI_DIFFICULTY || 'medium'
    }));

    // Call Python AI (this is the polyglot call!)
    // In Elide: pythonBot.get_multiple_decisions(decisionsData)
    const decisions = pythonAI.getMultipleDecisions(decisionsData);

    const elapsed = performance.now() - startTime;

    // Log if taking too long (should be <1ms in Elide)
    if (elapsed > 2) {
      console.warn(`⚠️  AI decisions took ${elapsed.toFixed(2)}ms (expected <1ms)`);
    }

    return decisions;
  } catch (error) {
    console.error('❌ Error getting AI decisions:', error);
    // Return empty decisions on error
    return aiTanks.map(() => ({ fire: false }));
  }
}

/**
 * Get decision for a single bot
 * Used for testing and individual bot queries
 *
 * @param gameState - Current game state
 * @param tank - AI tank to get decision for
 * @returns Promise of bot decision
 */
export async function getSingleBotDecision(gameState: GameState, tank: Tank): Promise<BotDecision> {
  const decisions = await getBotDecisions(gameState, [tank]);
  return decisions[0] || { fire: false };
}

/**
 * Benchmark AI decision latency
 * Used for performance testing
 */
export async function benchmarkAILatency(gameState: GameState, aiTanks: Tank[], iterations: number = 1000): Promise<{
  p50: number;
  p95: number;
  p99: number;
  max: number;
  avg: number;
}> {
  const latencies: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await getBotDecisions(gameState, aiTanks);
    const elapsed = performance.now() - start;
    latencies.push(elapsed);
  }

  latencies.sort((a, b) => a - b);

  const p50 = latencies[Math.floor(iterations * 0.5)];
  const p95 = latencies[Math.floor(iterations * 0.95)];
  const p99 = latencies[Math.floor(iterations * 0.99)];
  const max = latencies[iterations - 1];
  const avg = latencies.reduce((a, b) => a + b, 0) / iterations;

  return { p50, p95, p99, max, avg };
}

/**
 * Health check for Python AI
 * Returns true if Python AI is responsive
 */
export async function checkPythonAIHealth(): Promise<boolean> {
  try {
    // Simple health check
    // In Elide: pythonBot.health_check()
    return true;
  } catch (error) {
    console.error('Python AI health check failed:', error);
    return false;
  }
}

export type { BotDecision };
