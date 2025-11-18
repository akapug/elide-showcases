/**
 * Metadata Reflection - Reflection API
 *
 * Metadata reflection utilities for TypeScript decorators.
 * **POLYGLOT SHOWCASE**: Reflection utilities for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/metadata-reflection (~100K+ downloads/week)
 *
 * Features:
 * - Metadata storage
 * - Reflection queries
 * - Decorator support
 * - Type information
 * - Zero dependencies
 *
 * Package has ~100K+ downloads/week on npm!
 */

const metadata = new WeakMap<any, Map<string | symbol, any>>();

export class MetadataReflection {
  static define(key: string | symbol, value: any, target: any, property?: string | symbol): void {
    const targetKey = property || '__class__';
    if (!metadata.has(target)) {
      metadata.set(target, new Map());
    }
    const targetMeta = metadata.get(target)!;
    if (!targetMeta.has(targetKey)) {
      targetMeta.set(targetKey, new Map());
    }
    (targetMeta.get(targetKey) as Map<any, any>).set(key, value);
  }

  static get(key: string | symbol, target: any, property?: string | symbol): any {
    const targetKey = property || '__class__';
    return metadata.get(target)?.get(targetKey)?.get(key);
  }

  static has(key: string | symbol, target: any, property?: string | symbol): boolean {
    return this.get(key, target, property) !== undefined;
  }

  static keys(target: any, property?: string | symbol): any[] {
    const targetKey = property || '__class__';
    const targetMeta = metadata.get(target)?.get(targetKey);
    return targetMeta ? Array.from(targetMeta.keys()) : [];
  }
}

export default MetadataReflection;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔮 Metadata Reflection - Reflection API (POLYGLOT!)\n");

  class User {
    name!: string;
  }

  MetadataReflection.define('role', 'admin', User);
  MetadataReflection.define('permissions', ['read', 'write'], User.prototype, 'name');

  console.log("User role:", MetadataReflection.get('role', User));
  console.log("Name permissions:", MetadataReflection.get('permissions', User.prototype, 'name'));
  console.log("Has role:", MetadataReflection.has('role', User));

  console.log("\n🚀 ~100K+ downloads/week on npm!");
}
