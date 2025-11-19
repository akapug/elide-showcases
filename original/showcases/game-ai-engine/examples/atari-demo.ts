/**
 * Atari Game Training Demo
 *
 * Complete demonstration of training DQN agents on Atari games:
 * - Breakout, Pong, Space Invaders
 * - Frame preprocessing and stacking
 * - Nature DQN architecture
 * - Experience replay and target networks
 * - Training visualization and logging
 *
 * Shows Elide's full polyglot capabilities: PyTorch + OpenAI Gym
 * + NumPy all seamlessly integrated in TypeScript!
 */

// Import RL components
import { DQNAgent } from '../src/algorithms/dqn.ts';
import { AtariEnv, GymEnvFactory } from '../src/environments/gym-wrapper.ts';
import { NatureDQN } from '../src/neural-nets/conv-net.ts';
import { DQNTrainer } from '../src/training/trainer.ts';
import { AgentEvaluator } from '../src/evaluation/evaluator.ts';

// @ts-ignore - NumPy
import numpy from 'python:numpy';
// @ts-ignore - PyTorch
import torch from 'python:torch';

// ============================================================================
// Configuration
// ============================================================================

const ATARI_GAMES = {
  breakout: 'ALE/Breakout-v5',
  pong: 'ALE/Pong-v5',
  spaceInvaders: 'ALE/SpaceInvaders-v5',
  seaquest: 'ALE/Seaquest-v5',
  qbert: 'ALE/Qbert-v5',
};

interface AtariDemoConfig {
  game: keyof typeof ATARI_GAMES;
  episodes: number;
  device: string;
  renderMode?: string;
  checkpointInterval: number;
  evalInterval: number;
}

// ============================================================================
// Atari Training Demo
// ============================================================================

export class AtariTrainingDemo {
  private config: AtariDemoConfig;
  private env: AtariEnv | null = null;
  private agent: DQNAgent | null = null;
  private trainer: DQNTrainer | null = null;

  constructor(config: Partial<AtariDemoConfig> = {}) {
    this.config = {
      game: 'breakout',
      episodes: 10000,
      device: 'cpu',
      checkpointInterval: 500,
      evalInterval: 100,
      ...config,
    };

    console.log('[AtariDemo] Configuration:');
    console.log(`  Game: ${this.config.game}`);
    console.log(`  Episodes: ${this.config.episodes}`);
    console.log(`  Device: ${this.config.device}`);
  }

  /**
   * Setup environment and agent
   */
  setup(): void {
    console.log('\n🎮 Setting up Atari environment...');

    // Create Atari environment
    const envName = ATARI_GAMES[this.config.game];
    this.env = new AtariEnv({
      envName,
      renderMode: this.config.renderMode,
      frameStack: 4,
      frameSkip: 4,
      grayscale: true,
      resize: [84, 84],
      normalize: true,
      clipRewards: true,
    });

    const envInfo = this.env.getInfo();
    console.log(`✅ Environment created: ${envInfo.name}`);
    console.log(`  Observation shape: ${envInfo.observationSpace.shape}`);
    console.log(`  Action space: ${envInfo.actionSpace.n} actions`);

    // Create DQN agent
    console.log('\n🤖 Creating DQN agent...');

    this.agent = new DQNAgent({
      stateShape: envInfo.observationSpace.shape || [4, 84, 84],
      actionSize: envInfo.actionSpace.n || 18,
      learningRate: 0.00025,
      discount: 0.99,
      epsilon: 1.0,
      epsilonMin: 0.1,
      epsilonDecay: 0.9999,
      batchSize: 32,
      memorySize: 100000,
      targetUpdateFreq: 1000,
      doubleDQN: true,
      duelingDQN: true,
      prioritizedReplay: false,
      device: this.config.device,
    });

    console.log('✅ DQN agent created');

    // Create trainer
    this.trainer = new DQNTrainer({
      totalEpisodes: this.config.episodes,
      maxStepsPerEpisode: 10000,
      evalInterval: this.config.evalInterval,
      saveInterval: this.config.checkpointInterval,
      warmupSteps: 50000,
      checkpointDir: `./checkpoints/${this.config.game}`,
      verbose: true,
    });

    console.log('✅ Trainer created\n');
  }

