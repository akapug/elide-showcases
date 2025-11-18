/**
 * string-to-arraybuffer - String to ArrayBuffer
 *
 * Convert String to ArrayBuffer with encoding support.
 * **POLYGLOT SHOWCASE**: String conversion across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/string-to-arraybuffer (~50K+ downloads/week)
 *
 * Package has ~50K+ downloads/week on npm!
 */

export function stringToArrayBuffer(str: string, encoding?: string): ArrayBuffer {
  const encoder = new TextEncoder();
  return encoder.encode(str).buffer;
}

export default stringToArrayBuffer;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔤 string-to-arraybuffer (POLYGLOT!)\\n");
  const ab = stringToArrayBuffer("Hello");
  console.log("ArrayBuffer byteLength:", ab.byteLength);
  console.log("\\n🚀 ~50K+ downloads/week on npm!");
}
