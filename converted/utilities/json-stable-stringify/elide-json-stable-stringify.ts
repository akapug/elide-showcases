/**
 * JSON Stable Stringify - Deterministic JSON Serialization
 *
 * Core features:
 * - Deterministic output
 * - Sorted object keys
 * - Consistent ordering
 * - Custom comparators
 * - Replacer support
 * - Space formatting
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 80M+ downloads/week
 */

type Comparator = (a: { key: string; value: any }, b: { key: string; value: any }) => number;

export function stringify(
  obj: any,
  opts?: {
    cmp?: Comparator;
    space?: string | number;
    replacer?: (key: string, value: any) => any;
  }
): string {
  const space = opts?.space ?? '';
  const cmp = opts?.cmp ?? ((a, b) => a.key.localeCompare(b.key));
  const replacer = opts?.replacer;

  const seen = new Set<any>();

  const stringifyNode = (node: any, depth: number): string => {
    if (node === null) return 'null';
    if (node === undefined) return undefined as any;
    if (typeof node === 'number') return String(node);
    if (typeof node === 'string') return JSON.stringify(node);
    if (typeof node === 'boolean') return String(node);

    if (typeof node !== 'object') return JSON.stringify(node);

    if (seen.has(node)) {
      throw new TypeError('Converting circular structure to JSON');
    }
    seen.add(node);

    const indent = typeof space === 'number' ? ' '.repeat(space * depth) : '';
    const nextIndent = typeof space === 'number' ? ' '.repeat(space * (depth + 1)) : '';

    if (Array.isArray(node)) {
      const items = node.map((item) => {
        const str = stringifyNode(item, depth + 1);
        return str !== undefined ? str : 'null';
      });

      seen.delete(node);

      if (items.length === 0) return '[]';
      if (space) {
        return `[\n${nextIndent}${items.join(`,\n${nextIndent}`)}\n${indent}]`;
      }
      return `[${items.join(',')}]`;
    }

    const keys = Object.keys(node);
    const pairs = keys
      .map((key) => {
        const value = replacer ? replacer(key, node[key]) : node[key];
        return { key, value };
      })
      .filter(({ value }) => value !== undefined)
      .sort(cmp)
      .map(({ key, value }) => {
        const keyStr = JSON.stringify(key);
        const valStr = stringifyNode(value, depth + 1);
        return `${keyStr}:${space ? ' ' : ''}${valStr}`;
      });

    seen.delete(node);

    if (pairs.length === 0) return '{}';
    if (space) {
      return `{\n${nextIndent}${pairs.join(`,\n${nextIndent}`)}\n${indent}}`;
    }
    return `{${pairs.join(',')}}`;
  };

  return stringifyNode(obj, 0);
}

if (import.meta.url.includes("json-stable-stringify")) {
  console.log("🎯 JSON Stable Stringify for Elide - Deterministic Serialization\n");

  const obj1 = { z: 3, a: 1, m: 2 };
  const obj2 = { a: 1, m: 2, z: 3 };

  const stable1 = stringify(obj1);
  const stable2 = stringify(obj2);

  console.log("Object 1:", stable1);
  console.log("Object 2:", stable2);
  console.log("Equal:", stable1 === stable2);

  const formatted = stringify(obj1, { space: 2 });
  console.log("\nFormatted:\n", formatted);

  console.log("\n✅ Use Cases: Hashing, Caching, Comparison, Git diffs");
  console.log("🚀 80M+ npm downloads/week - Polyglot-ready");
}

export default stringify;
