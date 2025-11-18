/**
 * Game Logic Tests
 */

import { GameEngine } from '../game/GameEngine.js';
import { Tank } from '../game/entities/Tank.js';
import { Projectile } from '../game/entities/Projectile.js';
import { MapConfig } from '../game/GameState.js';

const testMapConfig: MapConfig = {
  width: 1000,
  height: 1000,
  obstacles: []
};

describe('GameEngine', () => {
  let engine: GameEngine;

  beforeEach(() => {
    engine = new GameEngine(testMapConfig);
  });

  test('should spawn tank at safe position', () => {
    const tank = engine.spawnTank('test_tank_1', false);

    expect(tank).toBeDefined();
    expect(tank.id).toBe('test_tank_1');
    expect(tank.position.x).toBeGreaterThanOrEqual(0);
    expect(tank.position.x).toBeLessThanOrEqual(1000);
    expect(tank.alive).toBe(true);
  });

  test('should handle tank movement', () => {
    const tank = engine.spawnTank('test_tank_1', false);
    const initialX = tank.position.x;

    engine.moveTank('test_tank_1', 1, 0, 1/60);
    engine.update(1/60);

    expect(tank.position.x).toBeGreaterThan(initialX);
  });

  test('should fire projectile from tank', () => {
    const tank = engine.spawnTank('test_tank_1', false);
    const state = engine.getState();

    const fired = engine.fireTank('test_tank_1');

    expect(fired).toBe(true);
    expect(state.projectiles.size).toBe(1);
  });

  test('should enforce fire rate limit', () => {
    const tank = engine.spawnTank('test_tank_1', false);

    const fired1 = engine.fireTank('test_tank_1');
    const fired2 = engine.fireTank('test_tank_1'); // Too soon

    expect(fired1).toBe(true);
    expect(fired2).toBe(false);
  });

  test('should detect projectile-tank collision', () => {
    const tank1 = engine.spawnTank('tank_1', false);
    const tank2 = engine.spawnTank('tank_2', false);

    // Position tank2 in front of tank1
    tank2.position = { x: tank1.position.x + 100, y: tank1.position.y };

    // Aim at tank2
    const angle = tank1.angleTo(tank2.position);
    engine.rotateTankTurret('tank_1', angle, 1/60);
    engine.fireTank('tank_1');

    // Simulate projectile reaching tank2
    for (let i = 0; i < 60; i++) {
      engine.update(1/60);
    }

    // Tank2 should have taken damage
    expect(tank2.health).toBeLessThan(100);
  });

  test('should remove dead tanks', () => {
    const tank = engine.spawnTank('test_tank_1', false);

    // Kill tank
    tank.takeDamage(1000);

    expect(tank.alive).toBe(false);
    expect(tank.health).toBe(0);
  });

  test('should enforce map boundaries', () => {
    const tank = engine.spawnTank('test_tank_1', false);

    // Try to move out of bounds
    tank.position = { x: -100, y: -100 };

    engine.update(1/60);

    // Should be pushed back in
    expect(tank.position.x).toBeGreaterThanOrEqual(20);
    expect(tank.position.y).toBeGreaterThanOrEqual(20);
  });

  test('should respawn tank', () => {
    const tank = engine.spawnTank('test_tank_1', false);

    // Kill tank
    tank.takeDamage(1000);
    expect(tank.alive).toBe(false);

    // Respawn
    engine.respawnTank('test_tank_1');
    expect(tank.alive).toBe(true);
    expect(tank.health).toBe(100);
  });
});

