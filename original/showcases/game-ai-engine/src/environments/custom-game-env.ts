/**
 * Custom Game Environments
 *
 * Collection of custom game environments for RL training:
 * - Grid World (navigation, obstacles)
 * - Snake Game (classic arcade)
 * - Maze Navigation (pathfinding)
 * - Tower Defense (strategy)
 * - Combat Arena (multi-agent)
 * - Resource Collection (RTS-style)
 *
 * Demonstrates custom environment creation with configurable
 * state/action spaces and reward shaping using NumPy.
 */

// @ts-ignore - NumPy for numerical operations
import numpy from 'python:numpy';
// @ts-ignore - Random for randomization
import random from 'python:random';

// ============================================================================
// Type Definitions
// ============================================================================

export interface EnvironmentConfig {
  seed?: number;
  renderMode?: 'human' | 'rgb_array' | 'ansi' | null;
}

export interface StepResult {
  observation: any;
  reward: number;
  done: boolean;
  truncated: boolean;
  info: Record<string, any>;
}

export interface SpaceConfig {
  type: 'discrete' | 'continuous' | 'multi-discrete';
  size?: number;
  low?: number[];
  high?: number[];
  shape?: number[];
}

// ============================================================================
// Base Environment Class
// ============================================================================

export abstract class BaseGameEnv {
  protected renderMode: string | null;
  protected episode = 0;
  protected steps = 0;

  constructor(config: EnvironmentConfig = {}) {
    this.renderMode = config.renderMode || null;

    if (config.seed !== undefined) {
      this.seed(config.seed);
    }
  }

  abstract reset(): any;
  abstract step(action: any): StepResult;
  abstract getObservationSpace(): SpaceConfig;
  abstract getActionSpace(): SpaceConfig;

  render(): string | null {
    return null;
  }

  close(): void {
    // Override if needed
  }

  seed(seed: number): void {
    numpy.random.seed(seed);
    random.seed(seed);
  }

  getEpisode(): number {
    return this.episode;
  }

  getSteps(): number {
    return this.steps;
  }
}

// ============================================================================
// Grid World Environment
// ============================================================================

export interface GridWorldConfig extends EnvironmentConfig {
  gridSize?: number;
  numObstacles?: number;
  numGoals?: number;
  maxSteps?: number;
  rewardGoal?: number;
  rewardStep?: number;
  rewardObstacle?: number;
}

export class GridWorld extends BaseGameEnv {
  private config: Required<GridWorldConfig>;
  private gridSize: number;
  private grid: any; // NumPy array
  private agentPos: [number, number] = [0, 0];
  private goalPositions: [number, number][] = [];
  private obstaclePositions: [number, number][] = [];
  private currentSteps = 0;

  constructor(config: GridWorldConfig = {}) {
    super(config);

    this.config = {
      gridSize: 10,
      numObstacles: 10,
      numGoals: 1,
      maxSteps: 200,
      rewardGoal: 10.0,
      rewardStep: -0.01,
      rewardObstacle: -1.0,
      renderMode: config.renderMode || null,
      seed: config.seed,
      ...config,
    };

    this.gridSize = this.config.gridSize;
    this.grid = numpy.zeros([this.gridSize, this.gridSize]);

    console.log('[GridWorld] Initialized');
    console.log(`  Grid size: ${this.gridSize}x${this.gridSize}`);
    console.log(`  Obstacles: ${this.config.numObstacles}`);
    console.log(`  Goals: ${this.config.numGoals}`);
  }

  reset(): any {
    this.grid = numpy.zeros([this.gridSize, this.gridSize]);
    this.currentSteps = 0;
    this.episode++;

    // Place agent at random position
    this.agentPos = [
      Math.floor(Math.random() * this.gridSize),
      Math.floor(Math.random() * this.gridSize),
    ];

    // Place obstacles
    this.obstaclePositions = [];
    for (let i = 0; i < this.config.numObstacles; i++) {
      let pos: [number, number];
      do {
        pos = [
          Math.floor(Math.random() * this.gridSize),
          Math.floor(Math.random() * this.gridSize),
        ];
      } while (this.isPositionOccupied(pos));

      this.obstaclePositions.push(pos);
      this.grid[pos[0]][pos[1]] = -1; // -1 for obstacles
    }

    // Place goals
    this.goalPositions = [];
    for (let i = 0; i < this.config.numGoals; i++) {
      let pos: [number, number];
      do {
        pos = [
          Math.floor(Math.random() * this.gridSize),
          Math.floor(Math.random() * this.gridSize),
        ];
      } while (this.isPositionOccupied(pos));

      this.goalPositions.push(pos);
      this.grid[pos[0]][pos[1]] = 1; // 1 for goals
    }

    // Mark agent position
    this.grid[this.agentPos[0]][this.agentPos[1]] = 0.5;

    return this.getObservation();
  }

