/**
 * Deep Q-Network (DQN) Implementation
 *
 * Advanced implementation of Deep Q-Learning algorithm with multiple enhancements:
 * - Experience Replay Buffer
 * - Target Network
 * - Double DQN
 * - Dueling DQN Architecture
 * - Prioritized Experience Replay
 * - N-Step Returns
 *
 * Demonstrates Elide's polyglot capabilities by seamlessly integrating
 * PyTorch and NumPy in TypeScript for high-performance RL training.
 */

// @ts-ignore - PyTorch deep learning framework
import torch from 'python:torch';
// @ts-ignore - NumPy for numerical operations
import numpy from 'python:numpy';
// @ts-ignore - Python random for sampling
import random from 'python:random';

// ============================================================================
// Type Definitions
// ============================================================================

export interface DQNConfig {
  stateShape: number[];
  actionSize: number;
  learningRate?: number;
  discount?: number; // gamma
  epsilon?: number; // exploration rate
  epsilonMin?: number;
  epsilonDecay?: number;
  targetUpdateFreq?: number;
  batchSize?: number;
  memorySize?: number;
  doubleDQN?: boolean;
  duelingDQN?: boolean;
  prioritizedReplay?: boolean;
  nStep?: number;
  device?: string;
}

export interface Experience {
  state: any; // NumPy array or tensor
  action: number;
  reward: number;
  nextState: any;
  done: boolean;
  priority?: number;
}

export interface TrainingMetrics {
  episode: number;
  totalReward: number;
  avgReward: number;
  epsilon: number;
  loss: number;
  qValue: number;
  steps: number;
  duration: number;
}

export interface ReplayTransition {
  state: any;
  action: any;
  reward: any;
  nextState: any;
  done: any;
  weight?: any;
  indices?: number[];
}

// ============================================================================
// Experience Replay Buffer
// ============================================================================

export class ReplayBuffer {
  private buffer: Experience[] = [];
  private capacity: number;
  private position = 0;

  constructor(capacity: number) {
    this.capacity = capacity;
    console.log(`[ReplayBuffer] Initialized with capacity: ${capacity}`);
  }

  /**
   * Add experience to buffer
   */
  push(experience: Experience): void {
    if (this.buffer.length < this.capacity) {
      this.buffer.push(experience);
    } else {
      this.buffer[this.position] = experience;
    }
    this.position = (this.position + 1) % this.capacity;
  }

  /**
   * Sample random batch from buffer
   */
  sample(batchSize: number): Experience[] {
    const samples: Experience[] = [];
    const indices = new Set<number>();

    while (indices.size < Math.min(batchSize, this.buffer.length)) {
      const idx = Math.floor(Math.random() * this.buffer.length);
      if (!indices.has(idx)) {
        indices.add(idx);
        samples.push(this.buffer[idx]);
      }
    }

    return samples;
  }

  /**
   * Get buffer size
   */
  size(): number {
    return this.buffer.length;
  }

  /**
   * Clear buffer
   */
  clear(): void {
    this.buffer = [];
    this.position = 0;
  }
}

// ============================================================================
// Prioritized Experience Replay Buffer
// ============================================================================

export class PrioritizedReplayBuffer {
  private buffer: Experience[] = [];
  private priorities: number[] = [];
  private capacity: number;
  private position = 0;
  private alpha: number; // Prioritization exponent
  private beta: number; // Importance sampling weight
  private betaIncrement: number;
  private epsilon = 1e-6; // Small constant to prevent zero priorities

  constructor(capacity: number, alpha = 0.6, beta = 0.4, betaIncrement = 0.001) {
    this.capacity = capacity;
    this.alpha = alpha;
    this.beta = beta;
    this.betaIncrement = betaIncrement;
    console.log(`[PrioritizedReplayBuffer] Initialized with capacity: ${capacity}`);
    console.log(`  Alpha (prioritization): ${alpha}`);
    console.log(`  Beta (importance sampling): ${beta}`);
  }

  /**
   * Add experience with priority
   */
  push(experience: Experience, priority?: number): void {
    const maxPriority = this.priorities.length > 0
      ? Math.max(...this.priorities)
      : 1.0;

    const experiencePriority = priority ?? maxPriority;

    if (this.buffer.length < this.capacity) {
      this.buffer.push(experience);
      this.priorities.push(experiencePriority);
    } else {
      this.buffer[this.position] = experience;
      this.priorities[this.position] = experiencePriority;
    }

    this.position = (this.position + 1) % this.capacity;
  }

