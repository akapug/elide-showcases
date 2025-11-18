/**
 * GameState - Central state management for the game
 */

import { Tank } from './entities/Tank.js';
import { Projectile } from './entities/Projectile.js';
import { PowerUp, PowerUpType } from './entities/PowerUp.js';
import { Position } from './entities/Entity.js';

export interface MapConfig {
  width: number;
  height: number;
  obstacles: Obstacle[];
}

export interface Obstacle {
  x: number;
  y: number;
  width: number;
  height: number;
}

export class GameState {
  public tanks: Map<string, Tank> = new Map();
  public projectiles: Map<string, Projectile> = new Map();
  public powerUps: Map<string, PowerUp> = new Map();
  public map: MapConfig;
  public timestamp: number = 0;

  // Game statistics
  public stats = {
    totalShots: 0,
    totalHits: 0,
    totalKills: 0,
    powerUpsCollected: 0
  };

  constructor(mapConfig: MapConfig) {
    this.map = mapConfig;
  }

  /**
   * Add a tank to the game
   */
  public addTank(tank: Tank): void {
    this.tanks.set(tank.id, tank);
  }

  /**
   * Remove a tank from the game
   */
  public removeTank(tankId: string): void {
    this.tanks.delete(tankId);
  }

  /**
   * Get tank by ID
   */
  public getTank(tankId: string): Tank | undefined {
    return this.tanks.get(tankId);
  }

  /**
   * Add a projectile to the game
   */
  public addProjectile(projectile: Projectile): void {
    this.projectiles.set(projectile.id, projectile);
    this.stats.totalShots++;
  }

  /**
   * Remove a projectile from the game
   */
  public removeProjectile(projectileId: string): void {
    this.projectiles.delete(projectileId);
  }

  /**
   * Add a power-up to the game
   */
  public addPowerUp(powerUp: PowerUp): void {
    this.powerUps.set(powerUp.id, powerUp);
  }

  /**
   * Remove a power-up from the game
   */
  public removePowerUp(powerUpId: string): void {
    this.powerUps.delete(powerUpId);
  }

  /**
   * Spawn a random power-up
   */
  public spawnRandomPowerUp(): void {
    const id = `powerup_${Date.now()}_${Math.random()}`;
    const position = this.getRandomSafePosition();
    const type = PowerUp.randomType();
    const powerUp = new PowerUp(id, position, type);
    this.addPowerUp(powerUp);
  }

  /**
   * Get a random safe spawn position (not on obstacles)
   */
  public getRandomSafePosition(): Position {
    const maxAttempts = 100;
    for (let i = 0; i < maxAttempts; i++) {
      const x = Math.random() * this.map.width;
      const y = Math.random() * this.map.height;
      const position = { x, y };

      // Check if position is safe (not on obstacle)
      if (!this.isPositionOnObstacle(position, 30)) {
        return position;
      }
    }

    // Fallback to center
    return { x: this.map.width / 2, y: this.map.height / 2 };
  }

