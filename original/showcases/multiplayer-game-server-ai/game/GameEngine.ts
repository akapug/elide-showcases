/**
 * GameEngine - Physics, collisions, and game logic
 */

import { GameState, MapConfig } from './GameState.js';
import { Tank } from './entities/Tank.js';
import { Projectile } from './entities/Projectile.js';
import { Position } from './entities/Entity.js';

export class GameEngine {
  private state: GameState;
  private powerUpSpawnInterval: number = 15000; // Spawn power-up every 15 seconds
  private lastPowerUpSpawn: number = 0;

  constructor(mapConfig: MapConfig) {
    this.state = new GameState(mapConfig);
  }

  /**
   * Get current game state
   */
  public getState(): GameState {
    return this.state;
  }

  /**
   * Main update loop - called at 60 FPS
   */
  public update(deltaTime: number): void {
    // Update all entities
    this.state.update(deltaTime);

    // Check collisions
    this.checkProjectileCollisions();
    this.checkPowerUpCollisions();
    this.checkTankCollisions();

    // Check boundaries
    this.enforceBoundaries();

    // Spawn power-ups periodically
    this.spawnPowerUpsIfNeeded();
  }

  /**
   * Spawn a new tank
   */
  public spawnTank(id: string, isAI: boolean = false, playerId?: string): Tank {
    const position = this.state.getRandomSafePosition();
    const tank = new Tank(id, position.x, position.y, isAI, playerId);
    this.state.addTank(tank);
    return tank;
  }

  /**
   * Respawn a dead tank
   */
  public respawnTank(tankId: string): void {
    const tank = this.state.getTank(tankId);
    if (tank && !tank.alive) {
      const position = this.state.getRandomSafePosition();
      tank.respawn(position.x, position.y);
    }
  }

  /**
   * Tank movement
   */
  public moveTank(tankId: string, dx: number, dy: number, deltaTime: number): void {
    const tank = this.state.getTank(tankId);
    if (tank && tank.alive) {
      tank.move(dx, dy, deltaTime);
    }
  }

  /**
   * Rotate tank turret
   */
  public rotateTankTurret(tankId: string, targetAngle: number, deltaTime: number): void {
    const tank = this.state.getTank(tankId);
    if (tank && tank.alive) {
      tank.rotateTurret(targetAngle, deltaTime);
    }
  }

  /**
   * Fire projectile from tank
   */
  public fireTank(tankId: string): boolean {
    const tank = this.state.getTank(tankId);
    if (!tank || !tank.alive) return false;

    const currentTime = Date.now();
    if (!tank.canFire(currentTime)) return false;

    // Create projectile
    const firingPos = tank.getFiringPosition();
    const projectileId = `proj_${tankId}_${currentTime}`;
    const projectile = new Projectile(
      projectileId,
      firingPos,
      tank.turretRotation,
      tankId,
      tank.config.firePower
    );

    this.state.addProjectile(projectile);
    tank.fire(currentTime);

    return true;
  }

  /**
   * Check projectile collisions with tanks and obstacles
   */
  private checkProjectileCollisions(): void {
    for (const projectile of this.state.projectiles.values()) {
      if (!projectile.alive) continue;

      // Check collision with tanks
      for (const tank of this.state.tanks.values()) {
        if (!tank.alive || tank.id === projectile.ownerId) continue;

        if (projectile.collidesWith(tank)) {
          // Hit!
          const destroyed = tank.takeDamage(projectile.damage, projectile.ownerId);
          projectile.alive = false;
          this.state.stats.totalHits++;

          // Award kill to shooter
          if (destroyed) {
            const shooter = this.state.getTank(projectile.ownerId);
            if (shooter) {
              shooter.kills++;
              shooter.score += 100;
            }
            this.state.stats.totalKills++;
          }

          break;
        }
      }

      // Check collision with obstacles
      if (projectile.alive && this.state.isPositionOnObstacle(projectile.position, 5)) {
        projectile.alive = false;
      }

      // Check out of bounds
      if (
        projectile.position.x < 0 ||
        projectile.position.x > this.state.map.width ||
        projectile.position.y < 0 ||
        projectile.position.y > this.state.map.height
      ) {
        projectile.alive = false;
      }
    }
  }