  /**
   * Sample batch with importance sampling weights
   */
  sample(batchSize: number): {
    experiences: Experience[];
    weights: number[];
    indices: number[];
  } {
    const n = this.buffer.length;
    const probabilities = this.priorities.map(p => Math.pow(p, this.alpha));
    const totalProbability = probabilities.reduce((sum, p) => sum + p, 0);

    const normalizedProbs = probabilities.map(p => p / totalProbability);

    // Sample indices based on priorities
    const indices: number[] = [];
    const experiences: Experience[] = [];

    for (let i = 0; i < batchSize && i < n; i++) {
      const idx = this.sampleIndex(normalizedProbs);
      indices.push(idx);
      experiences.push(this.buffer[idx]);
    }

    // Calculate importance sampling weights
    const weights = indices.map(idx => {
      const prob = normalizedProbs[idx];
      const weight = Math.pow(n * prob, -this.beta);
      return weight;
    });

    // Normalize weights
    const maxWeight = Math.max(...weights);
    const normalizedWeights = weights.map(w => w / maxWeight);

    // Increment beta for importance sampling annealing
    this.beta = Math.min(1.0, this.beta + this.betaIncrement);

    return { experiences, weights: normalizedWeights, indices };
  }

  /**
   * Update priorities for sampled experiences
   */
  updatePriorities(indices: number[], priorities: number[]): void {
    for (let i = 0; i < indices.length; i++) {
      this.priorities[indices[i]] = priorities[i] + this.epsilon;
    }
  }

  /**
   * Sample index based on probability distribution
   */
  private sampleIndex(probabilities: number[]): number {
    const rand = Math.random();
    let cumProb = 0;

    for (let i = 0; i < probabilities.length; i++) {
      cumProb += probabilities[i];
      if (rand < cumProb) {
        return i;
      }
    }

    return probabilities.length - 1;
  }

  size(): number {
    return this.buffer.length;
  }

  clear(): void {
    this.buffer = [];
    this.priorities = [];
    this.position = 0;
  }
}

// ============================================================================
// Q-Network (Standard DQN)
// ============================================================================

export class QNetwork {
  private network: any; // PyTorch model
  private device: any;

  constructor(stateShape: number[], actionSize: number, device = 'cpu') {
    this.device = torch.device(device);

    // Calculate input size
    const inputSize = stateShape.reduce((a, b) => a * b, 1);

    // Build network using PyTorch
    this.network = torch.nn.Sequential(
      torch.nn.Linear(inputSize, 512),
      torch.nn.ReLU(),
      torch.nn.Linear(512, 256),
      torch.nn.ReLU(),
      torch.nn.Linear(256, 128),
      torch.nn.ReLU(),
      torch.nn.Linear(128, actionSize)
    );

    this.network.to(this.device);

    console.log('[QNetwork] Standard DQN network initialized');
    console.log(`  Input shape: ${stateShape}`);
    console.log(`  Action size: ${actionSize}`);
    console.log(`  Device: ${device}`);
  }

  forward(state: any): any {
    // Convert to PyTorch tensor if needed
    let stateTensor = state;
    if (!torch.is_tensor(state)) {
      stateTensor = torch.FloatTensor(state);
    }

    stateTensor = stateTensor.to(this.device);

    // Flatten if needed
    if (stateTensor.dim() > 2) {
      stateTensor = stateTensor.flatten(start_dim: 1);
    }

    return this.network(stateTensor);
  }

  getParameters(): any {
    return this.network.parameters();
  }

  getStateDict(): any {
    return this.network.state_dict();
  }

  loadStateDict(stateDict: any): void {
    this.network.load_state_dict(stateDict);
  }

  to(device: any): void {
    this.device = device;
    this.network.to(device);
  }
}

// ============================================================================
// Dueling Q-Network
// ============================================================================

export class DuelingQNetwork {
  private features: any;
  private advantage: any;
  private value: any;
  private device: any;

