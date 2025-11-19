/**
 * Agent Evaluation System
 *
 * Comprehensive evaluation and analysis of trained RL agents:
 * - Performance metrics calculation
 * - Statistical analysis
 * - Visualization and rendering
 * - Comparison between agents
 * - Policy analysis and debugging
 *
 * Demonstrates evaluation pipelines using Python's scientific
 * computing libraries seamlessly in TypeScript!
 */

// @ts-ignore - NumPy for numerical operations
import numpy from 'python:numpy';
// @ts-ignore - Python statistics module
import statistics from 'python:statistics';
// @ts-ignore - Python time module
import time from 'python:time';

// ============================================================================
// Type Definitions
// ============================================================================

export interface EvaluationConfig {
  numEpisodes: number;
  maxStepsPerEpisode?: number;
  render?: boolean;
  renderInterval?: number;
  deterministic?: boolean;
  verbose?: boolean;
  recordVideo?: boolean;
}

export interface EpisodeResult {
  episode: number;
  totalReward: number;
  steps: number;
  duration: number;
  success: boolean;
  info: any;
}

export interface EvaluationMetrics {
  meanReward: number;
  stdReward: number;
  minReward: number;
  maxReward: number;
  medianReward: number;
  meanSteps: number;
  stdSteps: number;
  successRate: number;
  episodes: EpisodeResult[];
  totalTime: number;
}

export interface ComparisonMetrics {
  agent1: EvaluationMetrics;
  agent2: EvaluationMetrics;
  winner: string;
  improvement: number;
}

// ============================================================================
// Agent Evaluator
// ============================================================================

export class AgentEvaluator {
  private config: Required<EvaluationConfig>;

  constructor(config: EvaluationConfig) {
    this.config = {
      maxStepsPerEpisode: 1000,
      render: false,
      renderInterval: 1,
      deterministic: true,
      verbose: true,
      recordVideo: false,
      ...config,
    };

    console.log('[AgentEvaluator] Initialized');
    console.log(`  Episodes: ${this.config.numEpisodes}`);
    console.log(`  Deterministic: ${this.config.deterministic}`);
  }

  /**
   * Evaluate agent on environment
   */
  async evaluate(agent: any, environment: any): Promise<EvaluationMetrics> {
    if (this.config.verbose) {
      console.log('\n🔍 Evaluating agent...\n');
    }

    const startTime = time.time();
    const episodes: EpisodeResult[] = [];

    for (let i = 0; i < this.config.numEpisodes; i++) {
      const result = await this.runEpisode(agent, environment, i + 1);
      episodes.push(result);

      if (this.config.verbose && (i + 1) % 10 === 0) {
        console.log(
          `Episode ${i + 1}/${this.config.numEpisodes}: ` +
          `Reward = ${result.totalReward.toFixed(2)}, ` +
          `Steps = ${result.steps}`
        );
      }
    }

    const totalTime = time.time() - startTime;

    // Calculate metrics
    const metrics = this.calculateMetrics(episodes, totalTime);

    if (this.config.verbose) {
      this.printMetrics(metrics);
    }

    return metrics;
  }

  /**
   * Run single evaluation episode
   */
  private async runEpisode(
    agent: any,
    environment: any,
    episodeNum: number
  ): Promise<EpisodeResult> {
    const startTime = time.time();

    let state = environment.reset();
    let totalReward = 0;
    let steps = 0;
    let success = false;
    let info: any = {};

    for (let step = 0; step < this.config.maxStepsPerEpisode; step++) {
      // Select action (deterministic if configured)
      const action = agent.selectAction(state, !this.config.deterministic);

      // Render if enabled
      if (
        this.config.render &&
        episodeNum % this.config.renderInterval === 0
      ) {
        if (environment.render) {
          const frame = environment.render();
          if (frame && typeof frame === 'string') {
            console.log(frame);
          }
        }
      }

      // Take action
      const result = environment.step(action);
      const { observation: nextState, reward, done, info: stepInfo } = result;

      totalReward += reward;
      steps++;
      state = nextState;
      info = stepInfo || {};

      if (done) {
        // Check if episode was successful
        success = this.checkSuccess(info, totalReward);
        break;
      }
    }

    const duration = time.time() - startTime;

    return {
      episode: episodeNum,
      totalReward,
      steps,
      duration,
      success,
      info,
    };
  }

  /**
   * Calculate evaluation metrics
   */
  private calculateMetrics(
    episodes: EpisodeResult[],
    totalTime: number
  ): EvaluationMetrics {
    const rewards = episodes.map(e => e.totalReward);
    const steps = episodes.map(e => e.steps);
    const successes = episodes.filter(e => e.success).length;

    return {
      meanReward: this.mean(rewards),
      stdReward: this.std(rewards),
      minReward: Math.min(...rewards),
      maxReward: Math.max(...rewards),
      medianReward: this.median(rewards),
      meanSteps: this.mean(steps),
      stdSteps: this.std(steps),
      successRate: successes / episodes.length,
      episodes,
      totalTime,
    };
  }

