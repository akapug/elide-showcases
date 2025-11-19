/**
 * Reinforcement Learning for Game AI
 *
 * Demonstrates training game AI agents using TensorFlow and PyTorch
 * directly in TypeScript - uniquely enabled by Elide!
 */

// @ts-ignore - Deep learning framework
import tensorflow from 'python:tensorflow';
// @ts-ignore - Alternative deep learning framework
import torch from 'python:torch';
// @ts-ignore - Numerical computing
import numpy from 'python:numpy';

// ============================================================================
// Types
// ============================================================================

export interface RLConfig {
  stateSize: number;
  actionSize: number;
  hiddenLayers?: number[];
  learningRate?: number;
  discount?: number; // gamma
  epsilon?: number; // exploration rate
  epsilonMin?: number;
  epsilonDecay?: number;
  batchSize?: number;
  memorySize?: number;
  targetUpdateFreq?: number;
}

export interface TrainingStats {
  episode: number;
  totalReward: number;
  avgReward: number;
  epsilon: number;
  loss: number;
  steps: number;
}

export interface Experience {
  state: any; // NumPy array
  action: number;
  reward: number;
  nextState: any;
  done: boolean;
}

// ============================================================================
// Deep Q-Network (DQN) Agent
// ============================================================================

export class DQNAgent {
  private config: Required<RLConfig>;
  private model: any; // TensorFlow model
  private targetModel: any;
  private memory: Experience[] = [];
  private epsilon: number;
  private trainingSteps = 0;

  constructor(config: RLConfig) {
    this.config = {
      hiddenLayers: [128, 64],
      learningRate: 0.001,
      discount: 0.95,
      epsilon: 1.0,
      epsilonMin: 0.01,
      epsilonDecay: 0.995,
      batchSize: 32,
      memorySize: 10000,
      targetUpdateFreq: 100,
      ...config,
    };

    this.epsilon = this.config.epsilon;

    // Build neural networks using TensorFlow in TypeScript!
    this.model = this.buildModel();
    this.targetModel = this.buildModel();

    this.updateTargetModel();

    console.log('[DQN] Agent initialized');
    console.log(`  State size: ${this.config.stateSize}`);
    console.log(`  Action size: ${this.config.actionSize}`);
    console.log(`  Hidden layers: ${this.config.hiddenLayers.join(', ')}`);
  }

  /**
   * Build DQN neural network using TensorFlow
   *
   * This is uniquely enabled by Elide - building TensorFlow models
   * directly in TypeScript!
   */
  private buildModel(): any {
    console.log('[DQN] Building neural network with TensorFlow...');

    const layers = [];

    // Input layer
    layers.push(
      tensorflow.keras.layers.Dense(this.config.hiddenLayers[0], {
        activation: 'relu',
        inputShape: [this.config.stateSize],
      })
    );

    // Hidden layers
    for (let i = 1; i < this.config.hiddenLayers.length; i++) {
      layers.push(
        tensorflow.keras.layers.Dense(this.config.hiddenLayers[i], {
          activation: 'relu',
        })
      );
    }

    // Output layer (Q-values for each action)
    layers.push(
      tensorflow.keras.layers.Dense(this.config.actionSize, {
        activation: 'linear',
      })
    );

    // Create model
    const model = tensorflow.keras.Sequential(layers);

    // Compile with Adam optimizer
    model.compile({
      optimizer: tensorflow.keras.optimizers.Adam({
        learningRate: this.config.learningRate,
      }),
      loss: 'mse',
      metrics: ['mae'],
    });

    console.log('  ✓ Model built');

    return model;
  }

  /**
   * Select action using epsilon-greedy policy
   */
  selectAction(state: any): number {
    // Exploration vs exploitation
    if (Math.random() < this.epsilon) {
      // Random action (exploration)
      return Math.floor(Math.random() * this.config.actionSize);
    }

    // Predict Q-values using neural network
    const stateTensor = numpy.expand_dims(state, axis: 0);
    const qValues = this.model.predict(stateTensor, verbose: 0);

    // Choose action with highest Q-value
    return Number(numpy.argmax(qValues[0]));
  }

