/**
 * Asynchronous Advantage Actor-Critic (A3C) Implementation
 *
 * Advanced A3C algorithm featuring:
 * - Multiple asynchronous worker threads
 * - Shared global network
 * - N-step returns
 * - Entropy regularization
 * - Asynchronous gradient updates
 *
 * Demonstrates Elide's ability to run multi-threaded Python ML code
 * seamlessly in TypeScript!
 */

// @ts-ignore - PyTorch for neural networks
import torch from 'python:torch';
// @ts-ignore - NumPy for numerical operations
import numpy from 'python:numpy';
// @ts-ignore - Python threading for parallelism
import threading from 'python:threading';
// @ts-ignore - Python multiprocessing for parallel workers
import multiprocessing from 'python:multiprocessing';
// @ts-ignore - Python queue for communication
import queue from 'python:queue';

// ============================================================================
// Type Definitions
// ============================================================================

export interface A3CConfig {
  stateShape: number[];
  actionSize: number;
  continuous?: boolean;
  numWorkers?: number;
  learningRate?: number;
  discount?: number; // gamma
  entropyCoef?: number;
  valueCoef?: number;
  maxGradNorm?: number;
  nStep?: number; // N-step returns
  updateFreq?: number; // Steps before update
  device?: string;
}

export interface WorkerStats {
  workerId: number;
  episode: number;
  totalReward: number;
  steps: number;
  loss: number;
  entropy: number;
}

export interface A3CMetrics {
  globalStep: number;
  totalEpisodes: number;
  avgReward: number;
  avgLoss: number;
  avgEntropy: number;
  workersActive: number;
}

export interface SharedNetwork {
  actor: any;
  critic: any;
  optimizer: any;
  lock: any;
}

// ============================================================================
// Actor-Critic Network (Shared)
// ============================================================================

export class A3CNetwork {
  private features: any;
  private actor: any;
  private critic: any;
  private continuous: boolean;
  private actionSize: number;
  private device: any;

  constructor(
    stateShape: number[],
    actionSize: number,
    continuous = false,
    device = 'cpu'
  ) {
    this.continuous = continuous;
    this.actionSize = actionSize;
    this.device = torch.device(device);

    const inputSize = stateShape.reduce((a, b) => a * b, 1);

    // Shared feature extractor
    this.features = torch.nn.Sequential(
      torch.nn.Linear(inputSize, 256),
      torch.nn.ReLU(),
      torch.nn.Linear(256, 256),
      torch.nn.ReLU(),
      torch.nn.Linear(256, 128),
      torch.nn.ReLU()
    );

    // Actor head (policy)
    if (continuous) {
      this.actor = torch.nn.Sequential(
        torch.nn.Linear(128, actionSize),
        torch.nn.Tanh()
      );
    } else {
      this.actor = torch.nn.Sequential(
        torch.nn.Linear(128, actionSize),
        torch.nn.Softmax(dim: -1)
      );
    }

    // Critic head (value function)
    this.critic = torch.nn.Sequential(
      torch.nn.Linear(128, 64),
      torch.nn.ReLU(),
      torch.nn.Linear(64, 1)
    );

    this.features.to(this.device);
    this.actor.to(this.device);
    this.critic.to(this.device);

    console.log('[A3CNetwork] Initialized');
    console.log(`  Action space: ${continuous ? 'continuous' : 'discrete'}`);
    console.log(`  Shared feature extractor with separate actor-critic heads`);
  }

  forward(state: any): { policy: any; value: any } {
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

    // Get policy and value
    const policy = this.actor(features);
    const value = this.critic(features).squeeze(-1);

    return { policy, value };
  }

  getParameters(): any {
    return [
      ...Array.from(this.features.parameters()),
      ...Array.from(this.actor.parameters()),
      ...Array.from(this.critic.parameters()),
    ];
  }

  getStateDict(): any {
    return {
      features: this.features.state_dict(),
      actor: this.actor.state_dict(),
      critic: this.critic.state_dict(),
    };
  }

  loadStateDict(stateDict: any): void {
    this.features.load_state_dict(stateDict.features);
    this.actor.load_state_dict(stateDict.actor);
    this.critic.load_state_dict(stateDict.critic);
  }

  share_memory(): void {
    this.features.share_memory();
    this.actor.share_memory();
    this.critic.share_memory();
  }

