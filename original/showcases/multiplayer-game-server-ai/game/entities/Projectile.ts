/**
 * Projectile entity - bullets fired by tanks
 */

import { Entity, Position } from './Entity.js';

export class Projectile extends Entity {
  public damage: number;
  public ownerId: string;
  public speed: number;
  public maxDistance: number;
  private distanceTraveled: number = 0;

  constructor(
    id: string,
    position: Position,
    angle: number,
    ownerId: string,
    damage: number = 25,
    speed: number = 600
  ) {
    super(id, position.x, position.y);
    this.ownerId = ownerId;
    this.damage = damage;
    this.speed = speed;
    this.rotation = angle;
    this.maxDistance = 1000; // Max range

    // Set velocity based on angle
    this.velocity = {
      dx: Math.cos(angle) * speed,
      dy: Math.sin(angle) * speed
    };
  }

  public update(deltaTime: number): void {
    if (!this.alive) return;

    // Update position
    const dx = this.velocity.dx * deltaTime;
    const dy = this.velocity.dy * deltaTime;

    this.position.x += dx;
    this.position.y += dy;

    // Track distance
    this.distanceTraveled += Math.sqrt(dx * dx + dy * dy);

    // Destroy if traveled too far
    if (this.distanceTraveled >= this.maxDistance) {
      this.alive = false;
    }
  }

  /**
   * Check collision with another entity (small circular collision)
   */
  public collidesWith(other: Entity): boolean {
    const radius = 5; // Projectile radius
    const otherRadius = 20; // Assume tank radius
    const distance = this.distanceTo(other.position);
    return distance < radius + otherRadius;
  }

  /**
   * Serialize for network
   */
  public serialize(): any {
    return {
      ...super.serialize(),
      damage: this.damage,
      ownerId: this.ownerId,
      speed: this.speed
    };
  }
}
