/**
 * arraybuffer-to-string - ArrayBuffer to String
 *
 * Convert ArrayBuffer to String with encoding support.
 * **POLYGLOT SHOWCASE**: ArrayBuffer conversion across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/arraybuffer-to-string (~100K+ downloads/week)
 *
 * Package has ~100K+ downloads/week on npm!
 */

export function arrayBufferToString(ab: ArrayBuffer, encoding?: string): string {
  const decoder = new TextDecoder(encoding || 'utf-8');
  return decoder.decode(ab);
}

export default arrayBufferToString;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔤 arraybuffer-to-string (POLYGLOT!)\\n");
  const ab = new Uint8Array([72, 101, 108, 108, 111]).buffer;
  const str = arrayBufferToString(ab);
  console.log("Result:", str);
  console.log("\\n🚀 ~100K+ downloads/week on npm!");
}