  /**
   * Check power-up collisions with tanks
   */
  private checkPowerUpCollisions(): void {
    for (const powerUp of this.state.powerUps.values()) {
      if (!powerUp.alive) continue;

      for (const tank of this.state.tanks.values()) {
        if (!tank.alive) continue;

        if (powerUp.collidesWith(tank)) {
          // Collect power-up
          tank.applyPowerUp(powerUp.type);
          powerUp.alive = false;
          this.state.stats.powerUpsCollected++;
          tank.score += 10;
          break;
        }
      }
    }
  }

  /**
   * Check tank-to-tank collisions (push apart)
   */
  private checkTankCollisions(): void {
    const tanks = Array.from(this.state.tanks.values()).filter(t => t.alive);

    for (let i = 0; i < tanks.length; i++) {
      for (let j = i + 1; j < tanks.length; j++) {
        const tank1 = tanks[i];
        const tank2 = tanks[j];

        if (tank1.collidesWith(tank2)) {
          // Push tanks apart
          const dx = tank2.position.x - tank1.position.x;
          const dy = tank2.position.y - tank1.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0) {
            const overlap = 40 - distance; // 20 + 20 (both radii)
            const pushX = (dx / distance) * overlap * 0.5;
            const pushY = (dy / distance) * overlap * 0.5;

            tank1.position.x -= pushX;
            tank1.position.y -= pushY;
            tank2.position.x += pushX;
            tank2.position.y += pushY;
          }
        }
      }
    }
  }

  /**
   * Keep entities within map boundaries
   */
  private enforceBoundaries(): void {
    const margin = 20; // Tank radius

    for (const tank of this.state.tanks.values()) {
      if (!tank.alive) continue;

      // Clamp position
      if (tank.position.x < margin) {
        tank.position.x = margin;
        tank.velocity.dx = Math.max(0, tank.velocity.dx);
      }
      if (tank.position.x > this.state.map.width - margin) {
        tank.position.x = this.state.map.width - margin;
        tank.velocity.dx = Math.min(0, tank.velocity.dx);
      }
      if (tank.position.y < margin) {
        tank.position.y = margin;
        tank.velocity.dy = Math.max(0, tank.velocity.dy);
      }
      if (tank.position.y > this.state.map.height - margin) {
        tank.position.y = this.state.map.height - margin;
        tank.velocity.dy = Math.min(0, tank.velocity.dy);
      }

      // Check obstacle collisions and push out
      if (this.state.isPositionOnObstacle(tank.position, 20)) {
        // Simple push-out (move towards center)
        const centerX = this.state.map.width / 2;
        const centerY = this.state.map.height / 2;
        const dx = centerX - tank.position.x;
        const dy = centerY - tank.position.y;
        const length = Math.sqrt(dx * dx + dy * dy);

        if (length > 0) {
          tank.position.x += (dx / length) * 5;
          tank.position.y += (dy / length) * 5;
        }
      }
    }
  }

  /**
   * Spawn power-ups periodically
   */
  private spawnPowerUpsIfNeeded(): void {
    const currentTime = Date.now();
    if (currentTime - this.lastPowerUpSpawn >= this.powerUpSpawnInterval) {
      // Limit number of active power-ups
      if (this.state.powerUps.size < 5) {
        this.state.spawnRandomPowerUp();
        this.lastPowerUpSpawn = currentTime;
      }
    }
  }

  /**
   * Remove a tank from the game
   */
  public removeTank(tankId: string): void {
    this.state.removeTank(tankId);
  }

  /**
   * Get game statistics
   */
  public getStats(): any {
    return {
      ...this.state.stats,
      activeTanks: this.state.tanks.size,
      activeProjectiles: this.state.projectiles.size,
      activePowerUps: this.state.powerUps.size,
      aliveTanks: this.state.getAliveTanks().length
    };
  }

  /**
   * Reset game
   */
  public reset(): void {
    this.state.clear();
    this.lastPowerUpSpawn = 0;
  }
}
