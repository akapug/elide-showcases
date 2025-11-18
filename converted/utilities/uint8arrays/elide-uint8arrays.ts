/**
 * uint8arrays - Uint8Array Utilities
 *
 * Utility functions for Uint8Arrays.
 * **POLYGLOT SHOWCASE**: Uint8Array utilities across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/uint8arrays (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function concat(arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((acc, arr) => acc + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

export function equals(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

export function toString(arr: Uint8Array, encoding?: string): string {
  return new TextDecoder(encoding).decode(arr);
}

export function fromString(str: string, encoding?: string): Uint8Array {
  return new TextEncoder().encode(str);
}

export default { concat, equals, toString, fromString };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔧 uint8arrays - Utilities (POLYGLOT!)\\n");
  const a = new Uint8Array([1, 2, 3]);
  const b = new Uint8Array([4, 5, 6]);
  console.log("Concat:", concat([a, b]));
  console.log("Equals:", equals(a, a));
  console.log("\\n🚀 ~500K+ downloads/week on npm!");
}
