/**
 * JSON Cycle - Cycle Detection and Resolution
 *
 * Core features:
 * - Douglas Crockford's cycle.js
 * - Decycle/retrocycle
 * - Path-based references
 * - Handle circular structures
 * - Simple API
 * - Standards-based
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 1M+ downloads/week
 */

interface PathRef {
  $ref: string;
}

export function decycle(object: any, replacer?: (value: any) => any): any {
  const objects = new WeakMap<any, string>();

  return (function derez(value: any, path: string): any {
    let oldPath: string | undefined;
    let replacement: any;

    if (replacer) {
      value = replacer(value);
    }

    if (
      typeof value === 'object' &&
      value !== null &&
      !(value instanceof Boolean) &&
      !(value instanceof Date) &&
      !(value instanceof Number) &&
      !(value instanceof RegExp) &&
      !(value instanceof String)
    ) {
      oldPath = objects.get(value);
      if (oldPath !== undefined) {
        return { $ref: oldPath } as PathRef;
      }

      objects.set(value, path);

      if (Array.isArray(value)) {
        replacement = [];
        value.forEach((element, i) => {
          replacement[i] = derez(element, `${path}[${i}]`);
        });
      } else {
        replacement = {};
        Object.keys(value).forEach(name => {
          replacement[name] = derez(value[name], `${path}[${JSON.stringify(name)}]`);
        });
      }

      return replacement;
    }

    return value;
  })(object, '$');
}

export function retrocycle($: any): any {
  const pathMap = new Map<string, any>();

  (function rez(value: any, path: string): void {
    if (value && typeof value === 'object') {
      if (Array.isArray(value)) {
        value.forEach((element, i) => {
          const newPath = `${path}[${i}]`;
          if (typeof element === 'object' && element !== null) {
            const ref = (element as PathRef).$ref;
            if (typeof ref === 'string') {
              value[i] = pathMap.get(ref);
            } else {
              pathMap.set(newPath, element);
              rez(element, newPath);
            }
          }
        });
      } else {
        Object.keys(value).forEach(name => {
          const item = value[name];
          const newPath = `${path}[${JSON.stringify(name)}]`;

          if (typeof item === 'object' && item !== null) {
            const ref = (item as PathRef).$ref;
            if (typeof ref === 'string') {
              value[name] = pathMap.get(ref);
            } else {
              pathMap.set(newPath, item);
              rez(item, newPath);
            }
          }
        });
      }
    }
  })($, '$');

  pathMap.set('$', $);

  return $;
}

export function stringify(
  object: any,
  replacer?: (value: any) => any,
  space?: string | number
): string {
  return JSON.stringify(decycle(object, replacer), null, space);
}

export function parse(text: string, reviver?: (key: string, value: any) => any): any {
  return retrocycle(JSON.parse(text, reviver));
}

if (import.meta.url.includes("json-cycle")) {
  console.log("🎯 JSON Cycle for Elide - Cycle Detection and Resolution\n");

  const person: any = {
    name: 'Alice',
    friends: [] as any[]
  };

  const friend: any = {
    name: 'Bob',
    friends: [person]
  };

  person.friends.push(friend);
  person.self = person;

  console.log("Circular structure:");
  console.log("- Alice.friends contains Bob");
  console.log("- Bob.friends contains Alice");
  console.log("- Alice.self points to Alice");

  const decycled = decycle(person);
  console.log("\nDecycled (with $ref):", JSON.stringify(decycled, null, 2));

  const serialized = stringify(person, null, 2);
  console.log("\nStringified:\n", serialized);

  const restored = parse(serialized);
  console.log("\nRestored circular refs:");
  console.log("- person.self === person:", restored.self === restored);
  console.log("- person.friends[0].friends[0] === person:", restored.friends[0].friends[0] === restored);

  console.log("\n✅ Use Cases: Object graphs, State persistence, Data interchange");
  console.log("🚀 1M+ npm downloads/week - Polyglot-ready");
}

export default { decycle, retrocycle, stringify, parse };