describe('Tank', () => {
  test('should take damage correctly', () => {
    const tank = new Tank('test', 100, 100);

    const destroyed = tank.takeDamage(50);

    expect(destroyed).toBe(false);
    expect(tank.health).toBe(50);
    expect(tank.alive).toBe(true);
  });

  test('should die when health reaches zero', () => {
    const tank = new Tank('test', 100, 100);

    const destroyed = tank.takeDamage(100);

    expect(destroyed).toBe(true);
    expect(tank.health).toBe(0);
    expect(tank.alive).toBe(false);
  });

  test('should apply shields', () => {
    const tank = new Tank('test', 100, 100);
    tank.shields = 30;

    tank.takeDamage(50);

    expect(tank.shields).toBe(0);
    expect(tank.health).toBe(80); // 50 - 30 shields = 20 damage
  });

  test('should apply power-ups', () => {
    const tank = new Tank('test', 100, 100);

    tank.applyPowerUp('shield');
    expect(tank.shields).toBe(50);

    tank.applyPowerUp('speed');
    expect(tank.speedBoost).toBe(1.5);
  });

  test('should calculate distance correctly', () => {
    const tank = new Tank('test', 0, 0);
    const distance = tank.distanceTo({ x: 3, y: 4 });

    expect(distance).toBe(5); // 3-4-5 triangle
  });

  test('should serialize correctly', () => {
    const tank = new Tank('test', 100, 100, false, 'player1');
    const serialized = tank.serialize();

    expect(serialized.id).toBe('test');
    expect(serialized.position.x).toBe(100);
    expect(serialized.position.y).toBe(100);
    expect(serialized.isAI).toBe(false);
    expect(serialized.playerId).toBe('player1');
  });
});

describe('Projectile', () => {
  test('should move in correct direction', () => {
    const projectile = new Projectile(
      'proj_1',
      { x: 0, y: 0 },
      0, // Angle: right
      'owner_1'
    );

    const initialX = projectile.position.x;
    projectile.update(1/60);

    expect(projectile.position.x).toBeGreaterThan(initialX);
    expect(projectile.position.y).toBeCloseTo(0);
  });

  test('should die after max range', () => {
    const projectile = new Projectile('proj_1', { x: 0, y: 0 }, 0, 'owner_1');

    // Simulate long flight
    for (let i = 0; i < 200; i++) {
      projectile.update(1/60);
    }

    expect(projectile.alive).toBe(false);
  });
});

// Mock for testing (since we don't have actual Jest in this environment)
const describe = (name: string, fn: () => void) => {
  console.log(`\nTest Suite: ${name}`);
  fn();
};

const test = (name: string, fn: () => void) => {
  try {
    fn();
    console.log(`  ✅ ${name}`);
  } catch (error) {
    console.log(`  ❌ ${name}`);
    console.error(`     ${error}`);
  }
};

const beforeEach = (fn: () => void) => {
  // Run before each test
};

const expect = (value: any) => ({
  toBe: (expected: any) => {
    if (value !== expected) {
      throw new Error(`Expected ${expected}, got ${value}`);
    }
  },
  toBeDefined: () => {
    if (value === undefined) {
      throw new Error('Expected value to be defined');
    }
  },
  toBeGreaterThan: (expected: number) => {
    if (value <= expected) {
      throw new Error(`Expected ${value} > ${expected}`);
    }
  },
  toBeGreaterThanOrEqual: (expected: number) => {
    if (value < expected) {
      throw new Error(`Expected ${value} >= ${expected}`);
    }
  },
  toBeLessThan: (expected: number) => {
    if (value >= expected) {
      throw new Error(`Expected ${value} < ${expected}`);
    }
  },
  toBeLessThanOrEqual: (expected: number) => {
    if (value > expected) {
      throw new Error(`Expected ${value} <= ${expected}`);
    }
  },
  toBeCloseTo: (expected: number, precision: number = 2) => {
    if (Math.abs(value - expected) > Math.pow(10, -precision)) {
      throw new Error(`Expected ${value} to be close to ${expected}`);
    }
  }
});

console.log('\n╔══════════════════════════════════════════════════════════╗');
console.log('║              RUNNING GAME LOGIC TESTS                    ║');
console.log('╚══════════════════════════════════════════════════════════╝');