  /**
   * Store experience in replay buffer
   */
  remember(
    state: any,
    action: number,
    reward: number,
    nextState: any,
    done: boolean
  ): void {
    this.memory.push({
      state,
      action,
      reward,
      nextState,
      done,
    });

    // Keep memory size bounded
    if (this.memory.length > this.config.memorySize) {
      this.memory.shift();
    }
  }

  /**
   * Train on batch of experiences
   */
  async train(): Promise<number> {
    if (this.memory.length < this.config.batchSize) {
      return 0; // Not enough experiences yet
    }

    // Sample random batch from memory
    const batch = this.sampleBatch();

    // Prepare training data
    const states = numpy.array(batch.map(e => e.state));
    const nextStates = numpy.array(batch.map(e => e.nextState));

    // Predict current Q-values
    const currentQ = this.model.predict(states, verbose: 0);

    // Predict next Q-values using target network (Double DQN)
    const nextQ = this.targetModel.predict(nextStates, verbose: 0);

    // Calculate target Q-values
    for (let i = 0; i < batch.length; i++) {
      const exp = batch[i];

      if (exp.done) {
        // Terminal state - no future reward
        currentQ[i][exp.action] = exp.reward;
      } else {
        // Q-learning update: Q(s,a) = r + γ * max(Q(s',a'))
        const maxNextQ = numpy.max(nextQ[i]);
        currentQ[i][exp.action] = exp.reward + this.config.discount * maxNextQ;
      }
    }

    // Train model on batch
    const history = await this.model.fit(states, currentQ, {
      epochs: 1,
      verbose: 0,
      batchSize: this.config.batchSize,
    });

    const loss = history.history.loss[0];

    // Decay epsilon (reduce exploration over time)
    if (this.epsilon > this.config.epsilonMin) {
      this.epsilon *= this.config.epsilonDecay;
    }

    // Update target network periodically
    this.trainingSteps++;
    if (this.trainingSteps % this.config.targetUpdateFreq === 0) {
      this.updateTargetModel();
    }

    return loss;
  }

  /**
   * Sample random batch from replay memory
   */
  private sampleBatch(): Experience[] {
    const batch: Experience[] = [];
    const indices = new Set<number>();

    while (indices.size < this.config.batchSize) {
      const idx = Math.floor(Math.random() * this.memory.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        batch.push(this.memory[idx]);
      }
    }

    return batch;
  }

  /**
   * Update target network with current model weights
   */
  private updateTargetModel(): void {
    const weights = this.model.get_weights();
    this.targetModel.set_weights(weights);

    console.log('[DQN] Target network updated');
  }

  /**
   * Save model to file
   */
  async saveModel(filepath: string): Promise<void> {
    console.log(`[DQN] Saving model to ${filepath}...`);
    await this.model.save(filepath);
    console.log('  ✓ Model saved');
  }

  /**
   * Load model from file
   */
  async loadModel(filepath: string): Promise<void> {
    console.log(`[DQN] Loading model from ${filepath}...`);
    this.model = await tensorflow.keras.models.load_model(filepath);
    this.targetModel = await tensorflow.keras.models.load_model(filepath);
    console.log('  ✓ Model loaded');
  }

  /**
   * Get current exploration rate
   */
  getEpsilon(): number {
    return this.epsilon;
  }

  /**
   * Get memory size
   */
  getMemorySize(): number {
    return this.memory.length;
  }
}

// ============================================================================
// Q-Learning Agent (Table-based)
// ============================================================================

export class QLearningAgent {
  private qTable: Map<string, number[]> = new Map();
  private config: {
    actionSize: number;
    learningRate: number;
    discount: number;
    epsilon: number;
    epsilonMin: number;
    epsilonDecay: number;
  };