  step(action: number): StepResult {
    this.currentSteps++;
    this.steps++;

    // Actions: 0=up, 1=right, 2=down, 3=left
    const moves: [number, number][] = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];

    const [dy, dx] = moves[action];
    const newY = this.agentPos[0] + dy;
    const newX = this.agentPos[1] + dx;

    let reward = this.config.rewardStep;
    let done = false;

    // Check bounds
    if (newY >= 0 && newY < this.gridSize && newX >= 0 && newX < this.gridSize) {
      // Clear old position
      this.grid[this.agentPos[0]][this.agentPos[1]] = 0;

      // Update position
      this.agentPos = [newY, newX];

      // Check if hit obstacle
      if (this.isObstacle(this.agentPos)) {
        reward = this.config.rewardObstacle;
      }

      // Check if reached goal
      if (this.isGoal(this.agentPos)) {
        reward = this.config.rewardGoal;
        done = true;
      }

      // Mark new position
      if (!this.isObstacle(this.agentPos) && !this.isGoal(this.agentPos)) {
        this.grid[this.agentPos[0]][this.agentPos[1]] = 0.5;
      }
    }

    // Check max steps
    const truncated = this.currentSteps >= this.config.maxSteps;
    if (truncated) {
      done = true;
    }

    return {
      observation: this.getObservation(),
      reward,
      done,
      truncated,
      info: {
        agentPos: this.agentPos,
        steps: this.currentSteps,
      },
    };
  }

  private getObservation(): any {
    // Return flattened grid as observation
    return this.grid.flatten();
  }

  private isPositionOccupied(pos: [number, number]): boolean {
    if (pos[0] === this.agentPos[0] && pos[1] === this.agentPos[1]) {
      return true;
    }

    for (const obstacle of this.obstaclePositions) {
      if (obstacle[0] === pos[0] && obstacle[1] === pos[1]) {
        return true;
      }
    }

    for (const goal of this.goalPositions) {
      if (goal[0] === pos[0] && goal[1] === pos[1]) {
        return true;
      }
    }

    return false;
  }

  private isObstacle(pos: [number, number]): boolean {
    return this.obstaclePositions.some(
      obstacle => obstacle[0] === pos[0] && obstacle[1] === pos[1]
    );
  }

  private isGoal(pos: [number, number]): boolean {
    return this.goalPositions.some(
      goal => goal[0] === pos[0] && goal[1] === pos[1]
    );
  }

  getObservationSpace(): SpaceConfig {
    return {
      type: 'continuous',
      shape: [this.gridSize * this.gridSize],
      low: Array(this.gridSize * this.gridSize).fill(-1),
      high: Array(this.gridSize * this.gridSize).fill(1),
    };
  }

  getActionSpace(): SpaceConfig {
    return {
      type: 'discrete',
      size: 4, // up, right, down, left
    };
  }

  override render(): string {
    let output = '\n';

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.agentPos[0] === y && this.agentPos[1] === x) {
          output += 'A ';
        } else if (this.isObstacle([y, x])) {
          output += 'X ';
        } else if (this.isGoal([y, x])) {
          output += 'G ';
        } else {
          output += '. ';
        }
      }
      output += '\n';
    }

    output += `Steps: ${this.currentSteps}/${this.config.maxSteps}\n`;
    return output;
  }
}

// ============================================================================
// Snake Game Environment
// ============================================================================

export interface SnakeConfig extends EnvironmentConfig {
  gridSize?: number;
  maxSteps?: number;
  rewardFood?: number;
  rewardDeath?: number;
  rewardStep?: number;
}

export class SnakeEnv extends BaseGameEnv {
  private config: Required<SnakeConfig>;
  private gridSize: number;
  private snake: [number, number][] = [];
  private food: [number, number] = [0, 0];
  private direction: number = 1; // 0=up, 1=right, 2=down, 3=left
  private currentSteps = 0;
  private score = 0;

  constructor(config: SnakeConfig = {}) {
    super(config);

    this.config = {
      gridSize: 10,
      maxSteps: 1000,
      rewardFood: 10.0,
      rewardDeath: -10.0,
      rewardStep: -0.01,
      renderMode: config.renderMode || null,
      seed: config.seed,
      ...config,
    };

    this.gridSize = this.config.gridSize;

    console.log('[SnakeEnv] Initialized');
    console.log(`  Grid size: ${this.gridSize}x${this.gridSize}`);
  }

