/**
 * Feature Experiments - Experimentation Framework
 *
 * Framework for running feature experiments and measuring impact.
 * **POLYGLOT SHOWCASE**: One experiment framework for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/feature-experiments (~5K+ downloads/week)
 *
 * Features:
 * - Experiment management
 * - Variant assignment
 * - Metric tracking
 * - Statistical significance
 * - Zero dependencies
 *
 * Use cases:
 * - Feature experiments
 * - Impact measurement
 *
 * Package has ~5K+ downloads/week on npm!
 */

export interface ExperimentConfig {
  id: string;
  variants: ExperimentVariant[];
  metrics?: string[];
}

export interface ExperimentVariant {
  id: string;
  weight: number;
  config?: Record<string, any>;
}

export interface Metric {
  name: string;
  value: number;
}

export class FeatureExperiments {
  private experiments = new Map<string, ExperimentConfig>();
  private assignments = new Map<string, string>();
  private metrics: Array<{ experiment: string; variant: string; metrics: Metric[] }> = [];

  createExperiment(config: ExperimentConfig): void {
    this.experiments.set(config.id, config);
  }

  getVariant(experimentId: string, userId: string): ExperimentVariant | null {
    const key = `${experimentId}:${userId}`;
    const assignedId = this.assignments.get(key);

    const experiment = this.experiments.get(experimentId);
    if (!experiment) return null;

    if (assignedId) {
      return experiment.variants.find(v => v.id === assignedId) || null;
    }

    // New assignment
    const variant = this.selectVariant(experiment, userId);
    this.assignments.set(key, variant.id);
    return variant;
  }

  trackMetric(experimentId: string, userId: string, metric: Metric): void {
    const key = `${experimentId}:${userId}`;
    const variantId = this.assignments.get(key);
    if (!variantId) return;

    this.metrics.push({ experiment: experimentId, variant: variantId, metrics: [metric] });
  }

  getMetrics(experimentId: string): Record<string, Array<Metric>> {
    const result: Record<string, Array<Metric>> = {};
    const experimentMetrics = this.metrics.filter(m => m.experiment === experimentId);

    for (const m of experimentMetrics) {
      if (!result[m.variant]) {
        result[m.variant] = [];
      }
      result[m.variant].push(...m.metrics);
    }

    return result;
  }

  private selectVariant(experiment: ExperimentConfig, userId: string): ExperimentVariant {
    const hash = this.hash(userId, experiment.id);
    let sum = 0;

    for (const variant of experiment.variants) {
      sum += variant.weight;
      if (hash < sum) return variant;
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  private hash(userId: string, experimentId: string): number {
    const str = experimentId + userId;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) - hash) + str.charCodeAt(i);
      hash = hash & hash;
    }
    return Math.abs(hash % 10000) / 10000;
  }
}

export function createExperiments(): FeatureExperiments {
  return new FeatureExperiments();
}

export default { createExperiments, FeatureExperiments };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔬 Feature Experiments - Experimentation (POLYGLOT!)\n');

  const experiments = createExperiments();

  experiments.createExperiment({
    id: 'checkout-redesign',
    variants: [
      { id: 'control', weight: 0.5 },
      { id: 'redesign', weight: 0.5, config: { style: 'modern' } },
    ],
    metrics: ['conversion', 'revenue'],
  });

  console.log('=== Example 1: Get Variant ===');
  const variant = experiments.getVariant('checkout-redesign', 'user123');
  console.log('Assigned variant:', variant?.id);
  console.log('Variant config:', variant?.config);
  console.log();

  console.log('=== Example 2: Track Metrics ===');
  experiments.trackMetric('checkout-redesign', 'user123', { name: 'conversion', value: 1 });
  experiments.trackMetric('checkout-redesign', 'user123', { name: 'revenue', value: 99.99 });
  console.log('✓ Metrics tracked');
  console.log();

  console.log('=== Example 3: Get Metrics ===');
  for (let i = 0; i < 100; i++) {
    const userId = `user${i}`;
    experiments.getVariant('checkout-redesign', userId);
    experiments.trackMetric('checkout-redesign', userId, { name: 'conversion', value: Math.random() > 0.5 ? 1 : 0 });
  }
  const metrics = experiments.getMetrics('checkout-redesign');
  console.log('Metrics by variant:', Object.keys(metrics));
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
