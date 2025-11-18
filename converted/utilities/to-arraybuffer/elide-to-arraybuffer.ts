/**
 * to-arraybuffer - Convert to ArrayBuffer
 *
 * Convert Buffer to ArrayBuffer.
 * **POLYGLOT SHOWCASE**: ArrayBuffer conversion across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/to-arraybuffer (~500K+ downloads/week)
 *
 * Package has ~500K+ downloads/week on npm!
 */

export function toArrayBuffer(buf: Uint8Array): ArrayBuffer {
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

export default toArrayBuffer;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔄 to-arraybuffer (POLYGLOT!)\\n");
  const buf = new Uint8Array([1, 2, 3]);
  const ab = toArrayBuffer(buf);
  console.log("ArrayBuffer byteLength:", ab.byteLength);
  console.log("\\n🚀 ~500K+ downloads/week on npm!");
}
