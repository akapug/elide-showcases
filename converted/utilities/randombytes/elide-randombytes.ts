/**
 * RandomBytes - Cryptographically Secure Random Bytes
 *
 * Generate cryptographically strong pseudo-random data.
 * **POLYGLOT SHOWCASE**: One crypto random library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/randombytes (~10M+ downloads/week)
 *
 * Features:
 * - Cryptographically secure PRNG
 * - Browser and Node.js compatible
 * - Fast random generation
 * - Multiple output formats
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need crypto random
 * - ONE implementation works everywhere on Elide
 * - Consistent security across languages
 * - Share crypto primitives across your stack
 *
 * Use cases:
 * - Generate secure tokens
 * - Create initialization vectors
 * - Random encryption keys
 * - Session identifiers
 *
 * Package has ~10M+ downloads/week on npm - critical security utility!
 */

/**
 * Generate cryptographically secure random bytes
 */
export default function randombytes(size: number): Buffer {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes);
}

/**
 * Generate random bytes with callback
 */
export function randomBytes(size: number, callback?: (err: Error | null, buf: Buffer) => void): Buffer | void {
  if (callback) {
    try {
      const buf = randombytes(size);
      callback(null, buf);
    } catch (err) {
      callback(err as Error, Buffer.alloc(0));
    }
  } else {
    return randombytes(size);
  }
}

// CLI Demo
if (import.meta.url.includes("elide-randombytes.ts")) {
  console.log("🔐 RandomBytes - Crypto Random for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Generate Random Bytes ===");
  const bytes1 = randombytes(16);
  console.log("16 bytes:", bytes1);
  console.log("As hex:", bytes1.toString('hex'));
  console.log();

  console.log("=== Example 2: Different Sizes ===");
  console.log("8 bytes:", randombytes(8).toString('hex'));
  console.log("16 bytes:", randombytes(16).toString('hex'));
  console.log("32 bytes:", randombytes(32).toString('hex'));
  console.log("64 bytes:", randombytes(64).toString('hex'));
  console.log();

  console.log("=== Example 3: Callback Style ===");
  randomBytes(16, (err, buf) => {
    if (err) throw err;
    console.log("Callback result:", buf.toString('hex'));
  });
  console.log();

  console.log("=== Example 4: Generate Keys ===");
  function generateKey(bits: number): string {
    return randombytes(bits / 8).toString('hex');
  }
  console.log("128-bit key:", generateKey(128));
  console.log("256-bit key:", generateKey(256));
  console.log();

  console.log("=== Example 5: POLYGLOT Use Case ===");
  console.log("🌐 Same crypto random works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();

  console.log("🚀 Performance: Zero dependencies, instant execution!");
  console.log("📦 ~10M+ downloads/week on npm!");
}
