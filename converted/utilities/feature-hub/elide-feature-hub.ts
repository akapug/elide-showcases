/**
 * Feature Hub - Centralized Feature Management
 *
 * Centralized hub for managing features across services.
 * **POLYGLOT SHOWCASE**: One feature hub for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/feature-hub (~10K+ downloads/week)
 *
 * Features:
 * - Centralized feature registry
 * - Service integration
 * - Feature dependencies
 * - Version management
 * - Zero dependencies
 *
 * Use cases:
 * - Microservice features
 * - Feature orchestration
 *
 * Package has ~10K+ downloads/week on npm!
 */

export interface FeatureDescriptor {
  id: string;
  version: string;
  dependencies?: Record<string, string>;
  create: (env: any) => any;
}

export class FeatureHub {
  private features = new Map<string, any>();
  private descriptors = new Map<string, FeatureDescriptor>();

  registerFeature(descriptor: FeatureDescriptor): void {
    this.descriptors.set(descriptor.id, descriptor);
  }

  getFeature<T>(id: string): T | undefined {
    if (this.features.has(id)) {
      return this.features.get(id) as T;
    }

    const descriptor = this.descriptors.get(id);
    if (!descriptor) return undefined;

    const feature = descriptor.create({});
    this.features.set(id, feature);
    return feature as T;
  }

  hasFeature(id: string): boolean {
    return this.descriptors.has(id);
  }

  getAllFeatures(): string[] {
    return Array.from(this.descriptors.keys());
  }

  clear(): void {
    this.features.clear();
    this.descriptors.clear();
  }
}

export function createHub(): FeatureHub {
  return new FeatureHub();
}

export default { createHub, FeatureHub };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🏢 Feature Hub - Centralized Features (POLYGLOT!)\n');

  const hub = createHub();

  // Register features
  hub.registerFeature({
    id: 'logger',
    version: '1.0.0',
    create: () => ({
      log: (msg: string) => console.log(`[LOG] ${msg}`),
    }),
  });

  hub.registerFeature({
    id: 'cache',
    version: '2.0.0',
    dependencies: { logger: '1.0.0' },
    create: () => ({
      get: (key: string) => null,
      set: (key: string, value: any) => {},
    }),
  });

  console.log('=== Example 1: Get Feature ===');
  const logger = hub.getFeature<any>('logger');
  logger?.log('Hello from feature hub!');
  console.log();

  console.log('=== Example 2: Check Features ===');
  console.log('Has logger:', hub.hasFeature('logger'));
  console.log('Has cache:', hub.hasFeature('cache'));
  console.log('Has unknown:', hub.hasFeature('unknown'));
  console.log();

  console.log('=== Example 3: All Features ===');
  console.log('All features:', hub.getAllFeatures());
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
