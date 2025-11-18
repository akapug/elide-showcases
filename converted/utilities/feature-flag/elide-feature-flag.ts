/**
 * Feature Flag - Basic Feature Flag Library
 *
 * Basic feature flag library for simple toggles.
 * **POLYGLOT SHOWCASE**: One flag library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/feature-flag (~5K+ downloads/week)
 *
 * Features:
 * - Simple boolean flags
 * - In-memory storage
 * - Fast evaluation
 * - Zero dependencies
 *
 * Use cases:
 * - Basic feature flags
 * - Simple toggles
 *
 * Package has ~5K+ downloads/week on npm!
 */

export class FeatureFlag {
  private flags = new Map<string, boolean>();

  constructor(initialFlags: Record<string, boolean> = {}) {
    for (const [key, value] of Object.entries(initialFlags)) {
      this.flags.set(key, value);
    }
  }

  get(name: string, defaultValue = false): boolean {
    return this.flags.get(name) ?? defaultValue;
  }

  set(name: string, value: boolean): void {
    this.flags.set(name, value);
  }

  remove(name: string): void {
    this.flags.delete(name);
  }

  has(name: string): boolean {
    return this.flags.has(name);
  }

  all(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }

  clear(): void {
    this.flags.clear();
  }
}

export function createFlags(initial?: Record<string, boolean>): FeatureFlag {
  return new FeatureFlag(initial);
}

export default { createFlags, FeatureFlag };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🚩 Feature Flag - Basic Flags (POLYGLOT!)\n');

  const flags = createFlags({
    'dark-mode': true,
    'new-ui': false,
  });

  console.log('=== Example 1: Get Flags ===');
  console.log('Dark mode:', flags.get('dark-mode'));
  console.log('New UI:', flags.get('new-ui'));
  console.log('Missing (default false):', flags.get('missing'));
  console.log('Missing (default true):', flags.get('missing', true));
  console.log();

  console.log('=== Example 2: Set Flags ===');
  flags.set('new-ui', true);
  console.log('After set:', flags.get('new-ui'));
  console.log();

  console.log('=== Example 3: All Flags ===');
  console.log('All flags:', flags.all());
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