  to(device: any): void {
    this.device = device;
    this.features.to(device);
    this.actor.to(device);
    this.critic.to(device);
  }
}

// ============================================================================
// A3C Worker
// ============================================================================

export class A3CWorker {
  private workerId: number;
  private config: Required<A3CConfig>;
  private globalNetwork: A3CNetwork;
  private localNetwork: A3CNetwork;
  private optimizer: any;
  private device: any;
  private episode = 0;
  private totalSteps = 0;

  constructor(
    workerId: number,
    config: Required<A3CConfig>,
    globalNetwork: A3CNetwork,
    optimizer: any
  ) {
    this.workerId = workerId;
    this.config = config;
    this.globalNetwork = globalNetwork;
    this.optimizer = optimizer;
    this.device = torch.device(config.device);

    // Create local network (copy of global)
    this.localNetwork = new A3CNetwork(
      config.stateShape,
      config.actionSize,
      config.continuous,
      config.device
    );

    // Sync with global network
    this.syncWithGlobal();

    console.log(`[A3CWorker ${workerId}] Initialized`);
  }

  /**
   * Select action using local policy
   */
  selectAction(state: any): {
    action: number | number[];
    logProb: number;
    entropy: number;
    value: number;
  } {
    const stateTensor = this.preprocessState(state);

    let action: any;
    let logProb: number;
    let entropy: number;
    let value: number;

    torch.no_grad(() => {
      const { policy, value: val } = this.localNetwork.forward(stateTensor);

      if (this.config.continuous) {
        // Sample from continuous distribution
        const mean = policy;
        const std = 0.5; // Fixed std for simplicity
        const normal = torch.distributions.Normal(mean, std);
        action = normal.sample();
        logProb = normal.log_prob(action).sum(dim: -1);
        entropy = normal.entropy().sum(dim: -1);
      } else {
        // Sample from categorical distribution
        const categorical = torch.distributions.Categorical(policy);
        action = categorical.sample();
        logProb = categorical.log_prob(action);
        entropy = categorical.entropy();
      }

      value = val;
    });

    const actionValue = this.config.continuous
      ? Array.from(action.cpu().numpy())
      : Number(action.item());

    return {
      action: actionValue,
      logProb: Number(logProb.item()),
      entropy: Number(entropy.item()),
      value: Number(value.item()),
    };
  }

  /**
   * Train on trajectory (n-step returns)
   */
  train(trajectory: {
    states: any[];
    actions: any[];
    rewards: number[];
    values: number[];
    dones: boolean[];
    logProbs: number[];
    entropies: number[];
  }): { loss: number; policyLoss: number; valueLoss: number; entropy: number } {
    // Calculate n-step returns
    const returns = this.calculateNStepReturns(
      trajectory.rewards,
      trajectory.values,
      trajectory.dones
    );

    // Prepare tensors
    const states = torch.FloatTensor(numpy.array(trajectory.states)).to(this.device);
    const actions = this.config.continuous
      ? torch.FloatTensor(numpy.array(trajectory.actions)).to(this.device)
      : torch.LongTensor(trajectory.actions).to(this.device);
    const returnsTensor = torch.FloatTensor(returns).to(this.device);
    const values = torch.FloatTensor(trajectory.values).to(this.device);

    // Forward pass through local network
    let policyLoss: any;
    let valueLoss: any;
    let totalEntropy: any;

    // Get new policy and values
    const { policy: newPolicy, value: newValues } = this.localNetwork.forward(states);

    // Calculate advantages
    const advantages = returnsTensor - values.detach();

    // Policy loss
    if (this.config.continuous) {
      const mean = newPolicy;
      const std = 0.5;
      const normal = torch.distributions.Normal(mean, std);
      const newLogProbs = normal.log_prob(actions).sum(dim: -1);
      policyLoss = -(newLogProbs * advantages).mean();
      totalEntropy = normal.entropy().sum(dim: -1).mean();
    } else {
      const categorical = torch.distributions.Categorical(newPolicy);
      const newLogProbs = categorical.log_prob(actions);
      policyLoss = -(newLogProbs * advantages).mean();
      totalEntropy = categorical.entropy().mean();
    }

    // Value loss (MSE)
    valueLoss = torch.nn.functional.mse_loss(newValues, returnsTensor);

    // Total loss
    const loss = (
      policyLoss +
      this.config.valueCoef * valueLoss -
      this.config.entropyCoef * totalEntropy
    );

    // Compute gradients
    this.optimizer.zero_grad();
    loss.backward();

    // Clip gradients
    torch.nn.utils.clip_grad_norm_(
      this.localNetwork.getParameters(),
      this.config.maxGradNorm
    );

    // Update global network
    this.updateGlobal();

    // Sync local network with global
    this.syncWithGlobal();

    return {
      loss: Number(loss.item()),
      policyLoss: Number(policyLoss.item()),
      valueLoss: Number(valueLoss.item()),
      entropy: Number(totalEntropy.item()),
    };
  }

