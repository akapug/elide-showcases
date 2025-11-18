/**
 * PowerUp entity - collectible items that grant temporary abilities
 */

import { Entity, Position } from './Entity.js';

export type PowerUpType = 'shield' | 'speed' | 'rapidfire' | 'health';

export class PowerUp extends Entity {
  public type: PowerUpType;
  public spawnTime: number;
  public duration: number = 30000; // 30 seconds before despawn

  constructor(id: string, position: Position, type: PowerUpType) {
    super(id, position.x, position.y);
    this.type = type;
    this.spawnTime = Date.now();
  }

  public update(deltaTime: number): void {
    if (!this.alive) return;

    // Despawn after duration
    if (Date.now() - this.spawnTime >= this.duration) {
      this.alive = false;
    }

    // Gentle floating animation (visual only, handled by client)
    // Server just tracks existence
  }

  /**
   * Check collision with tank (circular collision)
   */
  public collidesWith(other: Entity): boolean {
    const radius = 15; // PowerUp radius
    const otherRadius = 20; // Tank radius
    const distance = this.distanceTo(other.position);
    return distance < radius + otherRadius;
  }

  /**
   * Serialize for network
   */
  public serialize(): any {
    return {
      ...super.serialize(),
      type: this.type,
      spawnTime: this.spawnTime
    };
  }

  /**
   * Get random power-up type
   */
  public static randomType(): PowerUpType {
    const types: PowerUpType[] = ['shield', 'speed', 'rapidfire', 'health'];
    return types[Math.floor(Math.random() * types.length)];
  }
}