  /**
   * Train agent
   */
  async train(): Promise<void> {
    if (!this.env || !this.agent || !this.trainer) {
      throw new Error('Setup not complete');
    }

    console.log('🚀 Starting training...\n');

    const metrics = await this.trainer.train(this.agent, this.env);

    console.log('\n📊 Training Complete!');
    console.log(`  Total episodes: ${metrics.episodeRewards.length}`);
    console.log(`  Total steps: ${metrics.totalSteps}`);
    console.log(`  Best reward: ${metrics.bestReward.toFixed(2)}`);
    console.log(`  Training time: ${metrics.totalTime.toFixed(2)}s`);
  }

  /**
   * Evaluate trained agent
   */
  async evaluate(numEpisodes = 10): Promise<void> {
    if (!this.env || !this.agent) {
      throw new Error('Setup not complete');
    }

    console.log('\n🔍 Evaluating agent...');

    const evaluator = new AgentEvaluator({
      numEpisodes,
      deterministic: true,
      render: true,
      verbose: true,
    });

    const metrics = await evaluator.evaluate(this.agent, this.env);

    console.log('\n📊 Evaluation Results:');
    console.log(`  Mean reward: ${metrics.meanReward.toFixed(2)} ± ${metrics.stdReward.toFixed(2)}`);
    console.log(`  Success rate: ${(metrics.successRate * 100).toFixed(1)}%`);
  }

  /**
   * Run demo episode with visualization
   */
  async playDemo(): Promise<void> {
    if (!this.env || !this.agent) {
      throw new Error('Setup not complete');
    }

    console.log('\n🎮 Running demo episode...\n');

    let state = this.env.reset();
    let totalReward = 0;
    let steps = 0;

    for (let step = 0; step < 10000; step++) {
      // Render
      if (this.env.render) {
        console.clear();
        console.log(this.env.render());
        console.log(`\nStep: ${steps}`);
        console.log(`Total Reward: ${totalReward.toFixed(2)}`);
      }

      // Select action (greedy)
      const action = this.agent.selectAction(state, false);

      // Take action
      const result = this.env.step(action);
      totalReward += result.reward;
      steps++;
      state = result.observation;

      if (result.done) {
        console.log(`\n✅ Episode finished!`);
        console.log(`  Steps: ${steps}`);
        console.log(`  Total Reward: ${totalReward.toFixed(2)}`);
        break;
      }

      // Small delay for visualization
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  }
}

// ============================================================================
// Multi-Game Benchmark
// ============================================================================

export class AtariSuiteBenchmark {
  private games: (keyof typeof ATARI_GAMES)[];
  private episodes: number;

  constructor(games: (keyof typeof ATARI_GAMES)[], episodes = 1000) {
    this.games = games;
    this.episodes = episodes;
  }

  async runBenchmark(): Promise<Map<string, any>> {
    console.log('🏆 Running Atari Suite Benchmark\n');

    const results = new Map<string, any>();

    for (const game of this.games) {
      console.log(`\n🎮 Training on ${game}...`);

      const demo = new AtariTrainingDemo({
        game,
        episodes: this.episodes,
        device: 'cpu',
        evalInterval: Math.floor(this.episodes / 10),
      });

      demo.setup();
      await demo.train();

      const evaluator = new AgentEvaluator({
        numEpisodes: 10,
        deterministic: true,
        verbose: false,
      });

      // Store results
      results.set(game, {
        completed: true,
        // metrics would be added here
      });
    }

    console.log('\n🏆 Benchmark Complete!\n');
    this.printBenchmarkResults(results);

    return results;
  }