  /**
   * Calculate n-step returns
   */
  private calculateNStepReturns(
    rewards: number[],
    values: number[],
    dones: boolean[]
  ): number[] {
    const returns: number[] = [];
    let r = 0;

    // Bootstrap from last value if not terminal
    if (!dones[dones.length - 1]) {
      r = values[values.length - 1];
    }

    // Calculate returns backward
    for (let t = rewards.length - 1; t >= 0; t--) {
      r = rewards[t] + this.config.discount * r;
      returns.unshift(r);

      if (dones[t]) {
        r = 0;
      }
    }

    return returns;
  }

  /**
   * Sync local network with global network
   */
  private syncWithGlobal(): void {
    this.localNetwork.loadStateDict(this.globalNetwork.getStateDict());
  }

  /**
   * Update global network with local gradients
   */
  private updateGlobal(): void {
    const localParams = this.localNetwork.getParameters();
    const globalParams = this.globalNetwork.getParameters();

    // Transfer gradients from local to global
    for (let i = 0; i < localParams.length; i++) {
      if (localParams[i].grad !== null) {
        globalParams[i].grad = localParams[i].grad;
      }
    }

    // Update global network
    this.optimizer.step();
  }

  /**
   * Preprocess state
   */
  private preprocessState(state: any): any {
    if (torch.is_tensor(state)) {
      return state.to(this.device);
    }

    const stateTensor = torch.FloatTensor(state);
    return stateTensor.unsqueeze(0).to(this.device);
  }

  /**
   * Get worker ID
   */
  getWorkerId(): number {
    return this.workerId;
  }

  /**
   * Get episode count
   */
  getEpisode(): number {
    return this.episode;
  }

  /**
   * Increment episode
   */
  incrementEpisode(): void {
    this.episode++;
  }

  /**
   * Get total steps
   */
  getTotalSteps(): number {
    return this.totalSteps;
  }

  /**
   * Add steps
   */
  addSteps(steps: number): void {
    this.totalSteps += steps;
  }
}

// ============================================================================
// A3C Agent (Master)
// ============================================================================

export class A3CAgent {
  private config: Required<A3CConfig>;
  private globalNetwork: A3CNetwork;
  private optimizer: any;
  private workers: A3CWorker[] = [];
  private device: any;
  private globalStep = 0;
  private totalEpisodes = 0;

  constructor(config: A3CConfig) {
    // Set defaults
    this.config = {
      continuous: false,
      numWorkers: 4,
      learningRate: 0.0001,
      discount: 0.99,
      entropyCoef: 0.01,
      valueCoef: 0.5,
      maxGradNorm: 40.0,
      nStep: 5,
      updateFreq: 20,
      device: 'cpu',
      ...config,
    };

    this.device = torch.device(this.config.device);

    // Initialize global network
    this.globalNetwork = new A3CNetwork(
      this.config.stateShape,
      this.config.actionSize,
      this.config.continuous,
      this.config.device
    );

    // Share memory for multi-threading
    this.globalNetwork.share_memory();

    // Initialize optimizer
    this.optimizer = torch.optim.Adam(
      this.globalNetwork.getParameters(),
      lr: this.config.learningRate
    );

    // Create workers
    this.createWorkers();

    console.log('\n[A3CAgent] Initialized');
    console.log(`  Number of workers: ${this.config.numWorkers}`);
    console.log(`  N-step returns: ${this.config.nStep}`);
    console.log(`  Update frequency: ${this.config.updateFreq} steps`);
    console.log(`  Learning rate: ${this.config.learningRate}`);
    console.log(`  Entropy coefficient: ${this.config.entropyCoef}`);
  }