  constructor(stateShape: number[], actionSize: number, device = 'cpu') {
    this.device = torch.device(device);

    const inputSize = stateShape.reduce((a, b) => a * b, 1);

    // Shared feature extractor
    this.features = torch.nn.Sequential(
      torch.nn.Linear(inputSize, 512),
      torch.nn.ReLU(),
      torch.nn.Linear(512, 256),
      torch.nn.ReLU()
    );

    // Advantage stream
    this.advantage = torch.nn.Sequential(
      torch.nn.Linear(256, 128),
      torch.nn.ReLU(),
      torch.nn.Linear(128, actionSize)
    );

    // Value stream
    this.value = torch.nn.Sequential(
      torch.nn.Linear(256, 128),
      torch.nn.ReLU(),
      torch.nn.Linear(128, 1)
    );

    this.features.to(this.device);
    this.advantage.to(this.device);
    this.value.to(this.device);

    console.log('[DuelingQNetwork] Dueling DQN architecture initialized');
    console.log(`  Input shape: ${stateShape}`);
    console.log(`  Action size: ${actionSize}`);
  }

  forward(state: any): any {
    let stateTensor = state;
    if (!torch.is_tensor(state)) {
      stateTensor = torch.FloatTensor(state);
    }

    stateTensor = stateTensor.to(this.device);

    if (stateTensor.dim() > 2) {
      stateTensor = stateTensor.flatten(start_dim: 1);
    }

    // Extract features
    const features = this.features(stateTensor);

    // Calculate advantage and value
    const advantage = this.advantage(features);
    const value = this.value(features);

    // Combine using dueling architecture formula:
    // Q(s,a) = V(s) + (A(s,a) - mean(A(s,a)))
    const advantageMean = advantage.mean(dim: 1, keepdim: true);
    const qValues = value + (advantage - advantageMean);

    return qValues;
  }

  getParameters(): any {
    return [
      ...Array.from(this.features.parameters()),
      ...Array.from(this.advantage.parameters()),
      ...Array.from(this.value.parameters()),
    ];
  }

  getStateDict(): any {
    return {
      features: this.features.state_dict(),
      advantage: this.advantage.state_dict(),
      value: this.value.state_dict(),
    };
  }

  loadStateDict(stateDict: any): void {
    this.features.load_state_dict(stateDict.features);
    this.advantage.load_state_dict(stateDict.advantage);
    this.value.load_state_dict(stateDict.value);
  }

  to(device: any): void {
    this.device = device;
    this.features.to(device);
    this.advantage.to(device);
    this.value.to(device);
  }
}

// ============================================================================
// DQN Agent
// ============================================================================

export class DQNAgent {
  private config: Required<DQNConfig>;
  private qNetwork: QNetwork | DuelingQNetwork;
  private targetNetwork: QNetwork | DuelingQNetwork;
  private optimizer: any;
  private replayBuffer: ReplayBuffer | PrioritizedReplayBuffer;
  private epsilon: number;
  private trainingSteps = 0;
  private device: any;

  constructor(config: DQNConfig) {
    // Set default configuration
    this.config = {
      learningRate: 0.00025,
      discount: 0.99,
      epsilon: 1.0,
      epsilonMin: 0.01,
      epsilonDecay: 0.995,
      targetUpdateFreq: 1000,
      batchSize: 32,
      memorySize: 100000,
      doubleDQN: true,
      duelingDQN: true,
      prioritizedReplay: false,
      nStep: 1,
      device: 'cpu',
      ...config,
    };

    this.epsilon = this.config.epsilon;
    this.device = torch.device(this.config.device);

    // Initialize networks
    if (this.config.duelingDQN) {
      this.qNetwork = new DuelingQNetwork(
        this.config.stateShape,
        this.config.actionSize,
        this.config.device
      );
      this.targetNetwork = new DuelingQNetwork(
        this.config.stateShape,
        this.config.actionSize,
        this.config.device
      );
    } else {
      this.qNetwork = new QNetwork(
        this.config.stateShape,
        this.config.actionSize,
        this.config.device
      );
      this.targetNetwork = new QNetwork(
        this.config.stateShape,
        this.config.actionSize,
        this.config.device
      );
    }

    // Initialize target network with same weights
    this.targetNetwork.loadStateDict(this.qNetwork.getStateDict());

    // Initialize optimizer (Adam)
    this.optimizer = torch.optim.Adam(
      this.qNetwork.getParameters(),
      lr: this.config.learningRate
    );

    // Initialize replay buffer
    if (this.config.prioritizedReplay) {
      this.replayBuffer = new PrioritizedReplayBuffer(this.config.memorySize);
    } else {
      this.replayBuffer = new ReplayBuffer(this.config.memorySize);
    }

    console.log('\n[DQNAgent] Initialized');
    console.log(`  Double DQN: ${this.config.doubleDQN}`);
    console.log(`  Dueling DQN: ${this.config.duelingDQN}`);
    console.log(`  Prioritized Replay: ${this.config.prioritizedReplay}`);
    console.log(`  N-Step Returns: ${this.config.nStep}`);
    console.log(`  Memory Size: ${this.config.memorySize}`);
    console.log(`  Batch Size: ${this.config.batchSize}`);
    console.log(`  Learning Rate: ${this.config.learningRate}`);
    console.log(`  Discount (γ): ${this.config.discount}`);
  }