  reset(): any {
    this.currentSteps = 0;
    this.score = 0;
    this.episode++;

    // Initialize snake in center
    const center = Math.floor(this.gridSize / 2);
    this.snake = [[center, center]];
    this.direction = 1; // Start moving right

    // Place food
    this.placeFood();

    return this.getObservation();
  }

  step(action: number): StepResult {
    this.currentSteps++;
    this.steps++;

    // Actions: 0=straight, 1=turn right, 2=turn left
    if (action === 1) {
      this.direction = (this.direction + 1) % 4;
    } else if (action === 2) {
      this.direction = (this.direction + 3) % 4;
    }

    // Move snake
    const head = this.snake[0];
    const moves: [number, number][] = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];
    const [dy, dx] = moves[this.direction];
    const newHead: [number, number] = [head[0] + dy, head[1] + dx];

    let reward = this.config.rewardStep;
    let done = false;

    // Check collision with walls
    if (
      newHead[0] < 0 ||
      newHead[0] >= this.gridSize ||
      newHead[1] < 0 ||
      newHead[1] >= this.gridSize
    ) {
      reward = this.config.rewardDeath;
      done = true;
    }

    // Check collision with self
    if (!done && this.snake.some(segment => segment[0] === newHead[0] && segment[1] === newHead[1])) {
      reward = this.config.rewardDeath;
      done = true;
    }

    if (!done) {
      // Add new head
      this.snake.unshift(newHead);

      // Check if food is eaten
      if (newHead[0] === this.food[0] && newHead[1] === this.food[1]) {
        reward = this.config.rewardFood;
        this.score++;
        this.placeFood();
      } else {
        // Remove tail
        this.snake.pop();
      }
    }

    // Check max steps
    const truncated = this.currentSteps >= this.config.maxSteps;
    if (truncated) {
      done = true;
    }

    return {
      observation: this.getObservation(),
      reward,
      done,
      truncated,
      info: {
        score: this.score,
        length: this.snake.length,
        steps: this.currentSteps,
      },
    };
  }

  private placeFood(): void {
    let pos: [number, number];
    do {
      pos = [
        Math.floor(Math.random() * this.gridSize),
        Math.floor(Math.random() * this.gridSize),
      ];
    } while (this.snake.some(segment => segment[0] === pos[0] && segment[1] === pos[1]));

    this.food = pos;
  }

  private getObservation(): any {
    // Create grid representation
    const grid = numpy.zeros([this.gridSize, this.gridSize]);

    // Mark snake
    for (const [y, x] of this.snake) {
      grid[y][x] = 0.5;
    }

    // Mark head
    const [headY, headX] = this.snake[0];
    grid[headY][headX] = 1.0;

    // Mark food
    grid[this.food[0]][this.food[1]] = -1.0;

    return grid.flatten();
  }

  getObservationSpace(): SpaceConfig {
    return {
      type: 'continuous',
      shape: [this.gridSize * this.gridSize],
      low: Array(this.gridSize * this.gridSize).fill(-1),
      high: Array(this.gridSize * this.gridSize).fill(1),
    };
  }

  getActionSpace(): SpaceConfig {
    return {
      type: 'discrete',
      size: 3, // straight, turn right, turn left
    };
  }

  override render(): string {
    let output = '\n';

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.snake[0][0] === y && this.snake[0][1] === x) {
          output += 'H '; // Head
        } else if (this.snake.slice(1).some(s => s[0] === y && s[1] === x)) {
          output += 'S '; // Snake body
        } else if (this.food[0] === y && this.food[1] === x) {
          output += 'F '; // Food
        } else {
          output += '. ';
        }
      }
      output += '\n';
    }

    output += `Score: ${this.score} | Length: ${this.snake.length} | Steps: ${this.currentSteps}\n`;
    return output;
  }
}

// ============================================================================
// Maze Navigation Environment
// ============================================================================

export interface MazeConfig extends EnvironmentConfig {
  mazeSize?: number;
  wallDensity?: number;
  maxSteps?: number;
}

export class MazeEnv extends BaseGameEnv {
  private config: Required<MazeConfig>;
  private mazeSize: number;
  private maze: any; // NumPy array
  private agentPos: [number, number] = [0, 0];
  private goalPos: [number, number] = [0, 0];
  private currentSteps = 0;

