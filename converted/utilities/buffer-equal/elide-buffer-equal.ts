/**
 * buffer-equal - Buffer Equality Check
 *
 * Determine if two buffers are equal. Perfect for binary comparisons.
 * **POLYGLOT SHOWCASE**: Compare buffers consistently across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/buffer-equal (~1M+ downloads/week)
 *
 * Features:
 * - Fast buffer comparison
 * - Byte-by-byte equality check
 * - Support for Uint8Array and Buffer
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need buffer comparison
 * - ONE implementation works everywhere on Elide
 * - Consistent comparison logic across languages
 *
 * Use cases:
 * - Verify file integrity
 * - Compare hash digests
 * - Test binary data
 * - Protocol verification
 *
 * Package has ~1M+ downloads/week on npm!
 */

export function bufferEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }

  return true;
}

export default bufferEqual;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚖️  buffer-equal - Compare Buffers (POLYGLOT!)\n");

  console.log("=== Example 1: Equal Buffers ===");
  const buf1 = new Uint8Array([1, 2, 3, 4, 5]);
  const buf2 = new Uint8Array([1, 2, 3, 4, 5]);
  console.log("Buffer 1:", buf1);
  console.log("Buffer 2:", buf2);
  console.log("Equal?", bufferEqual(buf1, buf2));
  console.log();

  console.log("=== Example 2: Different Buffers ===");
  const buf3 = new Uint8Array([1, 2, 3, 4, 5]);
  const buf4 = new Uint8Array([1, 2, 3, 4, 6]);
  console.log("Buffer 3:", buf3);
  console.log("Buffer 4:", buf4);
  console.log("Equal?", bufferEqual(buf3, buf4));
  console.log();

  console.log("=== Example 3: Different Lengths ===");
  const buf5 = new Uint8Array([1, 2, 3]);
  const buf6 = new Uint8Array([1, 2, 3, 4]);
  console.log("Buffer 5:", buf5);
  console.log("Buffer 6:", buf6);
  console.log("Equal?", bufferEqual(buf5, buf6));
  console.log();

  console.log("=== Example 4: String Buffers ===");
  const encoder = new TextEncoder();
  const str1 = encoder.encode("Hello");
  const str2 = encoder.encode("Hello");
  const str3 = encoder.encode("World");
  console.log("'Hello' == 'Hello':", bufferEqual(str1, str2));
  console.log("'Hello' == 'World':", bufferEqual(str1, str3));
  console.log();

  console.log("=== Example 5: Hash Comparison ===");
  const hash1 = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
  const hash2 = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
  const hash3 = new Uint8Array([0xCA, 0xFE, 0xBA, 0xBE]);
  console.log("Hash 1 == Hash 2:", bufferEqual(hash1, hash2));
  console.log("Hash 1 == Hash 3:", bufferEqual(hash1, hash3));
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same buffer comparison in all languages via Elide!");
  console.log("✓ JavaScript/TypeScript/Python/Ruby/Java");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Verify file integrity");
  console.log("- Compare hash digests");
  console.log("- Test binary data");
  console.log("- Protocol verification");
  console.log();

  console.log("🚀 ~1M+ downloads/week on npm!");
}
