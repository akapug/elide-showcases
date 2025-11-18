/**
 * GameLoop - Fixed timestep 60 FPS game loop
 */

import { GameEngine } from './GameEngine.js';
import { getBotDecisions } from '../bridge/PolyglotBridge.js';

export interface GameLoopMetrics {
  fps: number;
  frameTime: number;
  aiTime: number;
  updateTime: number;
  frameNumber: number;
}

export class GameLoop {
  private engine: GameEngine;
  private targetFPS: number = 60;
  private fixedDeltaTime: number = 1 / 60; // 16.67ms in seconds
  private accumulator: number = 0;
  private lastTime: number = 0;
  private running: boolean = false;
  private frameNumber: number = 0;

  // Performance tracking
  private metrics: GameLoopMetrics = {
    fps: 0,
    frameTime: 0,
    aiTime: 0,
    updateTime: 0,
    frameNumber: 0
  };

  private fpsCounter: number = 0;
  private fpsLastTime: number = 0;

  // Callbacks
  private onUpdateCallback?: (state: any) => void;
  private onMetricsCallback?: (metrics: GameLoopMetrics) => void;

  constructor(engine: GameEngine) {
    this.engine = engine;
  }

  /**
   * Start the game loop
   */
  public start(): void {
    if (this.running) return;

    this.running = true;
    this.lastTime = performance.now();
    this.fpsLastTime = this.lastTime;
    this.accumulator = 0;

    console.log('🎮 Game loop starting at 60 FPS...');
    this.loop();
  }

  /**
   * Stop the game loop
   */
  public stop(): void {
    this.running = false;
    console.log('🛑 Game loop stopped');
  }

  /**
   * Main game loop with fixed timestep
   */
  private async loop(): Promise<void> {
    if (!this.running) return;

    const currentTime = performance.now();
    const frameTime = Math.min(currentTime - this.lastTime, 100); // Cap at 100ms
    this.lastTime = currentTime;

    this.accumulator += frameTime;

    // Fixed timestep updates
    while (this.accumulator >= this.fixedDeltaTime * 1000) {
      const updateStart = performance.now();

      // Update AI decisions (async, but fast)
      const aiStart = performance.now();
      await this.updateAI();
      const aiTime = performance.now() - aiStart;

      // Update game logic
      this.engine.update(this.fixedDeltaTime);

      const updateTime = performance.now() - updateStart;

      // Update metrics
      this.metrics.aiTime = aiTime;
      this.metrics.updateTime = updateTime;
      this.metrics.frameTime = updateTime;
      this.metrics.frameNumber = ++this.frameNumber;

      this.accumulator -= this.fixedDeltaTime * 1000;
    }

    // Calculate FPS
    this.fpsCounter++;
    if (currentTime - this.fpsLastTime >= 1000) {
      this.metrics.fps = this.fpsCounter;
      this.fpsCounter = 0;
      this.fpsLastTime = currentTime;

      // Log metrics periodically
      if (this.onMetricsCallback) {
        this.onMetricsCallback(this.metrics);
      }
    }

    // Broadcast game state
    if (this.onUpdateCallback) {
      this.onUpdateCallback(this.engine.getState().serialize());
    }

    // Schedule next frame (targeting 60 FPS)
    const timeToNextFrame = Math.max(0, this.fixedDeltaTime * 1000 - (performance.now() - currentTime));
    setTimeout(() => this.loop(), timeToNextFrame);
  }

  /**
   * Update AI bot decisions
   * This is where the polyglot magic happens!
   */
  private async updateAI(): Promise<void> {
    const aiTanks = this.engine.getState().getAITanks();
    if (aiTanks.length === 0) return;

    try {
      // Get decisions for all AI bots in parallel (<1ms total)
      const decisions = await getBotDecisions(this.engine.getState(), aiTanks);

      // Apply decisions
      for (let i = 0; i < aiTanks.length && i < decisions.length; i++) {
        const tank = aiTanks[i];
        const decision = decisions[i];

        if (!decision || !tank.alive) continue;

        // Apply movement
        if (decision.move) {
          this.engine.moveTank(tank.id, decision.move.dx, decision.move.dy, this.fixedDeltaTime);
        }

        // Apply turret rotation
        if (decision.turretAngle !== undefined) {
          this.engine.rotateTankTurret(tank.id, decision.turretAngle, this.fixedDeltaTime);
        }

        // Apply fire
        if (decision.fire) {
          this.engine.fireTank(tank.id);
        }
      }
    } catch (error) {
      console.error('❌ AI update error:', error);
      // Continue game loop even if AI fails
    }
  }

  /**
   * Set callback for state updates (for broadcasting)
   */
  public onUpdate(callback: (state: any) => void): void {
    this.onUpdateCallback = callback;
  }

  /**
   * Set callback for metrics updates
   */
  public onMetrics(callback: (metrics: GameLoopMetrics) => void): void {
    this.onMetricsCallback = callback;
  }

  /**
   * Get current metrics
   */
  public getMetrics(): GameLoopMetrics {
    return { ...this.metrics };
  }

  /**
   * Get engine
   */
  public getEngine(): GameEngine {
    return this.engine;
  }
}