  constructor(config: MazeConfig = {}) {
    super(config);

    this.config = {
      mazeSize: 15,
      wallDensity: 0.3,
      maxSteps: 500,
      renderMode: config.renderMode || null,
      seed: config.seed,
      ...config,
    };

    this.mazeSize = this.config.mazeSize;
    this.maze = numpy.zeros([this.mazeSize, this.mazeSize]);

    console.log('[MazeEnv] Initialized');
    console.log(`  Maze size: ${this.mazeSize}x${this.mazeSize}`);
  }

  reset(): any {
    this.currentSteps = 0;
    this.episode++;

    // Generate maze
    this.generateMaze();

    // Place agent at start (top-left)
    this.agentPos = [0, 0];
    this.maze[0][0] = 0;

    // Place goal at end (bottom-right)
    this.goalPos = [this.mazeSize - 1, this.mazeSize - 1];
    this.maze[this.goalPos[0]][this.goalPos[1]] = 0;

    return this.getObservation();
  }

  step(action: number): StepResult {
    this.currentSteps++;
    this.steps++;

    // Actions: 0=up, 1=right, 2=down, 3=left
    const moves: [number, number][] = [
      [-1, 0],
      [0, 1],
      [1, 0],
      [0, -1],
    ];

    const [dy, dx] = moves[action];
    const newY = this.agentPos[0] + dy;
    const newX = this.agentPos[1] + dx;

    let reward = -0.01; // Small penalty per step
    let done = false;

    // Check bounds and walls
    if (
      newY >= 0 &&
      newY < this.mazeSize &&
      newX >= 0 &&
      newX < this.mazeSize &&
      this.maze[newY][newX] === 0
    ) {
      this.agentPos = [newY, newX];

      // Check if reached goal
      if (newY === this.goalPos[0] && newX === this.goalPos[1]) {
        reward = 10.0;
        done = true;
      }
    } else {
      reward = -0.1; // Penalty for hitting wall
    }

    // Check max steps
    const truncated = this.currentSteps >= this.config.maxSteps;
    if (truncated) {
      done = true;
    }

    return {
      observation: this.getObservation(),
      reward,
      done,
      truncated,
      info: {
        agentPos: this.agentPos,
        goalPos: this.goalPos,
        steps: this.currentSteps,
      },
    };
  }

  private generateMaze(): void {
    // Simple maze generation - random walls
    this.maze = numpy.zeros([this.mazeSize, this.mazeSize]);

    for (let y = 0; y < this.mazeSize; y++) {
      for (let x = 0; x < this.mazeSize; x++) {
        if (Math.random() < this.config.wallDensity) {
          this.maze[y][x] = 1; // Wall
        }
      }
    }
  }

  private getObservation(): any {
    const obs = this.maze.copy();

    // Mark agent position
    obs[this.agentPos[0]][this.agentPos[1]] = 0.5;

    // Mark goal position
    obs[this.goalPos[0]][this.goalPos[1]] = -1;

    return obs.flatten();
  }

  getObservationSpace(): SpaceConfig {
    return {
      type: 'continuous',
      shape: [this.mazeSize * this.mazeSize],
      low: Array(this.mazeSize * this.mazeSize).fill(-1),
      high: Array(this.mazeSize * this.mazeSize).fill(1),
    };
  }

  getActionSpace(): SpaceConfig {
    return {
      type: 'discrete',
      size: 4,
    };
  }

  override render(): string {
    let output = '\n';

    for (let y = 0; y < this.mazeSize; y++) {
      for (let x = 0; x < this.mazeSize; x++) {
        if (this.agentPos[0] === y && this.agentPos[1] === x) {
          output += 'A ';
        } else if (this.goalPos[0] === y && this.goalPos[1] === x) {
          output += 'G ';
        } else if (this.maze[y][x] === 1) {
          output += '█ ';
        } else {
          output += '  ';
        }
      }
      output += '\n';
    }

    output += `Steps: ${this.currentSteps}/${this.config.maxSteps}\n`;
    return output;
  }
}

// ============================================================================
// Resource Collection Environment
// ============================================================================

export interface ResourceCollectionConfig extends EnvironmentConfig {
  gridSize?: number;
  numResources?: number;
  maxSteps?: number;
}

export class ResourceCollectionEnv extends BaseGameEnv {
  private config: Required<ResourceCollectionConfig>;
  private gridSize: number;
  private agentPos: [number, number] = [0, 0];
  private resources: Map<string, [number, number]> = new Map();
  private collected = 0;
  private currentSteps = 0;

  constructor(config: ResourceCollectionConfig = {}) {
    super(config);

    this.config = {
      gridSize: 12,
      numResources: 5,
      maxSteps: 300,
      renderMode: config.renderMode || null,
      seed: config.seed,
      ...config,
    };

    this.gridSize = this.config.gridSize;

    console.log('[ResourceCollectionEnv] Initialized');
    console.log(`  Grid size: ${this.gridSize}x${this.gridSize}`);
    console.log(`  Resources: ${this.config.numResources}`);
  }

