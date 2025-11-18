/**
 * A/B Testing Implementation
 *
 * Comprehensive A/B testing framework for edge computing:
 * - Variant assignment and bucketing
 * - Traffic splitting
 * - Multivariate testing
 * - Feature flags
 * - Experiment tracking
 * - Statistical analysis
 */

interface User {
  id: string;
  ip: string;
  sessionId?: string;
  attributes?: Record<string, any>;
}

interface Variant {
  id: string;
  name: string;
  weight: number;
  config?: Record<string, any>;
}

interface Experiment {
  id: string;
  name: string;
  variants: Variant[];
  startDate: Date;
  endDate?: Date;
  targetingRules?: TargetingRule[];
  enabled: boolean;
}

interface TargetingRule {
  attribute: string;
  operator: 'equals' | 'contains' | 'in' | 'regex';
  value: any;
}

interface Assignment {
  experimentId: string;
  variantId: string;
  userId: string;
  timestamp: Date;
}

interface ConversionEvent {
  experimentId: string;
  variantId: string;
  userId: string;
  eventName: string;
  value?: number;
  timestamp: Date;
}

/**
 * Experiment Manager
 */
class ExperimentManager {
  private experiments: Map<string, Experiment>;
  private assignments: Map<string, Assignment>;
  private conversions: ConversionEvent[];

  constructor() {
    this.experiments = new Map();
    this.assignments = new Map();
    this.conversions = [];
  }

  /**
   * Create a new experiment
   */
  createExperiment(experiment: Experiment): void {
    // Validate weights sum to 100
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    if (Math.abs(totalWeight - 100) > 0.01) {
      throw new Error(`Variant weights must sum to 100, got ${totalWeight}`);
    }

    this.experiments.set(experiment.id, experiment);
  }

  /**
   * Get variant for a user
   */
  getVariant(experimentId: string, user: User): Variant | null {
    const experiment = this.experiments.get(experimentId);

    if (!experiment || !experiment.enabled) {
      return null;
    }

    // Check if experiment is active
    const now = new Date();
    if (now < experiment.startDate) {
      return null;
    }
    if (experiment.endDate && now > experiment.endDate) {
      return null;
    }

    // Check targeting rules
    if (experiment.targetingRules && !this.matchesTargeting(user, experiment.targetingRules)) {
      return null;
    }

    // Check existing assignment
    const assignmentKey = `${experimentId}:${user.id}`;
    const existing = this.assignments.get(assignmentKey);

    if (existing) {
      return experiment.variants.find((v) => v.id === existing.variantId) || null;
    }

    // Assign new variant
    const variant = this.assignVariant(experiment, user);

    this.assignments.set(assignmentKey, {
      experimentId,
      variantId: variant.id,
      userId: user.id,
      timestamp: now,
    });

    return variant;
  }

  /**
   * Assign variant based on consistent hashing
   */
  private assignVariant(experiment: Experiment, user: User): Variant {
    // Use consistent hashing for stable assignments
    const hash = this.hashUser(experiment.id, user.id);
    const bucket = hash % 100;

    let cumulative = 0;
    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (bucket < cumulative) {
        return variant;
      }
    }