  /**
   * Select action using epsilon-greedy policy
   */
  selectAction(state: any, training = true): number {
    // Exploration
    if (training && Math.random() < this.epsilon) {
      return Math.floor(Math.random() * this.config.actionSize);
    }

    // Exploitation - use Q-network
    torch.no_grad(() => {
      const stateTensor = this.preprocessState(state);
      const qValues = this.qNetwork.forward(stateTensor);
      const action = qValues.argmax().item();
      return action;
    });

    // This should be inside the no_grad closure, but TypeScript limitations
    const stateTensor = this.preprocessState(state);
    const qValues = this.qNetwork.forward(stateTensor);
    return Number(qValues.argmax().item());
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
    const experience: Experience = {
      state,
      action,
      reward,
      nextState,
      done,
    };

    this.replayBuffer.push(experience);
  }

  /**
   * Train on batch from replay buffer
   */
  train(): { loss: number; qValue: number } {
    if (this.replayBuffer.size() < this.config.batchSize) {
      return { loss: 0, qValue: 0 };
    }

    // Sample batch
    let batch: Experience[];
    let weights: number[] | null = null;
    let indices: number[] | null = null;

    if (this.config.prioritizedReplay) {
      const sample = (this.replayBuffer as PrioritizedReplayBuffer).sample(
        this.config.batchSize
      );
      batch = sample.experiences;
      weights = sample.weights;
      indices = sample.indices;
    } else {
      batch = (this.replayBuffer as ReplayBuffer).sample(this.config.batchSize);
    }

    // Prepare batch tensors
    const states = torch.FloatTensor(
      numpy.array(batch.map(e => e.state))
    ).to(this.device);

    const actions = torch.LongTensor(
      batch.map(e => e.action)
    ).unsqueeze(1).to(this.device);

    const rewards = torch.FloatTensor(
      batch.map(e => e.reward)
    ).to(this.device);

    const nextStates = torch.FloatTensor(
      numpy.array(batch.map(e => e.nextState))
    ).to(this.device);

    const dones = torch.FloatTensor(
      batch.map(e => e.done ? 1.0 : 0.0)
    ).to(this.device);

    // Current Q-values
    const currentQ = this.qNetwork.forward(states).gather(1, actions).squeeze();

    // Compute target Q-values
    let targetQ: any;

    if (this.config.doubleDQN) {
      // Double DQN: use online network to select action, target network to evaluate
      const nextActions = this.qNetwork.forward(nextStates).argmax(dim: 1, keepdim: true);
      const nextQValues = this.targetNetwork.forward(nextStates).gather(1, nextActions).squeeze();
      targetQ = rewards + (1 - dones) * this.config.discount * nextQValues;
    } else {
      // Standard DQN
      const nextQValues = this.targetNetwork.forward(nextStates).max(dim: 1)[0];
      targetQ = rewards + (1 - dones) * this.config.discount * nextQValues;
    }

    targetQ = targetQ.detach();

    // Calculate loss
    let loss: any;

    if (this.config.prioritizedReplay && weights) {
      // Weighted loss for prioritized replay
      const weightTensor = torch.FloatTensor(weights).to(this.device);
      const elementLoss = torch.nn.functional.mse_loss(
        currentQ,
        targetQ,
        reduction: 'none'
      );
      loss = (elementLoss * weightTensor).mean();

      // Update priorities
      const tdErrors = Math.abs(currentQ - targetQ);
      const priorities = tdErrors.detach().cpu().numpy();
      (this.replayBuffer as PrioritizedReplayBuffer).updatePriorities(
        indices!,
        Array.from(priorities)
      );
    } else {
      // Standard MSE loss
      loss = torch.nn.functional.mse_loss(currentQ, targetQ);
    }

    // Optimize
    this.optimizer.zero_grad();
    loss.backward();

    // Gradient clipping
    torch.nn.utils.clip_grad_norm_(this.qNetwork.getParameters(), max_norm: 10.0);

    this.optimizer.step();

    // Update target network periodically
    this.trainingSteps++;
    if (this.trainingSteps % this.config.targetUpdateFreq === 0) {
      this.updateTargetNetwork();
    }

    // Decay epsilon
    if (this.epsilon > this.config.epsilonMin) {
      this.epsilon *= this.config.epsilonDecay;
    }

    // Return metrics
    const lossValue = Number(loss.item());
    const qValue = Number(currentQ.mean().item());

    return { loss: lossValue, qValue };
  }