  private printBenchmarkResults(results: Map<string, any>): void {
    console.log('📊 Benchmark Results:\n');
    console.log('| Game | Mean Reward | Success Rate |');
    console.log('|------|-------------|--------------|');

    for (const [game, result] of results.entries()) {
      if (result.completed) {
        console.log(`| ${game} | - | - |`);
      }
    }
  }
}

// ============================================================================
// Comparison: DQN vs Double DQN vs Dueling DQN
// ============================================================================

export async function compareAtariAlgorithms(
  envName: string,
  episodes = 1000
): Promise<void> {
  console.log('🆚 Comparing DQN Variants\n');

  const configs = [
    { name: 'Standard DQN', doubleDQN: false, duelingDQN: false },
    { name: 'Double DQN', doubleDQN: true, duelingDQN: false },
    { name: 'Dueling DQN', doubleDQN: false, duelingDQN: true },
    { name: 'Double Dueling DQN', doubleDQN: true, duelingDQN: true },
  ];

  const results: any[] = [];

  for (const config of configs) {
    console.log(`\nTraining ${config.name}...`);

    // Create environment
    const env = new AtariEnv({
      envName,
      frameStack: 4,
      grayscale: true,
      resize: [84, 84],
    });

    // Create agent
    const agent = new DQNAgent({
      stateShape: [4, 84, 84],
      actionSize: 18,
      doubleDQN: config.doubleDQN,
      duelingDQN: config.duelingDQN,
      device: 'cpu',
    });

    // Train
    const trainer = new DQNTrainer({
      totalEpisodes: episodes,
      verbose: false,
    });

    const metrics = await trainer.train(agent, env);

    results.push({
      name: config.name,
      bestReward: metrics.bestReward,
      finalAvgReward: metrics.avgRewards[metrics.avgRewards.length - 1],
    });

    env.close();
  }

  // Print comparison
  console.log('\n📊 Algorithm Comparison:\n');
  console.log('| Algorithm | Best Reward | Final Avg Reward |');
  console.log('|-----------|-------------|------------------|');

  for (const result of results) {
    console.log(
      `| ${result.name} | ${result.bestReward.toFixed(2)} | ${result.finalAvgReward.toFixed(2)} |`
    );
  }
}

// ============================================================================
// Frame Preprocessing Visualization
// ============================================================================

export function visualizeFrameProcessing(envName: string): void {
  console.log('🖼️  Frame Preprocessing Visualization\n');

  const env = new AtariEnv({
    envName,
    frameStack: 4,
    frameSkip: 4,
    grayscale: true,
    resize: [84, 84],
    normalize: true,
  });

  console.log('Environment created with preprocessing:');
  console.log('  - Frame skip: 4');
  console.log('  - Grayscale conversion');
  console.log('  - Resize to 84x84');
  console.log('  - Frame stacking: 4 frames');
  console.log('  - Normalization: [0, 1]');

  const state = env.reset();
  console.log(`\nState shape: ${state.shape}`);
  console.log(`State dtype: ${state.dtype}`);
  console.log(`State range: [${numpy.min(state)}, ${numpy.max(state)}]`);

  env.close();
}

// ============================================================================
// Main Demo
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Atari Game AI Training Demo\n');
  console.log('═'.repeat(50));
  console.log('\nThis demo showcases:');
  console.log('  ✓ Elide polyglot: PyTorch + OpenAI Gym in TypeScript');
  console.log('  ✓ DQN training on Atari games');
  console.log('  ✓ Frame preprocessing and stacking');
  console.log('  ✓ Nature DQN CNN architecture');
  console.log('  ✓ Experience replay and target networks');
  console.log('  ✓ Training visualization and evaluation');
  console.log('\n' + '═'.repeat(50) + '\n');

  // Choose demo mode
  const demoMode = 'quick'; // 'quick' | 'full' | 'benchmark' | 'compare'

  if (demoMode === 'quick') {
    // Quick demo (just setup and short training)
    console.log('🚀 Quick Demo Mode\n');

    const demo = new AtariTrainingDemo({
      game: 'breakout',
      episodes: 100,
      device: 'cpu',
      evalInterval: 50,
    });

    demo.setup();
    await demo.train();
    await demo.evaluate(5);
  } else if (demoMode === 'full') {
    // Full training run
    console.log('🚀 Full Training Mode\n');

    const demo = new AtariTrainingDemo({
      game: 'pong',
      episodes: 10000,
      device: 'cpu',
    });

    demo.setup();
    await demo.train();
    await demo.evaluate(10);
    await demo.playDemo();
  } else if (demoMode === 'benchmark') {
    // Benchmark multiple games
    const benchmark = new AtariSuiteBenchmark(
      ['breakout', 'pong', 'spaceInvaders'],
      1000
    );

    await benchmark.runBenchmark();
  } else if (demoMode === 'compare') {
    // Compare DQN variants
    await compareAtariAlgorithms('ALE/Breakout-v5', 500);
  }

  console.log('\n✅ Demo complete!');
  console.log('\n💡 This demonstrates Elide\'s unique capability:');
  console.log('   Running PyTorch + OpenAI Gym seamlessly in TypeScript!');
  console.log('   No language barriers, no performance overhead!');
}