  /**
   * Check if position overlaps with an obstacle
   */
  public isPositionOnObstacle(position: Position, radius: number): boolean {
    for (const obstacle of this.map.obstacles) {
      // Check circular collision with rectangular obstacle
      const closestX = Math.max(obstacle.x, Math.min(position.x, obstacle.x + obstacle.width));
      const closestY = Math.max(obstacle.y, Math.min(position.y, obstacle.y + obstacle.height));

      const dx = position.x - closestX;
      const dy = position.y - closestY;
      const distanceSquared = dx * dx + dy * dy;

      if (distanceSquared < radius * radius) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check line of sight between two positions
   */
  public hasLineOfSight(from: Position, to: Position): boolean {
    // Simple ray-casting against obstacles
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    const steps = Math.floor(distance / 10); // Check every 10 pixels

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const x = from.x + dx * t;
      const y = from.y + dy * t;

      if (this.isPositionOnObstacle({ x, y }, 5)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Get all alive tanks
   */
  public getAliveTanks(): Tank[] {
    return Array.from(this.tanks.values()).filter(t => t.alive);
  }

  /**
   * Get all AI tanks
   */
  public getAITanks(): Tank[] {
    return Array.from(this.tanks.values()).filter(t => t.isAI && t.alive);
  }

  /**
   * Get all player tanks
   */
  public getPlayerTanks(): Tank[] {
    return Array.from(this.tanks.values()).filter(t => !t.isAI && t.alive);
  }

  /**
   * Update all entities
   */
  public update(deltaTime: number): void {
    this.timestamp = Date.now();

    // Update all tanks
    for (const tank of this.tanks.values()) {
      tank.update(deltaTime);
    }

    // Update all projectiles
    for (const projectile of this.projectiles.values()) {
      projectile.update(deltaTime);
      if (!projectile.alive) {
        this.removeProjectile(projectile.id);
      }
    }

    // Update all power-ups
    for (const powerUp of this.powerUps.values()) {
      powerUp.update(deltaTime);
      if (!powerUp.alive) {
        this.removePowerUp(powerUp.id);
      }
    }
  }

  /**
   * Serialize entire game state for network transmission
   */
  public serialize(): any {
    return {
      tanks: Array.from(this.tanks.values()).map(t => t.serialize()),
      projectiles: Array.from(this.projectiles.values()).map(p => p.serialize()),
      powerUps: Array.from(this.powerUps.values()).map(p => p.serialize()),
      timestamp: this.timestamp,
      stats: this.stats
    };
  }

  /**
   * Serialize game state for AI (includes spatial information)
   */
  public serializeForAI(tankId: string): any {
    const tank = this.getTank(tankId);
    if (!tank) return null;

    return {
      selfTank: tank.serialize(),
      visibleTanks: this.getVisibleTanks(tankId),
      visibleProjectiles: this.getVisibleProjectiles(tankId),
      nearbyPowerUps: this.getNearbyPowerUps(tankId),
      obstacles: this.map.obstacles,
      mapSize: { width: this.map.width, height: this.map.height }
    };
  }

  /**
   * Get tanks visible to a specific tank
   */
  private getVisibleTanks(tankId: string): any[] {
    const tank = this.getTank(tankId);
    if (!tank) return [];

    const visibilityRange = 800;
    const visible: any[] = [];

    for (const otherTank of this.tanks.values()) {
      if (otherTank.id === tankId || !otherTank.alive) continue;

      const distance = tank.distanceTo(otherTank.position);
      if (distance <= visibilityRange && this.hasLineOfSight(tank.position, otherTank.position)) {
        visible.push({
          ...otherTank.serialize(),
          distance,
          angle: tank.angleTo(otherTank.position)
        });
      }
    }

    return visible;
  }

  /**
   * Get projectiles visible to a specific tank
   */
  private getVisibleProjectiles(tankId: string): any[] {
    const tank = this.getTank(tankId);
    if (!tank) return [];

    const visibilityRange = 600;
    const visible: any[] = [];

    for (const projectile of this.projectiles.values()) {
      if (projectile.ownerId === tankId) continue;

      const distance = tank.distanceTo(projectile.position);
      if (distance <= visibilityRange) {
        visible.push({
          ...projectile.serialize(),
          distance,
          angle: tank.angleTo(projectile.position)
        });
      }
    }

    return visible;
  }

  /**
   * Get power-ups near a specific tank
   */
  private getNearbyPowerUps(tankId: string): any[] {
    const tank = this.getTank(tankId);
    if (!tank) return [];

    const searchRange = 400;
    const nearby: any[] = [];

    for (const powerUp of this.powerUps.values()) {
      const distance = tank.distanceTo(powerUp.position);
      if (distance <= searchRange) {
        nearby.push({
          ...powerUp.serialize(),
          distance,
          angle: tank.angleTo(powerUp.position)
        });
      }
    }

    return nearby;
  }

  /**
   * Clear all entities (for game reset)
   */
  public clear(): void {
    this.tanks.clear();
    this.projectiles.clear();
    this.powerUps.clear();
    this.stats = {
      totalShots: 0,
      totalHits: 0,
      totalKills: 0,
      powerUpsCollected: 0
    };
  }
}