  reset(): any {
    this.currentSteps = 0;
    this.collected = 0;
    this.episode++;

    // Place agent
    this.agentPos = [
      Math.floor(Math.random() * this.gridSize),
      Math.floor(Math.random() * this.gridSize),
    ];

    // Place resources
    this.resources.clear();
    for (let i = 0; i < this.config.numResources; i++) {
      let pos: [number, number];
      do {
        pos = [
          Math.floor(Math.random() * this.gridSize),
          Math.floor(Math.random() * this.gridSize),
        ];
      } while (
        (pos[0] === this.agentPos[0] && pos[1] === this.agentPos[1]) ||
        Array.from(this.resources.values()).some(
          r => r[0] === pos[0] && r[1] === pos[1]
        )
      );

      this.resources.set(`resource_${i}`, pos);
    }

    return this.getObservation();
  }

  step(action: number): StepResult {
    this.currentSteps++;
    this.steps++;

    // Actions: 0=up, 1=right, 2=down, 3=left, 4=collect
    let reward = -0.01;
    let done = false;

    if (action === 4) {
      // Collect action
      const toRemove: string[] = [];
      for (const [key, pos] of this.resources.entries()) {
        if (pos[0] === this.agentPos[0] && pos[1] === this.agentPos[1]) {
          reward = 5.0;
          this.collected++;
          toRemove.push(key);
        }
      }

      toRemove.forEach(key => this.resources.delete(key));

      // Check if all resources collected
      if (this.resources.size === 0) {
        reward = 20.0;
        done = true;
      }
    } else {
      // Movement
      const moves: [number, number][] = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ];

      const [dy, dx] = moves[action];
      const newY = this.agentPos[0] + dy;
      const newX = this.agentPos[1] + dx;

      // Check bounds
      if (
        newY >= 0 &&
        newY < this.gridSize &&
        newX >= 0 &&
        newX < this.gridSize
      ) {
        this.agentPos = [newY, newX];
      }
    }

    // Check max steps
    const truncated = this.currentSteps >= this.config.maxSteps;
    if (truncated) {
      done = true;
    }

    return {
      observation: this.getObservation(),
      reward,
      done,
      truncated,
      info: {
        collected: this.collected,
        remaining: this.resources.size,
        steps: this.currentSteps,
      },
    };
  }

  private getObservation(): any {
    const grid = numpy.zeros([this.gridSize, this.gridSize]);

    // Mark agent
    grid[this.agentPos[0]][this.agentPos[1]] = 1.0;

    // Mark resources
    for (const pos of this.resources.values()) {
      grid[pos[0]][pos[1]] = -1.0;
    }

    return grid.flatten();
  }

  getObservationSpace(): SpaceConfig {
    return {
      type: 'continuous',
      shape: [this.gridSize * this.gridSize],
      low: Array(this.gridSize * this.gridSize).fill(-1),
      high: Array(this.gridSize * this.gridSize).fill(1),
    };
  }

  getActionSpace(): SpaceConfig {
    return {
      type: 'discrete',
      size: 5, // up, right, down, left, collect
    };
  }

  override render(): string {
    let output = '\n';

    for (let y = 0; y < this.gridSize; y++) {
      for (let x = 0; x < this.gridSize; x++) {
        if (this.agentPos[0] === y && this.agentPos[1] === x) {
          output += 'A ';
        } else if (
          Array.from(this.resources.values()).some(
            r => r[0] === y && r[1] === x
          )
        ) {
          output += 'R ';
        } else {
          output += '. ';
        }
      }
      output += '\n';
    }

    output += `Collected: ${this.collected}/${this.config.numResources} | Steps: ${this.currentSteps}\n`;
    return output;
  }
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Custom Game Environments\n');
  console.log('This demonstrates:');
  console.log('  - Custom environment creation');
  console.log('  - NumPy array operations in TypeScript');
  console.log('  - Configurable state/action spaces');
  console.log('  - Reward shaping\n');

  // Test Grid World
  console.log('Testing Grid World...');
  const gridWorld = new GridWorld({ gridSize: 5, numObstacles: 3 });
  gridWorld.reset();
  console.log(gridWorld.render());

  // Test Snake
  console.log('\nTesting Snake Game...');
  const snake = new SnakeEnv({ gridSize: 6 });
  snake.reset();
  console.log(snake.render());

  console.log('\n✅ Custom environments ready for RL training!');
}
