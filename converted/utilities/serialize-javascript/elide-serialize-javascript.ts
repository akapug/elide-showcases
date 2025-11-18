/**
 * Serialize JavaScript - Serialize JavaScript to Superset of JSON
 *
 * Core features:
 * - Serialize functions
 * - Serialize regexps
 * - Serialize dates
 * - Serialize ES6 Maps/Sets
 * - XSS protection
 * - Circular reference detection
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

interface SerializeOptions {
  space?: number | string;
  isJSON?: boolean;
  unsafe?: boolean;
  ignoreFunction?: boolean;
}

export function serialize(obj: any, options: SerializeOptions = {}): string {
  const space = options.space || '';
  const isJSON = options.isJSON || false;
  const unsafe = options.unsafe || false;
  const ignoreFunction = options.ignoreFunction || false;

  const seen = new WeakSet();

  function serializeValue(value: any, indent: string = ''): string {
    // Handle primitives
    if (value === null) return 'null';
    if (value === undefined) return isJSON ? undefined as any : 'undefined';
    if (typeof value === 'number') {
      if (Number.isNaN(value)) return isJSON ? 'null' : 'NaN';
      if (!Number.isFinite(value)) {
        return isJSON ? 'null' : (value > 0 ? 'Infinity' : '-Infinity');
      }
      return String(value);
    }
    if (typeof value === 'boolean') return String(value);
    if (typeof value === 'string') {
      const escaped = value
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `"${unsafe ? escaped : escaped.replace(/</g, '\\u003C')}"`;
    }

    // Handle functions
    if (typeof value === 'function') {
      if (isJSON || ignoreFunction) return undefined as any;
      return value.toString();
    }

    // Handle dates
    if (value instanceof Date) {
      return isJSON
        ? `"${value.toISOString()}"`
        : `new Date("${value.toISOString()}")`;
    }

    // Handle regexps
    if (value instanceof RegExp) {
      return isJSON ? '{}' : String(value);
    }

    // Handle circular references
    if (typeof value === 'object') {
      if (seen.has(value)) {
        throw new TypeError('Converting circular structure to JSON');
      }
      seen.add(value);
    }

    // Handle arrays
    if (Array.isArray(value)) {
      const items = value
        .map(item => serializeValue(item, indent))
        .filter(item => item !== undefined);
      return `[${items.join(',')}]`;
    }

    // Handle Maps
    if (value instanceof Map) {
      if (isJSON) return '{}';
      const entries = Array.from(value.entries())
        .map(([k, v]) => `[${serializeValue(k)},${serializeValue(v)}]`)
        .join(',');
      return `new Map([${entries}])`;
    }

    // Handle Sets
    if (value instanceof Set) {
      if (isJSON) return '[]';
      const items = Array.from(value)
        .map(item => serializeValue(item))
        .join(',');
      return `new Set([${items}])`;
    }

    // Handle plain objects
    const entries = Object.entries(value)
      .map(([k, v]) => {
        const serialized = serializeValue(v, indent);
        if (serialized === undefined) return undefined;
        return `"${k}":${serialized}`;
      })
      .filter(item => item !== undefined);

    return `{${entries.join(',')}}`;
  }

  return serializeValue(obj);
}

if (import.meta.url.includes("serialize-javascript")) {
  console.log("🎯 Serialize JavaScript for Elide\n");

  const data = {
    string: 'hello',
    number: 42,
    boolean: true,
    date: new Date('2024-01-01'),
    regex: /test/gi,
    func: function() { return 'hello'; },
    map: new Map([['key', 'value']]),
    set: new Set([1, 2, 3]),
    nested: { a: 1, b: 2 },
  };

  console.log("Serialized:");
  console.log(serialize(data, { space: 2 }));

  console.log("\nJSON mode:");
  console.log(serialize(data, { isJSON: true }));

  console.log("\n✅ Use Cases: SSR, Data transfer, Function serialization");
  console.log("🚀 80M+ npm downloads/week - Polyglot-ready");
}

export default serialize;