  /**
   * Create worker threads
   */
  private createWorkers(): void {
    for (let i = 0; i < this.config.numWorkers; i++) {
      const worker = new A3CWorker(
        i,
        this.config,
        this.globalNetwork,
        this.optimizer
      );
      this.workers.push(worker);
    }

    console.log(`[A3C] Created ${this.config.numWorkers} workers`);
  }

  /**
   * Get worker by ID
   */
  getWorker(workerId: number): A3CWorker {
    if (workerId < 0 || workerId >= this.workers.length) {
      throw new Error(`Invalid worker ID: ${workerId}`);
    }
    return this.workers[workerId];
  }

  /**
   * Select action using global policy
   */
  selectAction(state: any, workerId = 0): {
    action: number | number[];
    logProb: number;
    entropy: number;
    value: number;
  } {
    return this.workers[workerId].selectAction(state);
  }

  /**
   * Train worker on trajectory
   */
  trainWorker(
    workerId: number,
    trajectory: any
  ): { loss: number; policyLoss: number; valueLoss: number; entropy: number } {
    return this.workers[workerId].train(trajectory);
  }

  /**
   * Get global network
   */
  getGlobalNetwork(): A3CNetwork {
    return this.globalNetwork;
  }

  /**
   * Get worker statistics
   */
  getWorkerStats(workerId: number): {
    episode: number;
    totalSteps: number;
  } {
    const worker = this.workers[workerId];
    return {
      episode: worker.getEpisode(),
      totalSteps: worker.getTotalSteps(),
    };
  }

  /**
   * Get all workers statistics
   */
  getAllWorkerStats(): A3CMetrics {
    let totalReward = 0;
    let totalLoss = 0;
    let totalEntropy = 0;
    let totalEpisodes = 0;

    for (const worker of this.workers) {
      totalEpisodes += worker.getEpisode();
    }

    return {
      globalStep: this.globalStep,
      totalEpisodes,
      avgReward: 0, // Would need to track
      avgLoss: 0, // Would need to track
      avgEntropy: 0, // Would need to track
      workersActive: this.config.numWorkers,
    };
  }

  /**
   * Increment global step
   */
  incrementGlobalStep(steps = 1): void {
    this.globalStep += steps;
  }

  /**
   * Get global step
   */
  getGlobalStep(): number {
    return this.globalStep;
  }

  /**
   * Save model
   */
  save(filepath: string): void {
    const checkpoint = {
      globalNetwork: this.globalNetwork.getStateDict(),
      optimizer: this.optimizer.state_dict(),
      globalStep: this.globalStep,
      totalEpisodes: this.totalEpisodes,
      config: this.config,
    };

    torch.save(checkpoint, filepath);
    console.log(`[A3C] Model saved to ${filepath}`);
  }

  /**
   * Load model
   */
  load(filepath: string): void {
    const checkpoint = torch.load(filepath);

    this.globalNetwork.loadStateDict(checkpoint.globalNetwork);
    this.optimizer.load_state_dict(checkpoint.optimizer);
    this.globalStep = checkpoint.globalStep;
    this.totalEpisodes = checkpoint.totalEpisodes;

    // Sync all workers
    for (const worker of this.workers) {
      worker['syncWithGlobal']();
    }

    console.log(`[A3C] Model loaded from ${filepath}`);
    console.log(`  Global steps: ${this.globalStep}`);
    console.log(`  Total episodes: ${this.totalEpisodes}`);
  }

  /**
   * Evaluate state value using global network
   */
  evaluateValue(state: any): number {
    let stateTensor = state;
    if (!torch.is_tensor(state)) {
      stateTensor = torch.FloatTensor(state).unsqueeze(0);
    }

    stateTensor = stateTensor.to(this.device);

    torch.no_grad(() => {
      const { value } = this.globalNetwork.forward(stateTensor);
      return Number(value.item());
    });

    const { value } = this.globalNetwork.forward(stateTensor);
    return Number(value.item());
  }