  /**
   * Check if episode was successful
   */
  private checkSuccess(info: any, reward: number): boolean {
    // Check info dictionary for success flag
    if (info && info.success !== undefined) {
      return info.success;
    }

    // Default: consider high reward as success
    return reward > 0;
  }

  /**
   * Print evaluation metrics
   */
  private printMetrics(metrics: EvaluationMetrics): void {
    console.log('\n📊 Evaluation Results:');
    console.log(`  Episodes: ${metrics.episodes.length}`);
    console.log(`  Mean Reward: ${metrics.meanReward.toFixed(2)} ± ${metrics.stdReward.toFixed(2)}`);
    console.log(`  Min/Max Reward: ${metrics.minReward.toFixed(2)} / ${metrics.maxReward.toFixed(2)}`);
    console.log(`  Median Reward: ${metrics.medianReward.toFixed(2)}`);
    console.log(`  Mean Steps: ${metrics.meanSteps.toFixed(1)} ± ${metrics.stdSteps.toFixed(1)}`);
    console.log(`  Success Rate: ${(metrics.successRate * 100).toFixed(1)}%`);
    console.log(`  Total Time: ${metrics.totalTime.toFixed(2)}s`);
    console.log();
  }

  /**
   * Calculate mean
   */
  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private std(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = this.mean(squaredDiffs);
    return Math.sqrt(variance);
  }

  /**
   * Calculate median
   */
  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  /**
   * Generate evaluation report
   */
  generateReport(metrics: EvaluationMetrics): string {
    let report = '# Agent Evaluation Report\n\n';

    report += '## Summary Statistics\n\n';
    report += `- **Episodes**: ${metrics.episodes.length}\n`;
    report += `- **Mean Reward**: ${metrics.meanReward.toFixed(2)} ± ${metrics.stdReward.toFixed(2)}\n`;
    report += `- **Median Reward**: ${metrics.medianReward.toFixed(2)}\n`;
    report += `- **Min Reward**: ${metrics.minReward.toFixed(2)}\n`;
    report += `- **Max Reward**: ${metrics.maxReward.toFixed(2)}\n`;
    report += `- **Success Rate**: ${(metrics.successRate * 100).toFixed(1)}%\n`;
    report += `- **Mean Steps**: ${metrics.meanSteps.toFixed(1)}\n\n`;

    report += '## Episode Details\n\n';
    report += '| Episode | Reward | Steps | Success |\n';
    report += '|---------|--------|-------|--------|\n';

    for (const episode of metrics.episodes) {
      report += `| ${episode.episode} | ${episode.totalReward.toFixed(2)} | ${episode.steps} | ${episode.success ? '✓' : '✗'} |\n`;
    }

    return report;
  }
}

// ============================================================================
// Agent Comparison
// ============================================================================

export class AgentComparator {
  /**
   * Compare two agents
   */
  async compare(
    agent1: any,
    agent2: any,
    environment: any,
    numEpisodes: number
  ): Promise<ComparisonMetrics> {
    console.log('\n🆚 Comparing agents...\n');

    const evaluator = new AgentEvaluator({
      numEpisodes,
      deterministic: true,
      verbose: false,
    });

    console.log('Evaluating Agent 1...');
    const metrics1 = await evaluator.evaluate(agent1, environment);

    console.log('Evaluating Agent 2...');
    const metrics2 = await evaluator.evaluate(agent2, environment);

    // Determine winner
    const winner = metrics1.meanReward > metrics2.meanReward ? 'Agent 1' : 'Agent 2';
    const improvement = Math.abs(
      ((metrics2.meanReward - metrics1.meanReward) / metrics1.meanReward) * 100
    );

    const comparison: ComparisonMetrics = {
      agent1: metrics1,
      agent2: metrics2,
      winner,
      improvement,
    };

    this.printComparison(comparison);

    return comparison;
  }

  /**
   * Print comparison results
   */
  private printComparison(comparison: ComparisonMetrics): void {
    console.log('\n📊 Comparison Results:\n');

    console.log('Agent 1:');
    console.log(`  Mean Reward: ${comparison.agent1.meanReward.toFixed(2)}`);
    console.log(`  Success Rate: ${(comparison.agent1.successRate * 100).toFixed(1)}%`);

    console.log('\nAgent 2:');
    console.log(`  Mean Reward: ${comparison.agent2.meanReward.toFixed(2)}`);
    console.log(`  Success Rate: ${(comparison.agent2.successRate * 100).toFixed(1)}%`);

    console.log(`\n🏆 Winner: ${comparison.winner}`);
    console.log(`   Improvement: ${comparison.improvement.toFixed(1)}%\n`);
  }

  /**
   * Perform statistical significance test
   */
  performTTest(
    rewards1: number[],
    rewards2: number[]
  ): { tStat: number; pValue: number; significant: boolean } {
    // Simple t-test implementation
    const mean1 = rewards1.reduce((sum, r) => sum + r, 0) / rewards1.length;
    const mean2 = rewards2.reduce((sum, r) => sum + r, 0) / rewards2.length;

    const var1 = this.variance(rewards1, mean1);
    const var2 = this.variance(rewards2, mean2);

    const n1 = rewards1.length;
    const n2 = rewards2.length;

    const pooledVar = ((n1 - 1) * var1 + (n2 - 1) * var2) / (n1 + n2 - 2);
    const tStat = (mean1 - mean2) / Math.sqrt(pooledVar * (1 / n1 + 1 / n2));

    // Simplified p-value calculation (for demonstration)
    const pValue = 1 - Math.abs(tStat) / 10; // Placeholder
    const significant = pValue < 0.05;

    return { tStat, pValue, significant };
  }

