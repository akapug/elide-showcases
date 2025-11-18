// is-buffer - Buffer validation for Elide/TypeScript
// Original: https://github.com/feross/is-buffer
// Zero dependencies - pure TypeScript!

/**
 * Check if a value is a Buffer or ArrayBuffer.
 *
 * @param value - Value to test
 * @returns True if value is a Buffer/ArrayBuffer
 *
 * @example
 * ```typescript
 * isBuffer(Buffer.from('x'))       // true (Node.js)
 * isBuffer(new ArrayBuffer(8))     // true
 * isBuffer(new Uint8Array(8))      // true
 * isBuffer({})                     // false
 * isBuffer([])                     // false
 * ```
 */
export default function isBuffer(value: any): boolean {
  return (
    value != null &&
    (value.constructor?.isBuffer?.(value) === true ||
      value instanceof ArrayBuffer ||
      ArrayBuffer.isView(value))
  );
}

// CLI usage
if (import.meta.url.includes("elide-is-buffer.ts")) {
  console.log("📦 is-buffer - Buffer Detection on Elide\n");
  console.log(`isBuffer(new ArrayBuffer(8))     = ${isBuffer(new ArrayBuffer(8))}`);
  console.log(`isBuffer(new Uint8Array(8))      = ${isBuffer(new Uint8Array(8))}`);
  console.log(`isBuffer(new Int32Array(8))      = ${isBuffer(new Int32Array(8))}`);
  console.log(`isBuffer({})                     = ${isBuffer({})}`);
  console.log(`isBuffer([])                     = ${isBuffer([])}`);
  console.log("\n✅ 120M+ downloads/week on npm");
}