  constructor(config: {
    actionSize: number;
    learningRate?: number;
    discount?: number;
    epsilon?: number;
    epsilonMin?: number;
    epsilonDecay?: number;
  }) {
    this.config = {
      learningRate: 0.1,
      discount: 0.95,
      epsilon: 1.0,
      epsilonMin: 0.01,
      epsilonDecay: 0.995,
      ...config,
    };

    console.log('[Q-Learning] Agent initialized');
  }

  /**
   * Get Q-values for state (initialize if not seen before)
   */
  private getQValues(state: string): number[] {
    if (!this.qTable.has(state)) {
      this.qTable.set(state, Array(this.config.actionSize).fill(0));
    }
    return this.qTable.get(state)!;
  }

  /**
   * Select action using epsilon-greedy
   */
  selectAction(state: string | any): number {
    const stateKey = typeof state === 'string' ? state : JSON.stringify(state);

    if (Math.random() < this.config.epsilon) {
      return Math.floor(Math.random() * this.config.actionSize);
    }

    const qValues = this.getQValues(stateKey);
    return qValues.indexOf(Math.max(...qValues));
  }

  /**
   * Update Q-table based on experience
   */
  update(
    state: string | any,
    action: number,
    reward: number,
    nextState: string | any,
    done: boolean
  ): void {
    const stateKey = typeof state === 'string' ? state : JSON.stringify(state);
    const nextStateKey = typeof nextState === 'string' ? nextState : JSON.stringify(nextState);

    const qValues = this.getQValues(stateKey);
    const nextQValues = this.getQValues(nextStateKey);

    // Q-learning update
    const currentQ = qValues[action];
    const maxNextQ = done ? 0 : Math.max(...nextQValues);

    const newQ = currentQ + this.config.learningRate * (reward + this.config.discount * maxNextQ - currentQ);

    qValues[action] = newQ;

    // Decay epsilon
    if (this.config.epsilon > this.config.epsilonMin) {
      this.config.epsilon *= this.config.epsilonDecay;
    }
  }

  /**
   * Get Q-table statistics
   */
  getStats(): { statesExplored: number; avgQValue: number } {
    const allQValues: number[] = [];

    for (const qValues of this.qTable.values()) {
      allQValues.push(...qValues);
    }

    const avgQValue = allQValues.reduce((sum, q) => sum + q, 0) / allQValues.length;

    return {
      statesExplored: this.qTable.size,
      avgQValue: isNaN(avgQValue) ? 0 : avgQValue,
    };
  }
}

// ============================================================================
// Policy Gradient Agent (REINFORCE)
// ============================================================================

export class PolicyGradientAgent {
  private model: any;
  private config: {
    stateSize: number;
    actionSize: number;
    learningRate: number;
    discount: number;
  };
  private episodeStates: any[] = [];
  private episodeActions: number[] = [];
  private episodeRewards: number[] = [];

  constructor(config: {
    stateSize: number;
    actionSize: number;
    learningRate?: number;
    discount?: number;
  }) {
    this.config = {
      learningRate: 0.001,
      discount: 0.99,
      ...config,
    };

    this.model = this.buildModel();

    console.log('[Policy Gradient] Agent initialized');
  }

  private buildModel(): any {
    // Build policy network (outputs action probabilities)
    const model = tensorflow.keras.Sequential([
      tensorflow.keras.layers.Dense(128, {
        activation: 'relu',
        inputShape: [this.config.stateSize],
      }),
      tensorflow.keras.layers.Dense(64, { activation: 'relu' }),
      tensorflow.keras.layers.Dense(this.config.actionSize, {
        activation: 'softmax',
      }),
    ]);

    model.compile({
      optimizer: tensorflow.keras.optimizers.Adam({
        learningRate: this.config.learningRate,
      }),
      loss: 'sparse_categorical_crossentropy',
    });

    return model;
  }

