/**
 * Just Flatten - Array Flattening
 *
 * Flatten nested arrays with configurable depth.
 * **POLYGLOT SHOWCASE**: One flatten utility for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/just-flatten (~20K+ downloads/week)
 *
 * Features:
 * - Configurable depth
 * - Deep flatten support
 * - Type preservation
 * - Pure functional
 * - Zero dependencies
 *
 * Package has ~20K+ downloads/week on npm!
 */

export function flatten<T>(array: any[], depth: number = 1): T[] {
  if (depth === 0) return array;

  return array.reduce((acc, item) => {
    if (Array.isArray(item)) {
      acc.push(...flatten(item, depth - 1));
    } else {
      acc.push(item);
    }
    return acc;
  }, []);
}

export function flattenDeep<T>(array: any[]): T[] {
  return flatten(array, Infinity);
}

export default flatten;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎚️  Just Flatten - Array Flattening for Elide (POLYGLOT!)\n");

  const nested = [1, [2, [3, [4, 5]]]];
  console.log("Original:", nested);
  console.log("Flatten depth 1:", flatten(nested, 1));
  console.log("Flatten depth 2:", flatten(nested, 2));
  console.log("Flatten deep:", flattenDeep(nested));
  console.log("\n🌐 Works in JavaScript, Python, Ruby, Java via Elide!");
  console.log("🚀 ~20K+ downloads/week on npm");
}
