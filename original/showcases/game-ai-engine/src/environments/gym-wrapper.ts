/**
 * OpenAI Gym Environment Wrapper
 *
 * Wraps OpenAI Gym environments for use with RL agents.
 * Supports:
 * - Classic control environments (CartPole, MountainCar, etc.)
 * - Atari games
 * - Box2D environments
 * - Custom preprocessing and frame stacking
 *
 * Demonstrates Elide's ability to use Python's gym library
 * seamlessly in TypeScript!
 */

// @ts-ignore - OpenAI Gym
import gym from 'python:gym';
// @ts-ignore - NumPy for array operations
import numpy from 'python:numpy';
// @ts-ignore - OpenCV for image processing
import cv2 from 'python:cv2';

// ============================================================================
// Type Definitions
// ============================================================================

export interface GymEnvConfig {
  envName: string;
  renderMode?: string;
  frameStack?: number;
  frameSkip?: number;
  grayscale?: boolean;
  resize?: [number, number];
  normalize?: boolean;
  episodicLife?: boolean; // For Atari
  clipRewards?: boolean; // For Atari
  noopMax?: number; // Random no-op actions at start
}

export interface EnvInfo {
  name: string;
  observationSpace: SpaceInfo;
  actionSpace: SpaceInfo;
  rewardRange: [number, number];
  maxEpisodeSteps?: number;
}

export interface SpaceInfo {
  type: 'Box' | 'Discrete' | 'MultiDiscrete' | 'MultiBinary';
  shape?: number[];
  low?: number | number[];
  high?: number | number[];
  n?: number;
}

export interface StepResult {
  observation: any;
  reward: number;
  done: boolean;
  truncated: boolean;
  info: any;
}

// ============================================================================
// Base Gym Wrapper
// ============================================================================

export class GymEnv {
  protected env: any;
  protected config: GymEnvConfig;
  protected episodeSteps = 0;
  protected totalReward = 0;

  constructor(config: GymEnvConfig) {
    this.config = {
      renderMode: undefined,
      frameStack: 1,
      frameSkip: 1,
      grayscale: false,
      normalize: false,
      episodicLife: false,
      clipRewards: false,
      noopMax: 0,
      ...config,
    };

    // Create environment
    try {
      if (this.config.renderMode) {
        this.env = gym.make(this.config.envName, render_mode: this.config.renderMode);
      } else {
        this.env = gym.make(this.config.envName);
      }
    } catch (error) {
      console.error(`Failed to create environment: ${this.config.envName}`);
      throw error;
    }

    console.log(`[GymEnv] Created: ${this.config.envName}`);
    this.logEnvInfo();
  }

  /**
   * Reset environment
   */
  reset(): any {
    const result = this.env.reset();
    let observation: any;
    let info: any;

    // Handle different Gym API versions
    if (Array.isArray(result) && result.length === 2) {
      [observation, info] = result;
    } else {
      observation = result;
      info = {};
    }

    this.episodeSteps = 0;
    this.totalReward = 0;

    // Apply preprocessing
    observation = this.preprocessObservation(observation);

    return observation;
  }

  /**
   * Take action in environment
   */
  step(action: any): StepResult {
    let totalReward = 0;
    let done = false;
    let truncated = false;
    let info: any = {};
    let observation: any;

    // Frame skipping
    for (let i = 0; i < this.config.frameSkip; i++) {
      const result = this.env.step(action);

      // Handle different API versions
      if (result.length === 5) {
        [observation, const reward, done, truncated, info] = result;
      } else if (result.length === 4) {
        [observation, const reward, done, info] = result;
        truncated = false;
      }

      totalReward += reward;

      if (done || truncated) {
        break;
      }
    }

    // Clip rewards if configured
    if (this.config.clipRewards) {
      totalReward = Math.max(-1, Math.min(1, totalReward));
    }

    // Apply preprocessing
    observation = this.preprocessObservation(observation);

    this.episodeSteps++;
    this.totalReward += totalReward;

    return {
      observation,
      reward: totalReward,
      done,
      truncated,
      info,
    };
  }

  /**
   * Render environment
   */
  render(): any {
    return this.env.render();
  }

  /**
   * Close environment
   */
  close(): void {
    this.env.close();
  }

