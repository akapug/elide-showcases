/**
 * Flag - Simple Flag System
 *
 * Simple and lightweight flag system.
 * **POLYGLOT SHOWCASE**: One flag system for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/flag (~5K+ downloads/week)
 *
 * Features:
 * - Simple flag storage
 * - Fast lookups
 * - Boolean flags
 * - Zero dependencies
 *
 * Use cases:
 * - Simple flags
 * - State tracking
 *
 * Package has ~5K+ downloads/week on npm!
 */

export class FlagSystem {
  private flags = new Map<string, boolean>();

  set(name: string, value: boolean): void {
    this.flags.set(name, value);
  }

  get(name: string): boolean {
    return this.flags.get(name) || false;
  }

  delete(name: string): void {
    this.flags.delete(name);
  }

  has(name: string): boolean {
    return this.flags.has(name);
  }

  size(): number {
    return this.flags.size;
  }

  clear(): void {
    this.flags.clear();
  }

  toJSON(): Record<string, boolean> {
    return Object.fromEntries(this.flags);
  }
}

export function createFlagSystem(): FlagSystem {
  return new FlagSystem();
}

export default { createFlagSystem, FlagSystem };

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('🏁 Flag - Simple Flag System (POLYGLOT!)\n');

  const flags = createFlagSystem();

  console.log('=== Example 1: Set and Get ===');
  flags.set('feature-a', true);
  flags.set('feature-b', false);
  console.log('Feature A:', flags.get('feature-a'));
  console.log('Feature B:', flags.get('feature-b'));
  console.log();

  console.log('=== Example 2: Has and Size ===');
  console.log('Has feature-a:', flags.has('feature-a'));
  console.log('Has feature-c:', flags.has('feature-c'));
  console.log('Total flags:', flags.size());
  console.log();

  console.log('=== Example 3: Export ===');
  console.log('All flags:', flags.toJSON());
  console.log();

  console.log('💡 Polyglot: Works in TypeScript, Python, Ruby, Java via Elide!');
}