    return experiment.variants[experiment.variants.length - 1];
  }

  /**
   * Hash user ID for consistent bucketing
   */
  private hashUser(experimentId: string, userId: string): number {
    const str = `${experimentId}:${userId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  /**
   * Check if user matches targeting rules
   */
  private matchesTargeting(user: User, rules: TargetingRule[]): boolean {
    for (const rule of rules) {
      const value = user.attributes?.[rule.attribute];

      switch (rule.operator) {
        case 'equals':
          if (value !== rule.value) return false;
          break;
        case 'contains':
          if (typeof value !== 'string' || !value.includes(rule.value)) return false;
          break;
        case 'in':
          if (!Array.isArray(rule.value) || !rule.value.includes(value)) return false;
          break;
        case 'regex':
          if (typeof value !== 'string' || !new RegExp(rule.value).test(value)) return false;
          break;
      }
    }
    return true;
  }

  /**
   * Track conversion event
   */
  trackConversion(event: ConversionEvent): void {
    this.conversions.push(event);
  }

  /**
   * Get experiment results
   */
  getResults(experimentId: string): ExperimentResults {
    const experiment = this.experiments.get(experimentId);
    if (!experiment) {
      throw new Error(`Experiment ${experimentId} not found`);
    }

    // Count assignments per variant
    const assignmentCounts = new Map<string, number>();
    for (const assignment of this.assignments.values()) {
      if (assignment.experimentId === experimentId) {
        const count = assignmentCounts.get(assignment.variantId) || 0;
        assignmentCounts.set(assignment.variantId, count + 1);
      }
    }

    // Count conversions per variant
    const conversionCounts = new Map<string, number>();
    const conversionValues = new Map<string, number>();

    for (const conversion of this.conversions) {
      if (conversion.experimentId === experimentId) {
        const count = conversionCounts.get(conversion.variantId) || 0;
        conversionCounts.set(conversion.variantId, count + 1);

        if (conversion.value) {
          const total = conversionValues.get(conversion.variantId) || 0;
          conversionValues.set(conversion.variantId, total + conversion.value);
        }
      }
    }

    // Calculate metrics per variant
    const variantResults: VariantResults[] = experiment.variants.map((variant) => {
      const assignments = assignmentCounts.get(variant.id) || 0;
      const conversions = conversionCounts.get(variant.id) || 0;
      const conversionRate = assignments > 0 ? conversions / assignments : 0;
      const totalValue = conversionValues.get(variant.id) || 0;
      const avgValue = conversions > 0 ? totalValue / conversions : 0;

      return {
        variantId: variant.id,
        variantName: variant.name,
        assignments,
        conversions,
        conversionRate,
        totalValue,
        avgValue,
      };
    });

    return {
      experimentId,
      experimentName: experiment.name,
      variants: variantResults,
      totalAssignments: Array.from(assignmentCounts.values()).reduce((a, b) => a + b, 0),
      totalConversions: Array.from(conversionCounts.values()).reduce((a, b) => a + b, 0),
    };
  }

  /**
   * List all experiments
   */
  listExperiments(): Experiment[] {
    return Array.from(this.experiments.values());
  }

  /**
   * Get assignment count
   */
  getAssignmentCount(): number {
    return this.assignments.size;
  }

  /**
   * Get conversion count
   */
  getConversionCount(): number {
    return this.conversions.length;
  }
}

interface VariantResults {
  variantId: string;
  variantName: string;
  assignments: number;
  conversions: number;
  conversionRate: number;
  totalValue: number;
  avgValue: number;
}

interface ExperimentResults {
  experimentId: string;
  experimentName: string;
  variants: VariantResults[];
  totalAssignments: number;
  totalConversions: number;
}

/**
 * Feature Flag Manager
 */
class FeatureFlagManager {
  private flags: Map<string, FeatureFlag>;

  constructor() {
    this.flags = new Map();
  }

  createFlag(flag: FeatureFlag): void {
    this.flags.set(flag.id, flag);
  }

  isEnabled(flagId: string, user: User): boolean {
    const flag = this.flags.get(flagId);
    if (!flag || !flag.enabled) {
      return false;
    }

    // Check targeting
    if (flag.targetingRules) {
      const manager = new ExperimentManager();
      return manager['matchesTargeting'](user, flag.targetingRules);
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined) {
      const hash = this.hashUser(flagId, user.id);
      return (hash % 100) < flag.rolloutPercentage;
    }

    return true;
  }

  private hashUser(flagId: string, userId: string): number {
    const str = `${flagId}:${userId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash);
  }

  listFlags(): FeatureFlag[] {
    return Array.from(this.flags.values());
  }
}

interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rolloutPercentage?: number;
  targetingRules?: TargetingRule[];
}

/**
 * Example 1: Simple A/B Test
 */
async function exampleSimpleABTest() {
  console.log('=== Simple A/B Test ===\n');

  const manager = new ExperimentManager();

  // Create experiment
  const experiment: Experiment = {
    id: 'homepage-cta',
    name: 'Homepage CTA Button Test',
    variants: [
      { id: 'control', name: 'Blue Button', weight: 50 },
      { id: 'treatment', name: 'Green Button', weight: 50 },
    ],
    startDate: new Date(Date.now() - 86400000), // Started yesterday
    enabled: true,
  };

  manager.createExperiment(experiment);

  // Assign users to variants
  for (let i = 1; i <= 100; i++) {
    const user: User = {
      id: `user${i}`,
      ip: `192.168.1.${i}`,
    };

    const variant = manager.getVariant('homepage-cta', user);
    if (variant) {
      console.log(`User ${i}: ${variant.name}`);

      // Simulate conversion (30% for control, 35% for treatment)
      const conversionRate = variant.id === 'control' ? 0.3 : 0.35;
      if (Math.random() < conversionRate) {
        manager.trackConversion({
          experimentId: 'homepage-cta',
          variantId: variant.id,
          userId: user.id,
          eventName: 'button_click',
          timestamp: new Date(),
        });
      }
    }
  }

  // Get results
  const results = manager.getResults('homepage-cta');
  console.log('\nResults:');
  console.log(`Total Assignments: ${results.totalAssignments}`);
  console.log(`Total Conversions: ${results.totalConversions}`);
  console.log('\nVariant Performance:');
  for (const variant of results.variants) {
    console.log(`${variant.variantName}:`);
    console.log(`  Assignments: ${variant.assignments}`);
    console.log(`  Conversions: ${variant.conversions}`);
    console.log(`  Conversion Rate: ${(variant.conversionRate * 100).toFixed(2)}%`);
  }

  console.log();
}

/**
 * Example 2: Multivariate Test
 */
