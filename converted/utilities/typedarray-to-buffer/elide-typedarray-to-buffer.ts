/**
 * typedarray-to-buffer - Convert TypedArray to Buffer
 *
 * Convert typed arrays to Buffer instances.
 * **POLYGLOT SHOWCASE**: TypedArray conversion across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/typedarray-to-buffer (~2M+ downloads/week)
 *
 * Package has ~2M+ downloads/week on npm!
 */

export function typedArrayToBuffer(arr: ArrayBufferView): Uint8Array {
  return new Uint8Array(arr.buffer, arr.byteOffset, arr.byteLength);
}

export default typedArrayToBuffer;

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔄 typedarray-to-buffer (POLYGLOT!)\\n");
  const arr = new Uint16Array([256, 512, 1024]);
  const buf = typedArrayToBuffer(arr);
  console.log("Converted:", buf);
  console.log("\\n🚀 ~2M+ downloads/week on npm!");
}