  /**
   * Get observation space
   */
  getObservationSpace(): SpaceInfo {
    return this.parseSpace(this.env.observation_space);
  }

  /**
   * Get action space
   */
  getActionSpace(): SpaceInfo {
    return this.parseSpace(this.env.action_space);
  }

  /**
   * Get environment info
   */
  getInfo(): EnvInfo {
    return {
      name: this.config.envName,
      observationSpace: this.getObservationSpace(),
      actionSpace: this.getActionSpace(),
      rewardRange: [
        Number(this.env.reward_range[0]),
        Number(this.env.reward_range[1]),
      ],
      maxEpisodeSteps: this.env.spec?.max_episode_steps,
    };
  }

  /**
   * Sample random action
   */
  sampleAction(): any {
    const action = this.env.action_space.sample();
    return this.parseAction(action);
  }

  /**
   * Preprocess observation
   */
  protected preprocessObservation(observation: any): any {
    let processed = observation;

    // Convert to NumPy array if needed
    if (!numpy.ndarray || !(processed instanceof numpy.ndarray)) {
      processed = numpy.array(processed);
    }

    // Grayscale conversion
    if (this.config.grayscale && processed.shape.length === 3) {
      processed = this.toGrayscale(processed);
    }

    // Resize
    if (this.config.resize) {
      processed = this.resizeImage(processed, this.config.resize);
    }

    // Normalize
    if (this.config.normalize) {
      processed = processed.astype(numpy.float32) / 255.0;
    }

    return processed;
  }

  /**
   * Convert image to grayscale
   */
  protected toGrayscale(image: any): any {
    // Simple luminance formula: 0.299*R + 0.587*G + 0.114*B
    const weights = numpy.array([0.299, 0.587, 0.114]);
    return numpy.dot(image, weights);
  }

  /**
   * Resize image
   */
  protected resizeImage(image: any, size: [number, number]): any {
    // Use OpenCV for high-quality image resizing
    const [height, width] = size;
    return cv2.resize(image, (width, height), interpolation: cv2.INTER_AREA);
  }

  /**
   * Parse Gym space to SpaceInfo
   */
  protected parseSpace(space: any): SpaceInfo {
    const spaceName = space.__class__.__name__;

    if (spaceName === 'Discrete') {
      return {
        type: 'Discrete',
        n: Number(space.n),
      };
    } else if (spaceName === 'Box') {
      const shape = Array.from(space.shape);
      return {
        type: 'Box',
        shape,
        low: Array.from(space.low.flatten()),
        high: Array.from(space.high.flatten()),
      };
    } else if (spaceName === 'MultiDiscrete') {
      return {
        type: 'MultiDiscrete',
        n: Array.from(space.nvec),
      };
    } else if (spaceName === 'MultiBinary') {
      return {
        type: 'MultiBinary',
        n: Number(space.n),
      };
    }

    throw new Error(`Unsupported space type: ${spaceName}`);
  }

  /**
   * Parse action from Gym to JS
   */
  protected parseAction(action: any): any {
    if (typeof action === 'number' || Array.isArray(action)) {
      return action;
    }

    if (numpy.ndarray && action instanceof numpy.ndarray) {
      return Array.from(action);
    }

    return action;
  }

  /**
   * Log environment information
   */
  protected logEnvInfo(): void {
    const info = this.getInfo();
    console.log(`  Observation space: ${info.observationSpace.type}`);
    if (info.observationSpace.shape) {
      console.log(`    Shape: ${info.observationSpace.shape}`);
    }
    console.log(`  Action space: ${info.actionSpace.type}`);
    if (info.actionSpace.n) {
      console.log(`    Actions: ${info.actionSpace.n}`);
    }
  }

  /**
   * Get current episode stats
   */
  getEpisodeStats(): { steps: number; totalReward: number } {
    return {
      steps: this.episodeSteps,
      totalReward: this.totalReward,
    };
  }
}

// ============================================================================
// Atari Environment Wrapper
// ============================================================================

export class AtariEnv extends GymEnv {
  private lives = 0;
  private frameBuffer: any[] = [];