async function exampleMultivariateTest() {
  console.log('=== Multivariate Test ===\n');

  const manager = new ExperimentManager();

  const experiment: Experiment = {
    id: 'pricing-page',
    name: 'Pricing Page Layout Test',
    variants: [
      { id: 'control', name: 'Original', weight: 25 },
      { id: 'variant-a', name: 'List Layout', weight: 25 },
      { id: 'variant-b', name: 'Card Layout', weight: 25 },
      { id: 'variant-c', name: 'Comparison Table', weight: 25 },
    ],
    startDate: new Date(),
    enabled: true,
  };

  manager.createExperiment(experiment);

  // Assign 200 users
  for (let i = 1; i <= 200; i++) {
    const user: User = { id: `user${i}`, ip: `10.0.0.${i % 255}` };
    const variant = manager.getVariant('pricing-page', user);

    if (variant) {
      // Different conversion rates per variant
      const rates: Record<string, number> = {
        'control': 0.10,
        'variant-a': 0.12,
        'variant-b': 0.15,
        'variant-c': 0.14,
      };

      if (Math.random() < rates[variant.id]) {
        manager.trackConversion({
          experimentId: 'pricing-page',
          variantId: variant.id,
          userId: user.id,
          eventName: 'signup',
          value: 99, // Subscription value
          timestamp: new Date(),
        });
      }
    }
  }

  const results = manager.getResults('pricing-page');
  console.log('Variant Performance:');
  for (const variant of results.variants) {
    console.log(`\n${variant.variantName}:`);
    console.log(`  Users: ${variant.assignments}`);
    console.log(`  Conversions: ${variant.conversions}`);
    console.log(`  Rate: ${(variant.conversionRate * 100).toFixed(2)}%`);
    console.log(`  Revenue: $${variant.totalValue.toFixed(2)}`);
    console.log(`  Avg Value: $${variant.avgValue.toFixed(2)}`);
  }

  console.log();
}

/**
 * Example 3: Targeted Experiment
 */
async function exampleTargetedExperiment() {
  console.log('=== Targeted Experiment ===\n');

  const manager = new ExperimentManager();

  const experiment: Experiment = {
    id: 'premium-upsell',
    name: 'Premium Upsell for Mobile Users',
    variants: [
      { id: 'control', name: 'No Upsell', weight: 50 },
      { id: 'treatment', name: 'Show Upsell Banner', weight: 50 },
    ],
    startDate: new Date(),
    enabled: true,
    targetingRules: [
      { attribute: 'device', operator: 'equals', value: 'mobile' },
      { attribute: 'country', operator: 'in', value: ['US', 'CA', 'GB'] },
    ],
  };

  manager.createExperiment(experiment);

  // Test different user types
  const users: User[] = [
    { id: 'user1', ip: '1.2.3.4', attributes: { device: 'mobile', country: 'US' } },
    { id: 'user2', ip: '1.2.3.5', attributes: { device: 'desktop', country: 'US' } },
    { id: 'user3', ip: '1.2.3.6', attributes: { device: 'mobile', country: 'FR' } },
    { id: 'user4', ip: '1.2.3.7', attributes: { device: 'mobile', country: 'CA' } },
  ];

  for (const user of users) {
    const variant = manager.getVariant('premium-upsell', user);
    console.log(`User ${user.id} (${user.attributes?.device}, ${user.attributes?.country}):`);
    console.log(`  Variant: ${variant ? variant.name : 'Not eligible'}`);
  }

  console.log();
}

/**
 * Example 4: Feature Flags
 */
async function exampleFeatureFlags() {
  console.log('=== Feature Flags ===\n');

  const flagManager = new FeatureFlagManager();

  // Create flags
  flagManager.createFlag({
    id: 'new-checkout',
    name: 'New Checkout Flow',
    enabled: true,
    rolloutPercentage: 50, // 50% rollout
  });

  flagManager.createFlag({
    id: 'dark-mode',
    name: 'Dark Mode',
    enabled: true,
    rolloutPercentage: 100, // Full rollout
  });

  flagManager.createFlag({
    id: 'beta-feature',
    name: 'Beta Feature',
    enabled: true,
    targetingRules: [
      { attribute: 'beta_tester', operator: 'equals', value: true },
    ],
  });

  // Test users
  const users: User[] = [
    { id: 'user1', ip: '1.2.3.4', attributes: { beta_tester: false } },
    { id: 'user2', ip: '1.2.3.5', attributes: { beta_tester: true } },
  ];

  for (const user of users) {
    console.log(`User ${user.id}:`);
    console.log(`  New Checkout: ${flagManager.isEnabled('new-checkout', user)}`);
    console.log(`  Dark Mode: ${flagManager.isEnabled('dark-mode', user)}`);
    console.log(`  Beta Feature: ${flagManager.isEnabled('beta-feature', user)}`);
    console.log();
  }
}

/**
 * Main execution
 */
async function main() {
  await exampleSimpleABTest();
  await exampleMultivariateTest();
  await exampleTargetedExperiment();
  await exampleFeatureFlags();

  console.log('All A/B testing examples completed!');
}

if (require.main === module) {
  main().catch(console.error);
}

export {
  ExperimentManager,
  FeatureFlagManager,
  User,
  Experiment,
  Variant,
  TargetingRule,
  Assignment,
  ConversionEvent,
  FeatureFlag,
  ExperimentResults,
  VariantResults,
};
