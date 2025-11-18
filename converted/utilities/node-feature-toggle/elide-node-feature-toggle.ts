/**
 * Node Feature Toggle - Server-Side Feature Flags
 *
 * Server-side feature toggle library for Node.js applications.
 * **POLYGLOT SHOWCASE**: One server toggle system for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/node-feature-toggle (~5K+ downloads/week)
 *
 * Features:
 * - Server-side toggles
 * - Configuration-based toggles
 * - Runtime toggle updates
 * - Middleware support
 * - Zero dependencies
 *
 * Use cases:
 * - Server feature flags
 * - API endpoint toggles
 * - Middleware control
 *
 * Package has ~5K+ downloads/week on npm!
 */

export interface ToggleOptions {
  [key: string]: boolean;
}

export class NodeFeatureToggle {
  private toggles: Map<string, boolean> = new Map();

  constructor(options: ToggleOptions = {}) {
    for (const [key, value] of Object.entries(options)) {
      this.toggles.set(key, value);
    }
  }

  isEnabled(name: string): boolean {
    return this.toggles.get(name) || false;
  }

  enable(name: string): void {
    this.toggles.set(name, true);
  }

  disable(name: string): void {
    this.toggles.set(name, false);
  }

  toggle(name: string): void {
    this.toggles.set(name, !this.isEnabled(name));
  }

  getToggles(): Record<string, boolean> {
    return Object.fromEntries(this.toggles);
  }

  middleware() {
    return (req: any, res: any, next: any) => {
      req.features = this;
      next();
    };
  }
}

export function create(options?: ToggleOptions): NodeFeatureToggle {
  return new NodeFeatureToggle(options);
}

export default { create };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🖥️  Node Feature Toggle - Server Flags (POLYGLOT!)\n');

  const features = create({
    'api-v2': true,
    'graphql': false,
    'rate-limiting': true,
  });

  console.log('=== Example 1: Check Features ===');
  console.log('API v2:', features.isEnabled('api-v2'));
  console.log('GraphQL:', features.isEnabled('graphql'));
  console.log();

  console.log('=== Example 2: Toggle Features ===');
  features.enable('graphql');
  console.log('After enable:', features.isEnabled('graphql'));
  features.toggle('graphql');
  console.log('After toggle:', features.isEnabled('graphql'));
  console.log();

  console.log('✅ Use Cases:');
  console.log('- Server feature flags');
  console.log('- API endpoint toggles');
  console.log('- Middleware control');
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
