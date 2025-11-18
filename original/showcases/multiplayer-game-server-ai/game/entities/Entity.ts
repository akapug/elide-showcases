/**
 * Base Entity class for all game objects
 */

export interface Position {
  x: number;
  y: number;
}

export interface Velocity {
  dx: number;
  dy: number;
}

export abstract class Entity {
  public id: string;
  public position: Position;
  public velocity: Velocity;
  public rotation: number; // Radians
  public alive: boolean;

  constructor(id: string, x: number, y: number) {
    this.id = id;
    this.position = { x, y };
    this.velocity = { dx: 0, dy: 0 };
    this.rotation = 0;
    this.alive = true;
  }

  /**
   * Update entity state (called every frame)
   */
  public abstract update(deltaTime: number): void;

  /**
   * Check collision with another entity
   */
  public abstract collidesWith(other: Entity): boolean;

  /**
   * Serialize entity for network transmission
   */
  public serialize(): any {
    return {
      id: this.id,
      position: this.position,
      velocity: this.velocity,
      rotation: this.rotation,
      alive: this.alive,
      type: this.constructor.name
    };
  }

  /**
   * Calculate distance to another position
   */
  public distanceTo(pos: Position): number {
    const dx = this.position.x - pos.x;
    const dy = this.position.y - pos.y;
    return Math.sqrt(dx * dx + dy * dy);
  }

  /**
   * Calculate angle to another position
   */
  public angleTo(pos: Position): number {
    const dx = pos.x - this.position.x;
    const dy = pos.y - this.position.y;
    return Math.atan2(dy, dx);
  }
}
