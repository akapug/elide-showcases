/**
 * hex-to-array-buffer - Hex to ArrayBuffer
 *
 * Convert hex string to ArrayBuffer.
 * **POLYGLOT SHOWCASE**: Hex conversion across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/hex-to-array-buffer (~20K+ downloads/week)
 *
 * Package has ~20K+ downloads/week on npm!
 */

export function hexToArrayBuffer(hex: string): ArrayBuffer {
  hex = hex.replace(/[^0-9a-f]/gi, '');
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
  }
  return bytes.buffer;
}

export default hexToArrayBuffer;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔢 hex-to-array-buffer (POLYGLOT!)\\n");
  const hex = "48656c6c6f";
  const ab = hexToArrayBuffer(hex);
  console.log("Hex:", hex);
  console.log("ArrayBuffer:", new Uint8Array(ab));
  console.log("String:", new TextDecoder().decode(ab));
  console.log("\\n🚀 ~20K+ downloads/week on npm!");
}
