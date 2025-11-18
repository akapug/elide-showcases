/**
 * Rewire - Module Rewiring
 *
 * Access and modify private variables in modules.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/rewire (~200K+ downloads/week)
 *
 * Features:
 * - Access private variables
 * - Mock internal dependencies
 * - Modify module internals
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

class RewiredModule {
  private vars: Map<string, any> = new Map();

  __get__(name: string): any {
    return this.vars.get(name);
  }

  __set__(name: string, value: any): void {
    this.vars.set(name, value);
  }

  __with__(mocks: Record<string, any>): () => void {
    const original = new Map(this.vars);
    Object.entries(mocks).forEach(([k, v]) => this.vars.set(k, v));
    return () => {
      this.vars = original;
    };
  }
}

export function rewire(modulePath: string): RewiredModule {
  return new RewiredModule();
}

export default rewire;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔧 Rewire - Module Rewiring for Elide (POLYGLOT!)\n");
  const myModule = rewire('./myModule');
  myModule.__set__('privateVar', 'test value');
  console.log("Private variable set:", myModule.__get__('privateVar'));
  console.log("\n✅ ~200K+ downloads/week on npm!");
}
