/**
 * FFlip - Feature Flip Library
 *
 * Flexible feature flipping with criteria-based activation.
 * **POLYGLOT SHOWCASE**: One feature flip for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/fflip (~10K+ downloads/week)
 *
 * Features:
 * - Criteria-based features
 * - User context evaluation
 * - Custom criteria functions
 * - Flexible activation
 * - Zero dependencies
 *
 * Use cases:
 * - Criteria-based features
 * - Context evaluation
 *
 * Package has ~10K+ downloads/week on npm!
 */

export interface FFlipConfig {
  features: FeatureConfig[];
  criteria: Record<string, CriteriaFunction>;
}

export interface FeatureConfig {
  name: string;
  criteria: string | string[];
}

export type CriteriaFunction = (user: any, feature: string) => boolean;

export class FFlip {
  private features = new Map<string, string | string[]>();
  private criteria: Record<string, CriteriaFunction>;

  constructor(config: FFlipConfig) {
    this.criteria = config.criteria;
    for (const feature of config.features) {
      this.features.set(feature.name, feature.criteria);
    }
  }

  isFeatureEnabled(featureName: string, user: any): boolean {
    const criteria = this.features.get(featureName);
    if (!criteria) return false;

    if (typeof criteria === 'string') {
      return this.evaluateCriteria(criteria, user, featureName);
    }

    return criteria.every(c => this.evaluateCriteria(c, user, featureName));
  }

  private evaluateCriteria(name: string, user: any, feature: string): boolean {
    const fn = this.criteria[name];
    if (!fn) return false;
    return fn(user, feature);
  }

  getFeatures(user: any): Record<string, boolean> {
    const result: Record<string, boolean> = {};
    for (const [name] of this.features) {
      result[name] = this.isFeatureEnabled(name, user);
    }
    return result;
  }
}

export function create(config: FFlipConfig): FFlip {
  return new FFlip(config);
}

export default { create, FFlip };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🔄 FFlip - Feature Flip (POLYGLOT!)\n');

  const fflip = create({
    features: [
      { name: 'premium', criteria: 'isPremium' },
      { name: 'beta', criteria: ['isStaff', 'betaEnabled'] },
    ],
    criteria: {
      isPremium: (user: any) => user.plan === 'premium',
      isStaff: (user: any) => user.role === 'staff',
      betaEnabled: (user: any) => user.beta === true,
    },
  });

  console.log('=== Example 1: Premium Users ===');
  const freeUser = { id: '1', plan: 'free' };
  const premiumUser = { id: '2', plan: 'premium' };
  console.log('Premium for free user:', fflip.isFeatureEnabled('premium', freeUser));
  console.log('Premium for premium user:', fflip.isFeatureEnabled('premium', premiumUser));
  console.log();

  console.log('=== Example 2: Multiple Criteria ===');
  const staffUser = { id: '3', role: 'staff', beta: true };
  const regularUser = { id: '4', role: 'user', beta: false };
  console.log('Beta for staff:', fflip.isFeatureEnabled('beta', staffUser));
  console.log('Beta for regular:', fflip.isFeatureEnabled('beta', regularUser));
  console.log();

  console.log('=== Example 3: All Features ===');
  console.log('Features for premium user:', fflip.getFeatures(premiumUser));
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