  /**
   * Get action probabilities (discrete actions only)
   */
  getActionProbabilities(state: any): number[] {
    if (this.config.continuous) {
      throw new Error('Action probabilities only available for discrete actions');
    }

    let stateTensor = state;
    if (!torch.is_tensor(state)) {
      stateTensor = torch.FloatTensor(state).unsqueeze(0);
    }

    stateTensor = stateTensor.to(this.device);

    const { policy } = this.globalNetwork.forward(stateTensor);
    return Array.from(policy.squeeze().detach().cpu().numpy());
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Run A3C worker training loop (to be used in thread)
 */
export async function runWorkerTrainingLoop(
  worker: A3CWorker,
  environment: any,
  maxEpisodes: number,
  updateFreq: number,
  onUpdate?: (stats: WorkerStats) => void
): Promise<void> {
  for (let episode = 0; episode < maxEpisodes; episode++) {
    let state = environment.reset();
    let episodeReward = 0;
    let episodeSteps = 0;

    const trajectory = {
      states: [],
      actions: [],
      rewards: [],
      values: [],
      dones: [],
      logProbs: [],
      entropies: [],
    };

    let done = false;

    while (!done) {
      // Select action
      const { action, logProb, entropy, value } = worker.selectAction(state);

      // Take action in environment
      const { nextState, reward, done: isDone } = environment.step(action);

      // Store in trajectory
      trajectory.states.push(state);
      trajectory.actions.push(action);
      trajectory.rewards.push(reward);
      trajectory.values.push(value);
      trajectory.dones.push(isDone);
      trajectory.logProbs.push(logProb);
      trajectory.entropies.push(entropy);

      episodeReward += reward;
      episodeSteps++;

      state = nextState;
      done = isDone;

      // Update if trajectory is long enough
      if (trajectory.states.length >= updateFreq || done) {
        const metrics = worker.train(trajectory);

        // Clear trajectory
        trajectory.states = [];
        trajectory.actions = [];
        trajectory.rewards = [];
        trajectory.values = [];
        trajectory.dones = [];
        trajectory.logProbs = [];
        trajectory.entropies = [];

        if (onUpdate) {
          onUpdate({
            workerId: worker.getWorkerId(),
            episode: worker.getEpisode(),
            totalReward: episodeReward,
            steps: episodeSteps,
            loss: metrics.loss,
            entropy: metrics.entropy,
          });
        }
      }
    }

    worker.incrementEpisode();
    worker.addSteps(episodeSteps);
  }
}

/**
 * Calculate advantage using GAE
 */
export function calculateGAE(
  rewards: number[],
  values: number[],
  dones: boolean[],
  gamma: number,
  lambda: number
): number[] {
  const advantages: number[] = [];
  let lastGAE = 0;

  for (let t = rewards.length - 1; t >= 0; t--) {
    const nextValue = t < rewards.length - 1 ? values[t + 1] : 0;
    const delta = rewards[t] + (dones[t] ? 0 : gamma * nextValue) - values[t];
    lastGAE = delta + (dones[t] ? 0 : gamma * lambda * lastGAE);
    advantages.unshift(lastGAE);
  }

  return advantages;
}

/**
 * Normalize advantages
 */
export function normalizeAdvantages(advantages: number[]): number[] {
  const mean = advantages.reduce((sum, a) => sum + a, 0) / advantages.length;
  const std = Math.sqrt(
    advantages.reduce((sum, a) => sum + Math.pow(a - mean, 2), 0) / advantages.length
  );

  return advantages.map(a => (a - mean) / (std + 1e-8));
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Asynchronous Advantage Actor-Critic (A3C) Implementation\n');
  console.log('This demonstrates:');
  console.log('  - Multi-threaded asynchronous training');
  console.log('  - Shared global network across workers');
  console.log('  - N-step returns for variance reduction');
  console.log('  - All in TypeScript via Elide polyglot!\n');

  // Create A3C agent
  const agent = new A3CAgent({
    stateShape: [4],
    actionSize: 2,
    continuous: false,
    numWorkers: 4,
    learningRate: 0.0001,
    discount: 0.99,
    entropyCoef: 0.01,
    nStep: 5,
    updateFreq: 20,
    device: 'cpu',
  });

  console.log('✅ A3C Agent created successfully!');
  console.log('\nAgent features:');
  console.log('  - Multiple asynchronous workers');
  console.log('  - Shared global network with memory sharing');
  console.log('  - N-step bootstrapping');
  console.log('  - Entropy regularization');
  console.log('  - Gradient clipping');
  console.log('\nNote: This is a demonstration. Actual training requires');
  console.log('running workers in separate threads/processes.');
}