  private variance(values: number[], mean: number): number {
    const squaredDiffs = values.map(v => Math.pow(v - mean, 2));
    return squaredDiffs.reduce((sum, d) => sum + d, 0) / (values.length - 1);
  }
}

// ============================================================================
// Policy Analyzer
// ============================================================================

export class PolicyAnalyzer {
  /**
   * Analyze action distribution
   */
  analyzeActionDistribution(
    agent: any,
    environment: any,
    numSteps: number
  ): Map<number, number> {
    const actionCounts = new Map<number, number>();

    let state = environment.reset();

    for (let i = 0; i < numSteps; i++) {
      const action = agent.selectAction(state, false);

      const count = actionCounts.get(action) || 0;
      actionCounts.set(action, count + 1);

      const result = environment.step(action);
      state = result.observation;

      if (result.done) {
        state = environment.reset();
      }
    }

    console.log('\n📊 Action Distribution:');
    for (const [action, count] of actionCounts.entries()) {
      const percentage = (count / numSteps) * 100;
      console.log(`  Action ${action}: ${percentage.toFixed(1)}%`);
    }

    return actionCounts;
  }

  /**
   * Analyze Q-values
   */
  analyzeQValues(agent: any, states: any[]): void {
    if (!agent.evaluateQ) {
      console.log('Agent does not support Q-value evaluation');
      return;
    }

    console.log('\n📊 Q-Value Analysis:');

    for (let i = 0; i < states.length; i++) {
      const qValues = agent.evaluateQ(states[i]);

      if (Array.isArray(qValues)) {
        console.log(`\nState ${i}:`);
        qValues.forEach((q, action) => {
          console.log(`  Action ${action}: ${q.toFixed(3)}`);
        });

        const maxQ = Math.max(...qValues);
        const bestAction = qValues.indexOf(maxQ);
        console.log(`  Best Action: ${bestAction} (Q = ${maxQ.toFixed(3)})`);
      }
    }
  }

  /**
   * Analyze value function
   */
  analyzeValueFunction(agent: any, states: any[]): number[] {
    if (!agent.evaluateValue) {
      console.log('Agent does not support value evaluation');
      return [];
    }

    const values = states.map(state => agent.evaluateValue(state));

    console.log('\n📊 Value Function Analysis:');
    console.log(`  Mean Value: ${this.mean(values).toFixed(3)}`);
    console.log(`  Std Value: ${this.std(values).toFixed(3)}`);
    console.log(`  Min/Max: ${Math.min(...values).toFixed(3)} / ${Math.max(...values).toFixed(3)}`);

    return values;
  }

  private mean(values: number[]): number {
    return values.reduce((sum, v) => sum + v, 0) / values.length;
  }

  private std(values: number[]): number {
    const avg = this.mean(values);
    const squaredDiffs = values.map(v => Math.pow(v - avg, 2));
    const variance = this.mean(squaredDiffs);
    return Math.sqrt(variance);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Calculate confidence interval
 */
export function calculateConfidenceInterval(
  values: number[],
  confidence = 0.95
): { lower: number; upper: number; mean: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const n = sorted.length;
  const mean = sorted.reduce((sum, v) => sum + v, 0) / n;

  // Simple percentile-based confidence interval
  const alpha = 1 - confidence;
  const lowerIdx = Math.floor(n * (alpha / 2));
  const upperIdx = Math.floor(n * (1 - alpha / 2));

  return {
    lower: sorted[lowerIdx],
    upper: sorted[upperIdx],
    mean,
  };
}

/**
 * Bootstrap resampling for uncertainty estimation
 */
export function bootstrapMean(
  values: number[],
  numSamples = 1000
): number[] {
  const bootstrapMeans: number[] = [];

  for (let i = 0; i < numSamples; i++) {
    const sample: number[] = [];
    for (let j = 0; j < values.length; j++) {
      const idx = Math.floor(Math.random() * values.length);
      sample.push(values[idx]);
    }

    const mean = sample.reduce((sum, v) => sum + v, 0) / sample.length;
    bootstrapMeans.push(mean);
  }

  return bootstrapMeans;
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🎮 Agent Evaluation System\n');
  console.log('This demonstrates:');
  console.log('  - Comprehensive agent evaluation');
  console.log('  - Statistical analysis of performance');
  console.log('  - Agent comparison and benchmarking');
  console.log('  - Policy and value function analysis');
  console.log('  - All using Python scientific libraries!\n');

  const evaluator = new AgentEvaluator({
    numEpisodes: 100,
    deterministic: true,
    verbose: true,
  });

  console.log('✅ Evaluator initialized');
  console.log('\nReady to evaluate and analyze RL agents with');
  console.log('comprehensive metrics and statistical tests!');
}