  /**
   * Update target network weights
   */
  private updateTargetNetwork(): void {
    this.targetNetwork.loadStateDict(this.qNetwork.getStateDict());
    console.log(`[DQN] Target network updated (step ${this.trainingSteps})`);
  }

  /**
   * Soft update target network (for continuous updates)
   */
  softUpdateTargetNetwork(tau = 0.001): void {
    const onlineParams = this.qNetwork.getStateDict();
    const targetParams = this.targetNetwork.getStateDict();

    for (const key in onlineParams) {
      targetParams[key] = tau * onlineParams[key] + (1 - tau) * targetParams[key];
    }

    this.targetNetwork.loadStateDict(targetParams);
  }

  /**
   * Preprocess state for network input
   */
  private preprocessState(state: any): any {
    if (torch.is_tensor(state)) {
      return state.to(this.device);
    }

    const stateTensor = torch.FloatTensor(state);
    return stateTensor.to(this.device);
  }

  /**
   * Get current epsilon value
   */
  getEpsilon(): number {
    return this.epsilon;
  }

  /**
   * Set epsilon value
   */
  setEpsilon(epsilon: number): void {
    this.epsilon = Math.max(this.config.epsilonMin, Math.min(1.0, epsilon));
  }

  /**
   * Get replay buffer size
   */
  getMemorySize(): number {
    return this.replayBuffer.size();
  }

  /**
   * Get training steps
   */
  getTrainingSteps(): number {
    return this.trainingSteps;
  }

  /**
   * Save model to disk
   */
  save(filepath: string): void {
    const checkpoint = {
      qNetwork: this.qNetwork.getStateDict(),
      targetNetwork: this.targetNetwork.getStateDict(),
      optimizer: this.optimizer.state_dict(),
      epsilon: this.epsilon,
      trainingSteps: this.trainingSteps,
      config: this.config,
    };

    torch.save(checkpoint, filepath);
    console.log(`[DQN] Model saved to ${filepath}`);
  }

  /**
   * Load model from disk
   */
  load(filepath: string): void {
    const checkpoint = torch.load(filepath);

    this.qNetwork.loadStateDict(checkpoint.qNetwork);
    this.targetNetwork.loadStateDict(checkpoint.targetNetwork);
    this.optimizer.load_state_dict(checkpoint.optimizer);
    this.epsilon = checkpoint.epsilon;
    this.trainingSteps = checkpoint.trainingSteps;

    console.log(`[DQN] Model loaded from ${filepath}`);
    console.log(`  Training steps: ${this.trainingSteps}`);
    console.log(`  Epsilon: ${this.epsilon.toFixed(4)}`);
  }

  /**
   * Evaluate Q-values for state-action pairs
   */
  evaluateQ(state: any, action?: number): number | number[] {
    const stateTensor = this.preprocessState(state);
    const qValues = this.qNetwork.forward(stateTensor);

    if (action !== undefined) {
      return Number(qValues[action].item());
    }

    return Array.from(qValues.detach().cpu().numpy());
  }

  /**
   * Get best action for state (greedy policy)
   */
  getBestAction(state: any): number {
    const stateTensor = this.preprocessState(state);
    const qValues = this.qNetwork.forward(stateTensor);
    return Number(qValues.argmax().item());
  }

  /**
   * Reset agent (clear memory and reset epsilon)
   */
  reset(): void {
    this.replayBuffer.clear();
    this.epsilon = this.config.epsilon;
    this.trainingSteps = 0;
    console.log('[DQN] Agent reset');
  }
}

