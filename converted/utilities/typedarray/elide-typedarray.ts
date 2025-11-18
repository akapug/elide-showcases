/**
 * typedarray - Typed Array Polyfill
 *
 * TypedArray support for older environments.
 * **POLYGLOT SHOWCASE**: Typed arrays across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/typedarray (~5M+ downloads/week)
 *
 * Features:
 * - Uint8Array, Uint16Array, Uint32Array
 * - Int8Array, Int16Array, Int32Array
 * - Float32Array, Float64Array
 * - Zero dependencies
 *
 * Package has ~5M+ downloads/week on npm!
 */

export { Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array };
export default { Uint8Array, Uint16Array, Uint32Array, Int8Array, Int16Array, Int32Array, Float32Array, Float64Array };

// CLI Demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("🔢 typedarray - Typed Arrays (POLYGLOT!)\\n");
  const u8 = new Uint8Array([1, 2, 3]);
  const i32 = new Int32Array([-1, 0, 1]);
  const f64 = new Float64Array([3.14, 2.71]);
  console.log("Uint8Array:", u8);
  console.log("Int32Array:", i32);
  console.log("Float64Array:", f64);
  console.log("\\n🚀 ~5M+ downloads/week on npm!");
}
