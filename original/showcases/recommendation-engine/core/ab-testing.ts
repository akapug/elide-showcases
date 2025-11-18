import type { Logger } from 'pino';

interface Experiment {
  id: string;
  variants: string[];
  weights: number[];
}

export class ABTesting {
  private experiments = new Map<string, Experiment>();
  private assignments = new Map<string, Map<string, string>>();

  constructor(private logger: Logger) {
    this.initializeExperiments();
  }

  assign(userId: string, experimentId?: string): { experimentId: string; variant: string; userId: string } {
    const expId = experimentId || process.env.DEFAULT_EXPERIMENT || 'exp_hybrid_vs_cf';
    const experiment = this.experiments.get(expId);

    if (!experiment) {
      throw new Error(`Experiment ${expId} not found`);
    }

    // Check existing assignment
    let userAssignments = this.assignments.get(userId);
    if (!userAssignments) {
      userAssignments = new Map();
      this.assignments.set(userId, userAssignments);
    }

    let variant = userAssignments.get(expId);
    if (!variant) {
      // Assign based on weights
      variant = this.selectVariant(experiment, userId);
      userAssignments.set(expId, variant);

      this.logger.info({
        action: 'ab_assignment',
        userId,
        experimentId: expId,
        variant
      });
    }

    return {
      experimentId: expId,
      variant,
      userId
    };
  }

  private selectVariant(experiment: Experiment, userId: string): string {
    // Hash-based assignment for consistency
    const hash = this.hashString(userId);
    const normalized = hash / 0xFFFFFFFF;

    let cumulative = 0;
    for (let i = 0; i < experiment.variants.length; i++) {
      cumulative += experiment.weights[i];
      if (normalized < cumulative) {
        return experiment.variants[i];
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  private initializeExperiments(): void {
    this.experiments.set('exp_hybrid_vs_cf', {
      id: 'exp_hybrid_vs_cf',
      variants: ['hybrid', 'collaborative_filtering'],
      weights: [0.5, 0.5]
    });

    this.experiments.set('exp_neural_vs_matrix', {
      id: 'exp_neural_vs_matrix',
      variants: ['neural_cf', 'matrix_factorization'],
      weights: [0.3, 0.7]
    });
  }
}