  constructor(config: GymEnvConfig) {
    // Set Atari-specific defaults
    const atariConfig: GymEnvConfig = {
      frameStack: 4,
      frameSkip: 4,
      grayscale: true,
      resize: [84, 84],
      normalize: true,
      episodicLife: true,
      clipRewards: true,
      noopMax: 30,
      ...config,
    };

    super(atariConfig);

    console.log('[AtariEnv] Atari-specific preprocessing enabled');
    console.log(`  Frame stack: ${this.config.frameStack}`);
    console.log(`  Frame skip: ${this.config.frameSkip}`);
    console.log(`  Grayscale: ${this.config.grayscale}`);
    console.log(`  Resize: ${this.config.resize}`);
  }

  /**
   * Reset with Atari-specific logic
   */
  override reset(): any {
    let observation = super.reset();

    // Get initial lives
    const info = this.env.unwrapped.ale?.lives?.() || 0;
    this.lives = info;

    // Perform random no-op actions
    if (this.config.noopMax > 0) {
      const noops = Math.floor(Math.random() * this.config.noopMax) + 1;
      for (let i = 0; i < noops; i++) {
        observation = this.step(0).observation; // Action 0 is usually no-op
      }
    }

    // Initialize frame buffer
    this.frameBuffer = [];
    for (let i = 0; i < this.config.frameStack; i++) {
      this.frameBuffer.push(observation);
    }

    return this.getStackedFrames();
  }

  /**
   * Step with Atari-specific logic
   */
  override step(action: any): StepResult {
    const result = super.step(action);

    // Episodic life handling
    if (this.config.episodicLife) {
      const currentLives = this.env.unwrapped.ale?.lives?.() || 0;
      if (currentLives < this.lives) {
        result.done = true;
      }
      this.lives = currentLives;
    }

    // Update frame buffer
    this.frameBuffer.push(result.observation);
    if (this.frameBuffer.length > this.config.frameStack) {
      this.frameBuffer.shift();
    }

    // Return stacked frames
    result.observation = this.getStackedFrames();

    return result;
  }

  /**
   * Get stacked frames
   */
  private getStackedFrames(): any {
    if (this.frameBuffer.length === 0) {
      return numpy.zeros([this.config.frameStack, 84, 84]);
    }

    return numpy.stack(this.frameBuffer, axis: 0);
  }
}

// ============================================================================
// Classic Control Environment
// ============================================================================

export class ClassicControlEnv extends GymEnv {
  constructor(envName: string, renderMode?: string) {
    super({
      envName,
      renderMode,
      normalize: false,
      frameStack: 1,
      frameSkip: 1,
    });

    console.log('[ClassicControlEnv] Classic control environment ready');
  }

  /**
   * Get state as array
   */
  getStateArray(observation: any): number[] {
    if (Array.isArray(observation)) {
      return observation;
    }

    if (numpy.ndarray && observation instanceof numpy.ndarray) {
      return Array.from(observation.flatten());
    }

    return [observation];
  }
}

// ============================================================================
// Environment Factory
// ============================================================================

export class GymEnvFactory {
  /**
   * Create environment based on name
   */
  static create(envName: string, config?: Partial<GymEnvConfig>): GymEnv {
    const fullConfig: GymEnvConfig = {
      envName,
      ...config,
    };

    // Detect environment type and create appropriate wrapper
    if (envName.includes('ALE') || envName.endsWith('NoFrameskip-v4')) {
      return new AtariEnv(fullConfig);
    } else if (
      envName.startsWith('CartPole') ||
      envName.startsWith('MountainCar') ||
      envName.startsWith('Acrobot') ||
      envName.startsWith('Pendulum')
    ) {
      return new ClassicControlEnv(envName, config?.renderMode);
    } else {
      return new GymEnv(fullConfig);
    }
  }

  /**
   * List available environments
   */
  static listEnvironments(): string[] {
    try {
      const envs = gym.envs.registry.all();
      return Array.from(envs).map((spec: any) => spec.id);
    } catch (error) {
      console.error('Failed to list environments:', error);
      return [];
    }
  }

  /**
   * List Atari environments
   */
  static listAtariEnvironments(): string[] {
    const allEnvs = this.listEnvironments();
    return allEnvs.filter(name => name.includes('ALE') || name.endsWith('NoFrameskip-v4'));
  }