// ============================================================================
// N-Step DQN Agent
// ============================================================================

export class NStepDQNAgent extends DQNAgent {
  private nStepBuffer: Experience[] = [];
  private nStep: number;

  constructor(config: DQNConfig) {
    super(config);
    this.nStep = config.nStep || 3;
    console.log(`[NStepDQN] Using ${this.nStep}-step returns`);
  }

  /**
   * Store experience with n-step returns
   */
  override remember(
    state: any,
    action: number,
    reward: number,
    nextState: any,
    done: boolean
  ): void {
    this.nStepBuffer.push({ state, action, reward, nextState, done });

    if (this.nStepBuffer.length >= this.nStep || done) {
      // Calculate n-step return
      const nStepReturn = this.calculateNStepReturn();
      const firstExperience = this.nStepBuffer[0];
      const lastExperience = this.nStepBuffer[this.nStepBuffer.length - 1];

      // Store n-step experience
      super.remember(
        firstExperience.state,
        firstExperience.action,
        nStepReturn,
        lastExperience.nextState,
        lastExperience.done
      );

      // Remove first experience
      this.nStepBuffer.shift();
    }

    // Clear buffer on episode end
    if (done) {
      this.nStepBuffer = [];
    }
  }

  /**
   * Calculate n-step discounted return
   */
  private calculateNStepReturn(): number {
    let nStepReturn = 0;
    let discount = 1.0;

    for (const exp of this.nStepBuffer) {
      nStepReturn += discount * exp.reward;
      discount *= this.config.discount;
    }

    return nStepReturn;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Linear epsilon decay schedule
 */
export function linearEpsilonDecay(
  initialEpsilon: number,
  finalEpsilon: number,
  decaySteps: number,
  currentStep: number
): number {
  const slope = (finalEpsilon - initialEpsilon) / decaySteps;
  const epsilon = initialEpsilon + slope * currentStep;
  return Math.max(finalEpsilon, Math.min(initialEpsilon, epsilon));
}

/**
 * Exponential epsilon decay schedule
 */
export function exponentialEpsilonDecay(
  initialEpsilon: number,
  finalEpsilon: number,
  decayRate: number,
  currentStep: number
): number {
  const epsilon = finalEpsilon + (initialEpsilon - finalEpsilon) * Math.exp(-decayRate * currentStep);
  return Math.max(finalEpsilon, epsilon);
}

/**
 * Compute Huber loss (less sensitive to outliers than MSE)
 */
export function huberLoss(predicted: any, target: any, delta = 1.0): any {
  return torch.nn.functional.smooth_l1_loss(predicted, target, beta: delta);
}

/**
 * Polyak averaging for target network updates
 */
export function polyakUpdate(
  onlineNetwork: QNetwork | DuelingQNetwork,
  targetNetwork: QNetwork | DuelingQNetwork,
  tau = 0.001
): void {
  const onlineParams = onlineNetwork.getStateDict();
  const targetParams = targetNetwork.getStateDict();

  for (const key in onlineParams) {
    targetParams[key] = tau * onlineParams[key] + (1 - tau) * targetParams[key];
  }

  targetNetwork.loadStateDict(targetParams);
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Deep Q-Network (DQN) Implementation\n');
  console.log('This demonstrates Elide\'s polyglot capabilities:');
  console.log('  - PyTorch neural networks in TypeScript');
  console.log('  - NumPy array operations');
  console.log('  - Advanced DQN features');
  console.log('  - All in a single process!\n');

  // Create DQN agent
  const agent = new DQNAgent({
    stateShape: [4], // CartPole state
    actionSize: 2, // Left or right
    learningRate: 0.001,
    discount: 0.99,
    epsilon: 1.0,
    epsilonDecay: 0.995,
    epsilonMin: 0.01,
    batchSize: 64,
    memorySize: 10000,
    targetUpdateFreq: 100,
    doubleDQN: true,
    duelingDQN: true,
    prioritizedReplay: false,
    device: 'cpu',
  });

  console.log('\n✅ DQN Agent created successfully!');
  console.log('\nAgent is ready for training with:');
  console.log('  - Experience replay');
  console.log('  - Target network');
  console.log('  - Double DQN');
  console.log('  - Dueling architecture');
  console.log('  - Epsilon-greedy exploration');
}