  /**
   * Select action by sampling from policy distribution
   */
  selectAction(state: any): number {
    const stateTensor = numpy.expand_dims(state, axis: 0);
    const probabilities = this.model.predict(stateTensor, verbose: 0)[0];

    // Sample action from probability distribution
    const action = this.sampleFromDistribution(probabilities);

    // Store for training
    this.episodeStates.push(state);
    this.episodeActions.push(action);

    return action;
  }

  /**
   * Record reward
   */
  recordReward(reward: number): void {
    this.episodeRewards.push(reward);
  }

  /**
   * Train on completed episode
   */
  async trainOnEpisode(): Promise<number> {
    if (this.episodeStates.length === 0) {
      return 0;
    }

    // Calculate discounted returns
    const returns = this.calculateReturns();

    // Normalize returns
    const mean = numpy.mean(returns);
    const std = numpy.std(returns) + 1e-10;
    const normalizedReturns = (returns - mean) / std;

    // Prepare training data
    const states = numpy.array(this.episodeStates);
    const actions = numpy.array(this.episodeActions);

    // Train policy network
    const history = await this.model.fit(states, actions, {
      epochs: 1,
      verbose: 0,
      sampleWeight: normalizedReturns,
    });

    const loss = history.history.loss[0];

    // Reset episode data
    this.episodeStates = [];
    this.episodeActions = [];
    this.episodeRewards = [];

    return loss;
  }

  /**
   * Calculate discounted returns for episode
   */
  private calculateReturns(): any {
    const returns: number[] = [];
    let g = 0;

    // Calculate returns backward through episode
    for (let t = this.episodeRewards.length - 1; t >= 0; t--) {
      g = this.episodeRewards[t] + this.config.discount * g;
      returns.unshift(g);
    }

    return numpy.array(returns);
  }

  /**
   * Sample action from probability distribution
   */
  private sampleFromDistribution(probabilities: any): number {
    const probs = Array.from(probabilities);
    const rand = Math.random();
    let cumProb = 0;

    for (let i = 0; i < probs.length; i++) {
      cumProb += probs[i];
      if (rand < cumProb) {
        return i;
      }
    }

    return probs.length - 1;
  }
}

// ============================================================================
// Training Environment Interface
// ============================================================================

export interface GameEnvironment {
  reset(): any; // Return initial state
  step(action: number): { nextState: any; reward: number; done: boolean };
  render?(): void;
}

// ============================================================================
// Training Loop
// ============================================================================

