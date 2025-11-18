/**
 * Tank entity - player or AI controlled
 */

import { Entity, Position } from './Entity.js';

export interface TankConfig {
  maxHealth: number;
  maxSpeed: number;
  acceleration: number;
  turretRotationSpeed: number;
  fireRate: number; // Shots per second
  firePower: number;
}

export const DEFAULT_TANK_CONFIG: TankConfig = {
  maxHealth: 100,
  maxSpeed: 200, // pixels per second
  acceleration: 500,
  turretRotationSpeed: Math.PI * 2, // 360 degrees per second
  fireRate: 2, // 2 shots per second
  firePower: 25
};

export class Tank extends Entity {
  public health: number;
  public maxHealth: number;
  public turretRotation: number;
  public isAI: boolean;
  public playerId?: string;
  public config: TankConfig;

  // Combat state
  private lastFireTime: number = 0;
  private ammo: number = Infinity;

  // Power-ups
  public shields: number = 0; // Damage absorption
  public speedBoost: number = 1.0; // Speed multiplier
  public rapidFire: boolean = false;

  // Stats
  public kills: number = 0;
  public deaths: number = 0;
  public score: number = 0;

  constructor(
    id: string,
    x: number,
    y: number,
    isAI: boolean = false,
    playerId?: string,
    config: TankConfig = DEFAULT_TANK_CONFIG
  ) {
    super(id, x, y);
    this.isAI = isAI;
    this.playerId = playerId;
    this.config = config;
    this.health = config.maxHealth;
    this.maxHealth = config.maxHealth;
    this.turretRotation = 0;
  }

  public update(deltaTime: number): void {
    if (!this.alive) return;

    // Apply velocity (with drag)
    this.position.x += this.velocity.dx * deltaTime;
    this.position.y += this.velocity.dy * deltaTime;

    // Apply drag
    const drag = 0.85;
    this.velocity.dx *= drag;
    this.velocity.dy *= drag;

    // Decay power-ups
    if (this.speedBoost > 1.0) {
      this.speedBoost = Math.max(1.0, this.speedBoost - deltaTime * 0.2);
    }
  }

  /**
   * Move tank in direction
   */
  public move(dx: number, dy: number, deltaTime: number): void {
    const speed = this.config.maxSpeed * this.speedBoost;
    const accel = this.config.acceleration * deltaTime;

    // Normalize direction
    const length = Math.sqrt(dx * dx + dy * dy);
    if (length > 0) {
      dx /= length;
      dy /= length;
    }

    // Apply acceleration
    this.velocity.dx += dx * accel;
    this.velocity.dy += dy * accel;

    // Clamp to max speed
    const currentSpeed = Math.sqrt(
      this.velocity.dx * this.velocity.dx + this.velocity.dy * this.velocity.dy
    );
    if (currentSpeed > speed) {
      this.velocity.dx = (this.velocity.dx / currentSpeed) * speed;
      this.velocity.dy = (this.velocity.dy / currentSpeed) * speed;
    }

    // Update body rotation to face movement direction
    if (length > 0.1) {
      this.rotation = Math.atan2(dy, dx);
    }
  }

  /**
   * Rotate turret towards angle
   */
  public rotateTurret(targetAngle: number, deltaTime: number): void {
    const maxRotation = this.config.turretRotationSpeed * deltaTime;
    let angleDiff = targetAngle - this.turretRotation;

    // Normalize angle difference to [-PI, PI]
    while (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
    while (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;

    // Rotate towards target
    if (Math.abs(angleDiff) < maxRotation) {
      this.turretRotation = targetAngle;
    } else {
      this.turretRotation += Math.sign(angleDiff) * maxRotation;
    }

    // Normalize turret rotation
    while (this.turretRotation > Math.PI) this.turretRotation -= 2 * Math.PI;
    while (this.turretRotation < -Math.PI) this.turretRotation += 2 * Math.PI;
  }

  /**
   * Attempt to fire projectile
   * Returns true if fired successfully
   */
  public canFire(currentTime: number): boolean {
    const fireInterval = this.rapidFire ? 100 : 1000 / this.config.fireRate;
    return currentTime - this.lastFireTime >= fireInterval && this.ammo > 0;
  }

  public fire(currentTime: number): void {
    this.lastFireTime = currentTime;
    if (this.ammo !== Infinity) {
      this.ammo--;
    }
  }

  /**
   * Take damage
   */
  public takeDamage(damage: number, attackerId?: string): boolean {
    if (!this.alive) return false;

    // Apply shields
    if (this.shields > 0) {
      const absorbed = Math.min(this.shields, damage);
      this.shields -= absorbed;
      damage -= absorbed;
    }

    this.health -= damage;

    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
      this.deaths++;
      return true; // Tank destroyed
    }

    return false;
  }

  /**
   * Heal tank
   */
  public heal(amount: number): void {
    this.health = Math.min(this.maxHealth, this.health + amount);
  }

  /**
   * Respawn tank
   */
  public respawn(x: number, y: number): void {
    this.position = { x, y };
    this.velocity = { dx: 0, dy: 0 };
    this.rotation = 0;
    this.turretRotation = 0;
    this.health = this.maxHealth;
    this.alive = true;
    this.shields = 0;
    this.speedBoost = 1.0;
    this.rapidFire = false;
  }

  /**
   * Apply power-up
   */
  public applyPowerUp(type: string): void {
    switch (type) {
      case 'shield':
        this.shields += 50;
        break;
      case 'speed':
        this.speedBoost = 1.5;
        break;
      case 'rapidfire':
        this.rapidFire = true;
        setTimeout(() => (this.rapidFire = false), 10000); // 10 seconds
        break;
      case 'health':
        this.heal(50);
        break;
    }
  }

  /**
   * Check collision with another entity (circular collision)
   */
  public collidesWith(other: Entity): boolean {
    const radius = 20; // Tank radius
    const otherRadius = other instanceof Tank ? 20 : 5;
    const distance = this.distanceTo(other.position);
    return distance < radius + otherRadius;
  }

  /**
   * Serialize for network/AI
   */
  public serialize(): any {
    return {
      ...super.serialize(),
      health: this.health,
      maxHealth: this.maxHealth,
      turretRotation: this.turretRotation,
      isAI: this.isAI,
      playerId: this.playerId,
      shields: this.shields,
      speedBoost: this.speedBoost,
      rapidFire: this.rapidFire,
      kills: this.kills,
      deaths: this.deaths,
      score: this.score
    };
  }

  /**
   * Get firing position (tip of barrel)
   */
  public getFiringPosition(): Position {
    const barrelLength = 30;
    return {
      x: this.position.x + Math.cos(this.turretRotation) * barrelLength,
      y: this.position.y + Math.sin(this.turretRotation) * barrelLength
    };
  }

  /**
   * Predict position after deltaTime (for AI targeting)
   */
  public predictPosition(deltaTime: number): Position {
    return {
      x: this.position.x + this.velocity.dx * deltaTime,
      y: this.position.y + this.velocity.dy * deltaTime
    };
  }
}
