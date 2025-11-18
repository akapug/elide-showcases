/**
 * Object.assign Polyfill
 *
 * ES6 Object.assign polyfill.
 * **POLYGLOT SHOWCASE**: Object.assign for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/object-assign (~10M+ downloads/week)
 */

export function objectAssign<T, U>(target: T, ...sources: U[]): T & U {
  if (target == null) {
    throw new TypeError('Cannot convert undefined or null to object');
  }

  const to = Object(target);

  for (const source of sources) {
    if (source != null) {
      for (const key in source) {
        if (Object.prototype.hasOwnProperty.call(source, key)) {
          to[key] = source[key];
        }
      }
    }
  }

  return to;
}

if (!Object.assign) {
  Object.assign = objectAssign;
}

export default objectAssign;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔗 Object.assign Polyfill (POLYGLOT!)\n");
  
  const obj1 = { a: 1, b: 2 };
  const obj2 = { b: 3, c: 4 };
  const result = objectAssign({}, obj1, obj2);
  console.log('Result:', result);
  console.log("\n  ✓ ~10M+ downloads/week!");
}
