/**
 * Devalue - Gets Values Ready for Work
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 15M+ downloads/week
 */

export function stringify(value: any): string {
  const seen = new Map();
  let index = 0;

  function walk(val: any): string {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'number') return String(val);
    if (typeof val === 'boolean') return String(val);
    if (typeof val === 'string') return JSON.stringify(val);

    if (typeof val === 'object') {
      if (seen.has(val)) return 'null';
      seen.set(val, index++);

      if (Array.isArray(val)) {
        return '[' + val.map(walk).join(',') + ']';
      }

      if (val instanceof Date) {
        return 'new Date(' + val.getTime() + ')';
      }

      const props = Object.keys(val)
        .map(k => JSON.stringify(k) + ':' + walk(val[k]))
        .join(',');
      return '{' + props + '}';
    }

    return 'undefined';
  }

  return walk(value);
}

if (import.meta.url.includes("devalue")) {
  console.log("Devalue for Elide\n");
  const data = { str: 'hello', num: 42, date: new Date() };
  console.log("Serialized:", stringify(data));
  console.log("\n15M+ npm downloads/week - Polyglot-ready");
}

export default { stringify };
