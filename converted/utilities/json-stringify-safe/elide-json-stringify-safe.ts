/**
 * JSON Stringify Safe - Safe JSON Stringification
 *
 * Core features:
 * - Handle circular references
 * - Safe serialization
 * - Replacer functions
 * - Fallback handling
 * - Error recovery
 * - Deterministic output
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

export function stringify(
  obj: any,
  replacer?: ((key: string, value: any) => any) | null,
  spaces?: string | number,
  cycleReplacer?: (key: string, value: any) => any
): string {
  const seen = new Set<any>();

  const defaultCycleReplacer = (key: string, value: any) => {
    return '[Circular]';
  };

  const actualCycleReplacer = cycleReplacer || defaultCycleReplacer;

  const serializer = (key: string, value: any): any => {
    if (value != null && typeof value === 'object') {
      if (seen.has(value)) {
        return actualCycleReplacer(key, value);
      }
      seen.add(value);
    }

    if (replacer) {
      return replacer(key, value);
    }

    return value;
  };

  try {
    return JSON.stringify(obj, serializer, spaces);
  } catch (error) {
    return JSON.stringify('[Unable to stringify]');
  } finally {
    seen.clear();
  }
}

if (import.meta.url.includes("json-stringify-safe")) {
  console.log("🎯 JSON Stringify Safe for Elide - Safe JSON Stringification\n");

  const circular: any = { name: 'test' };
  circular.self = circular;
  circular.nested = { ref: circular };

  const safe = stringify(circular, null, 2);
  console.log("Safe stringify result:\n", safe);

  const withReplacer = stringify(
    circular,
    null,
    2,
    (key, val) => `[Circular: ${key}]`
  );
  console.log("\nWith custom cycle replacer:\n", withReplacer);

  console.log("\n✅ Use Cases: Logging, Debugging, Error handling");
  console.log("🚀 80M+ npm downloads/week - Polyglot-ready");
}

export default stringify;
