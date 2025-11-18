/**
 * buffer-alloc - Allocate Buffers Safely
 *
 * A ponyfill for `Buffer.alloc()`. Allocates a buffer safely with optional fill.
 * **POLYGLOT SHOWCASE**: Allocate buffers consistently across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/buffer-alloc (~2M+ downloads/week)
 *
 * Features:
 * - Safe buffer allocation
 * - Optional fill value
 * - Encoding support
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need safe buffer allocation
 * - ONE implementation works everywhere on Elide
 * - Consistent memory allocation across languages
 * - Share buffer utilities across your stack
 *
 * Use cases:
 * - Allocating initialized buffers
 * - Pre-filled buffer creation
 * - Safe memory allocation
 * - Binary data structures
 *
 * Package has ~2M+ downloads/week on npm - essential buffer utility!
 */

type BufferEncoding = 'utf8' | 'utf-8' | 'hex' | 'base64' | 'ascii' | 'binary' | 'latin1';

/**
 * Allocate a buffer with optional fill
 */
export function bufferAlloc(size: number, fill?: number | string | Uint8Array, encoding?: BufferEncoding): Uint8Array {
  const buf = new Uint8Array(size);

  if (fill !== undefined) {
    if (typeof fill === 'number') {
      buf.fill(fill);
    } else if (typeof fill === 'string') {
      const fillBuf = stringToBuffer(fill, encoding);
      for (let i = 0; i < size; i++) {
        buf[i] = fillBuf[i % fillBuf.length];
      }
    } else if (fill instanceof Uint8Array) {
      for (let i = 0; i < size; i++) {
        buf[i] = fill[i % fill.length];
      }
    }
  }

  return buf;
}

/**
 * Convert string to buffer
 */
function stringToBuffer(str: string, encoding: BufferEncoding = 'utf8'): Uint8Array {
  encoding = (encoding || 'utf8').toLowerCase() as BufferEncoding;

  if (encoding === 'hex') {
    const bytes = [];
    for (let i = 0; i < str.length; i += 2) {
      bytes.push(parseInt(str.substr(i, 2), 16));
    }
    return new Uint8Array(bytes);
  }

  if (encoding === 'base64') {
    const decoded = atob(str.replace(/[^A-Za-z0-9+/]/g, ''));
    const bytes = new Uint8Array(decoded.length);
    for (let i = 0; i < decoded.length; i++) {
      bytes[i] = decoded.charCodeAt(i);
    }
    return bytes;
  }

  const encoder = new TextEncoder();
  return encoder.encode(str);
}

export default bufferAlloc;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🔒 buffer-alloc - Safe Buffer Allocation (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Allocation ===");
  const buf1 = bufferAlloc(10);
  console.log("Empty buffer:", buf1);
  console.log();

  console.log("=== Example 2: Fill with Number ===");
  const buf2 = bufferAlloc(10, 0x42);
  console.log("Filled with 0x42:", buf2);
  console.log("As string:", new TextDecoder().decode(buf2));
  console.log();

  console.log("=== Example 3: Fill with String ===");
  const buf3 = bufferAlloc(20, "ABC");
  console.log("Filled with 'ABC':", buf3);
  console.log("As string:", new TextDecoder().decode(buf3));
  console.log();

  console.log("=== Example 4: Fill with Pattern ===");
  const pattern = new Uint8Array([0xDE, 0xAD, 0xBE, 0xEF]);
  const buf4 = bufferAlloc(16, pattern);
  console.log("Filled with pattern:", buf4);
  console.log();

  console.log("=== Example 5: Different Sizes ===");
  for (const size of [8, 16, 32, 64]) {
    const buf = bufferAlloc(size, 0xFF);
    console.log(`Size ${size}:`, buf.slice(0, 4), "...");
  }
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same buffer allocation works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ Safe buffer allocation everywhere");
  console.log("  ✓ Consistent memory handling");
  console.log("  ✓ Share allocation patterns across languages");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Allocating initialized buffers");
  console.log("- Pre-filled buffer creation");
  console.log("- Safe memory allocation");
  console.log("- Binary data structures");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- ~2M+ downloads/week on npm!");
}