export async function trainAgent(
  agent: DQNAgent | QLearningAgent | PolicyGradientAgent,
  environment: GameEnvironment,
  options: {
    episodes: number;
    maxSteps?: number;
    verbose?: boolean;
    logInterval?: number;
    onEpisodeComplete?: (stats: TrainingStats) => void;
  }
): Promise<TrainingStats[]> {
  const maxSteps = options.maxSteps || 1000;
  const verbose = options.verbose ?? true;
  const logInterval = options.logInterval || 10;

  const allStats: TrainingStats[] = [];

  console.log('\n🎮 Starting Training...\n');
  console.log(`Episodes: ${options.episodes}`);
  console.log(`Max steps per episode: ${maxSteps}\n`);

  for (let episode = 0; episode < options.episodes; episode++) {
    let state = environment.reset();
    let totalReward = 0;
    let steps = 0;
    let loss = 0;

    for (let step = 0; step < maxSteps; step++) {
      // Select action
      const action = agent.selectAction(state);

      // Take action in environment
      const { nextState, reward, done } = environment.step(action);

      totalReward += reward;
      steps++;

      // Store experience and train
      if (agent instanceof DQNAgent) {
        agent.remember(state, action, reward, nextState, done);
        loss = await agent.train();
      } else if (agent instanceof QLearningAgent) {
        agent.update(state, action, reward, nextState, done);
      } else if (agent instanceof PolicyGradientAgent) {
        agent.recordReward(reward);
      }

      state = nextState;

      if (done) {
        break;
      }
    }

    // For policy gradient, train on complete episode
    if (agent instanceof PolicyGradientAgent) {
      loss = await agent.trainOnEpisode();
    }

    // Calculate stats
    const stats: TrainingStats = {
      episode: episode + 1,
      totalReward,
      avgReward: allStats.length > 0
        ? allStats.reduce((sum, s) => sum + s.totalReward, 0) / allStats.length
        : totalReward,
      epsilon: agent instanceof DQNAgent ? agent.getEpsilon() : 0,
      loss,
      steps,
    };

    allStats.push(stats);

    // Log progress
    if (verbose && (episode + 1) % logInterval === 0) {
      console.log(`Episode ${episode + 1}/${options.episodes}:`);
      console.log(`  Reward: ${totalReward.toFixed(2)}`);
      console.log(`  Avg Reward: ${stats.avgReward.toFixed(2)}`);
      if (agent instanceof DQNAgent) {
        console.log(`  Epsilon: ${stats.epsilon.toFixed(3)}`);
        console.log(`  Loss: ${loss.toFixed(4)}`);
      }
      console.log(`  Steps: ${steps}`);
      console.log();
    }

    // Callback
    if (options.onEpisodeComplete) {
      options.onEpisodeComplete(stats);
    }
  }

  console.log('✅ Training completed!\n');

  return allStats;
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🤖 Reinforcement Learning for Game AI Demo\n');

  // Simple grid world environment
  class GridWorld implements GameEnvironment {
    private playerPos: [number, number] = [0, 0];
    private goalPos: [number, number] = [4, 4];
    private gridSize = 5;

    reset(): any {
      this.playerPos = [0, 0];
      return this.getState();
    }

    step(action: number): { nextState: any; reward: number; done: boolean } {
      // Actions: 0=up, 1=right, 2=down, 3=left
      const moves = [
        [-1, 0],
        [0, 1],
        [1, 0],
        [0, -1],
      ];
      const [dy, dx] = moves[action];

      // Update position (with bounds checking)
      const newY = Math.max(0, Math.min(this.gridSize - 1, this.playerPos[0] + dy));
      const newX = Math.max(0, Math.min(this.gridSize - 1, this.playerPos[1] + dx));
      this.playerPos = [newY, newX];

      // Calculate reward
      let reward = -0.1; // Small penalty per step
      let done = false;

      if (this.playerPos[0] === this.goalPos[0] && this.playerPos[1] === this.goalPos[1]) {
        reward = 10; // Large reward for reaching goal
        done = true;
      }

      return {
        nextState: this.getState(),
        reward,
        done,
      };
    }

    private getState(): any {
      // State as flattened grid (one-hot encoding of position)
      const state = numpy.zeros([this.gridSize * this.gridSize]);
      const idx = this.playerPos[0] * this.gridSize + this.playerPos[1];
      state[idx] = 1;
      return state;
    }
  }

  // Train DQN agent
  const agent = new DQNAgent({
    stateSize: 25, // 5x5 grid
    actionSize: 4, // up, right, down, left
    hiddenLayers: [64, 32],
    learningRate: 0.001,
    epsilon: 1.0,
    epsilonDecay: 0.995,
  });

  const env = new GridWorld();

  await trainAgent(agent, env, {
    episodes: 500,
    maxSteps: 100,
    verbose: true,
    logInterval: 50,
  });

  // Test trained agent
  console.log('\n🎯 Testing trained agent...\n');

  let state = env.reset();
  let totalReward = 0;

  for (let step = 0; step < 50; step++) {
    const action = agent.selectAction(state);
    const { nextState, reward, done } = env.step(action);

    totalReward += reward;
    state = nextState;

    if (done) {
      console.log(`✅ Goal reached in ${step + 1} steps!`);
      console.log(`Total reward: ${totalReward.toFixed(2)}`);
      break;
    }
  }

  console.log('\n💡 This demonstrates:');
  console.log('  - TensorFlow neural networks in TypeScript');
  console.log('  - Deep Q-Learning (DQN) algorithm');
  console.log('  - Experience replay and target networks');
  console.log('  - Zero-copy NumPy array operations');
  console.log('  - All in one process!');
}
