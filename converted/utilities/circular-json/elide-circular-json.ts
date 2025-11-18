/**
 * Circular JSON - JSON with Circular References
 *
 * Core features:
 * - Handle circular references
 * - Preserve object structure
 * - Parse and stringify
 * - Special placeholder
 * - Backward compatible
 * - Fast processing
 *
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 8M+ downloads/week
 */

const CIRCULAR_REF = '~';

export function stringify(
  obj: any,
  replacer?: (key: string, value: any) => any,
  space?: string | number
): string {
  const objects = new WeakMap<any, string>();
  const paths = new Map<any, string>();
  let currentPath = '$';

  const buildPath = (obj: any, parentPath: string): void => {
    if (obj === null || typeof obj !== 'object') return;

    if (objects.has(obj)) return;

    objects.set(obj, parentPath);
    paths.set(obj, parentPath);

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        buildPath(item, `${parentPath}[${index}]`);
      });
    } else {
      Object.keys(obj).forEach(key => {
        buildPath(obj[key], `${parentPath}.${key}`);
      });
    }
  };

  buildPath(obj, currentPath);

  const transform = (key: string, val: any): any => {
    if (val === null || typeof val !== 'object') {
      return replacer ? replacer(key, val) : val;
    }

    const path = paths.get(val);
    if (path && path !== currentPath) {
      return { [CIRCULAR_REF]: path };
    }

    const previousPath = currentPath;
    currentPath = path || currentPath;

    let result: any;
    if (Array.isArray(val)) {
      result = val.map((item, index) => {
        currentPath = `${path}[${index}]`;
        return transform(String(index), item);
      });
    } else {
      result = {};
      Object.keys(val).forEach(k => {
        currentPath = `${path}.${k}`;
        const transformed = transform(k, val[k]);
        if (transformed !== undefined) {
          result[k] = transformed;
        }
      });
    }

    currentPath = previousPath;
    return replacer ? replacer(key, result) : result;
  };

  const transformed = transform('', obj);
  return JSON.stringify(transformed, null, space);
}

export function parse(
  text: string,
  reviver?: (key: string, value: any) => any
): any {
  const root = JSON.parse(text, reviver);

  const restore = (obj: any, refs: Map<string, any>): any => {
    if (obj === null || typeof obj !== 'object') return obj;

    if (obj.hasOwnProperty(CIRCULAR_REF)) {
      const path = obj[CIRCULAR_REF];
      return refs.get(path) || obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => restore(item, refs));
    }

    const result: any = {};
    Object.keys(obj).forEach(key => {
      result[key] = restore(obj[key], refs);
    });
    return result;
  };

  // Build reference map
  const buildRefs = (obj: any, path: string, refs: Map<string, any>): void => {
    if (obj === null || typeof obj !== 'object') return;
    if (obj.hasOwnProperty(CIRCULAR_REF)) return;

    refs.set(path, obj);

    if (Array.isArray(obj)) {
      obj.forEach((item, index) => {
        buildRefs(item, `${path}[${index}]`, refs);
      });
    } else {
      Object.keys(obj).forEach(key => {
        buildRefs(obj[key], `${path}.${key}`, refs);
      });
    }
  };

  const refs = new Map<string, any>();
  buildRefs(root, '$', refs);

  return restore(root, refs);
}

if (import.meta.url.includes("circular-json")) {
  console.log("🎯 Circular JSON for Elide - JSON with Circular References\n");

  const obj: any = {
    name: 'root',
    child: {
      name: 'child',
      parent: null as any
    },
    siblings: [] as any[]
  };

  obj.child.parent = obj;
  obj.siblings.push(obj.child);
  obj.self = obj;

  console.log("Object structure:");
  console.log("- root has child");
  console.log("- child.parent points to root (circular)");
  console.log("- root.self points to root (circular)");

  const serialized = stringify(obj, null, 2);
  console.log("\nSerialized:\n", serialized);

  const deserialized = parse(serialized);
  console.log("\nDeserialized circular refs:");
  console.log("- child.parent === root:", deserialized.child.parent === deserialized);
  console.log("- self === root:", deserialized.self === deserialized);

  console.log("\n✅ Use Cases: Complex graphs, Object cloning, State serialization");
  console.log("🚀 8M+ npm downloads/week - Polyglot-ready");
}

export default { stringify, parse };