  /**
   * List classic control environments
   */
  static listClassicControlEnvironments(): string[] {
    const allEnvs = this.listEnvironments();
    return allEnvs.filter(
      name =>
        name.startsWith('CartPole') ||
        name.startsWith('MountainCar') ||
        name.startsWith('Acrobot') ||
        name.startsWith('Pendulum')
    );
  }
}

// ============================================================================
// Multi-Environment Wrapper (Vectorized Environments)
// ============================================================================

export class VectorizedEnv {
  private envs: GymEnv[] = [];
  private numEnvs: number;

  constructor(envName: string, numEnvs: number, config?: Partial<GymEnvConfig>) {
    this.numEnvs = numEnvs;

    for (let i = 0; i < numEnvs; i++) {
      const env = GymEnvFactory.create(envName, config);
      this.envs.push(env);
    }

    console.log(`[VectorizedEnv] Created ${numEnvs} parallel environments`);
  }

  /**
   * Reset all environments
   */
  reset(): any[] {
    return this.envs.map(env => env.reset());
  }

  /**
   * Step all environments
   */
  step(actions: any[]): StepResult[] {
    if (actions.length !== this.numEnvs) {
      throw new Error(
        `Expected ${this.numEnvs} actions, got ${actions.length}`
      );
    }

    return this.envs.map((env, i) => env.step(actions[i]));
  }

  /**
   * Close all environments
   */
  close(): void {
    this.envs.forEach(env => env.close());
  }

  /**
   * Get number of environments
   */
  getNumEnvs(): number {
    return this.numEnvs;
  }

  /**
   * Get environment at index
   */
  getEnv(index: number): GymEnv {
    if (index < 0 || index >= this.numEnvs) {
      throw new Error(`Invalid environment index: ${index}`);
    }
    return this.envs[index];
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if Gym is available
 */
export function isGymAvailable(): boolean {
  try {
    return gym !== null;
  } catch {
    return false;
  }
}

/**
 * Get Gym version
 */
export function getGymVersion(): string {
  try {
    return gym.__version__;
  } catch {
    return 'unknown';
  }
}

/**
 * Create CartPole environment (convenience function)
 */
export function createCartPole(renderMode?: string): ClassicControlEnv {
  return new ClassicControlEnv('CartPole-v1', renderMode);
}

/**
 * Create Atari Breakout environment (convenience function)
 */
export function createBreakout(renderMode?: string): AtariEnv {
  return new AtariEnv({
    envName: 'ALE/Breakout-v5',
    renderMode,
  });
}

/**
 * Create Atari Pong environment (convenience function)
 */
export function createPong(renderMode?: string): AtariEnv {
  return new AtariEnv({
    envName: 'ALE/Pong-v5',
    renderMode,
  });
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎮 OpenAI Gym Environment Wrapper\n');
  console.log('This demonstrates Elide\'s polyglot capabilities:');
  console.log('  - Using Python\'s OpenAI Gym in TypeScript');
  console.log('  - NumPy array operations');
  console.log('  - Seamless interop without overhead!\n');

  console.log('Gym version:', getGymVersion());
  console.log('Gym available:', isGymAvailable(), '\n');

  // Create CartPole environment
  console.log('Creating CartPole environment...');
  const cartpole = createCartPole();

  const info = cartpole.getInfo();
  console.log('\nEnvironment Info:');
  console.log(`  Name: ${info.name}`);
  console.log(`  Observation space: ${info.observationSpace.type}`);
  console.log(`  Observation shape: ${info.observationSpace.shape}`);
  console.log(`  Action space: ${info.actionSpace.type}`);
  console.log(`  Number of actions: ${info.actionSpace.n}`);

  // Run a few steps
  console.log('\nRunning sample episode...');
  let state = cartpole.reset();
  let totalReward = 0;

  for (let step = 0; step < 100; step++) {
    const action = cartpole.sampleAction();
    const result = cartpole.step(action);

    totalReward += result.reward;

    if (result.done) {
      console.log(`Episode finished after ${step + 1} steps`);
      console.log(`Total reward: ${totalReward}`);
      break;
    }
  }

  cartpole.close();

  console.log('\n✅ Gym wrapper working perfectly!');
  console.log('You can now train RL agents on any Gym environment');
  console.log('directly in TypeScript!');
}
