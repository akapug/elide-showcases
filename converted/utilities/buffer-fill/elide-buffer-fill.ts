/**
 * buffer-fill - Buffer Fill Utility
 *
 * A ponyfill for `Buffer.prototype.fill()`. Fill a buffer with specified value.
 * **POLYGLOT SHOWCASE**: Fill buffers consistently across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/buffer-fill (~2M+ downloads/week)
 *
 * Features:
 * - Fill buffers with values
 * - String and number support
 * - Range filling (start/end)
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need buffer filling
 * - ONE implementation works everywhere on Elide
 * - Consistent buffer manipulation across languages
 *
 * Use cases:
 * - Initialize buffers with default values
 * - Clear buffers (fill with 0)
 * - Pattern filling
 * - Memory initialization
 *
 * Package has ~2M+ downloads/week on npm!
 */

type BufferEncoding = 'utf8' | 'utf-8' | 'hex' | 'base64' | 'ascii';

export function bufferFill(
  buf: Uint8Array,
  value: number | string | Uint8Array,
  offset: number = 0,
  end: number = buf.length,
  encoding?: BufferEncoding
): Uint8Array {
  if (typeof value === 'number') {
    for (let i = offset; i < end; i++) {
      buf[i] = value;
    }
  } else if (typeof value === 'string') {
    const encoder = new TextEncoder();
    const fillBuf = encoder.encode(value);
    for (let i = offset; i < end; i++) {
      buf[i] = fillBuf[(i - offset) % fillBuf.length];
    }
  } else if (value instanceof Uint8Array) {
    for (let i = offset; i < end; i++) {
      buf[i] = value[(i - offset) % value.length];
    }
  }
  return buf;
}

export default bufferFill;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎨 buffer-fill - Fill Buffers with Values (POLYGLOT!)\n");

  console.log("=== Example 1: Fill with Number ===");
  const buf1 = new Uint8Array(10);
  bufferFill(buf1, 0x42);
  console.log("Filled:", buf1);
  console.log();

  console.log("=== Example 2: Fill with String ===");
  const buf2 = new Uint8Array(20);
  bufferFill(buf2, "Hello");
  console.log("Filled:", new TextDecoder().decode(buf2));
  console.log();

  console.log("=== Example 3: Partial Fill ===");
  const buf3 = new Uint8Array(10);
  bufferFill(buf3, 0xFF, 2, 8);
  console.log("Partial fill:", buf3);
  console.log();

  console.log("=== Example 4: Pattern Fill ===");
  const buf4 = new Uint8Array(16);
  const pattern = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
  bufferFill(buf4, pattern);
  console.log("Pattern:", buf4);
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Same buffer fill works in all languages via Elide!");
  console.log("✓ JavaScript/TypeScript/Python/Ruby/Java");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Initialize buffers");
  console.log("- Clear memory");
  console.log("- Pattern filling");
  console.log();

  console.log("🚀 ~2M+ downloads/week on npm!");
}
