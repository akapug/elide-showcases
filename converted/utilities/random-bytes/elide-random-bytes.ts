/**
 * Random Bytes - Generate Random Bytes
 *
 * Generate cryptographically secure random bytes.
 * **POLYGLOT SHOWCASE**: One random bytes library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/random-bytes (~2M+ downloads/week)
 *
 * Features:
 * - Cryptographically secure random bytes
 * - Sync and async generation
 * - Buffer output
 * - Hex string output
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java all need secure random bytes
 * - ONE implementation works everywhere on Elide
 * - Consistent random generation across languages
 * - Share security primitives across your stack
 *
 * Use cases:
 * - Generate session tokens
 * - Create cryptographic keys
 * - Initialize random data
 * - Security tokens and secrets
 *
 * Package has ~2M+ downloads/week on npm - essential security utility!
 */

/**
 * Generate random bytes using crypto
 */
export function randomBytes(size: number): Buffer {
  const bytes = new Uint8Array(size);
  crypto.getRandomValues(bytes);
  return Buffer.from(bytes);
}

/**
 * Generate random bytes asynchronously
 */
export async function randomBytesAsync(size: number): Promise<Buffer> {
  return randomBytes(size);
}

/**
 * Generate random bytes as hex string
 */
export function randomBytesHex(size: number): string {
  return randomBytes(size).toString('hex');
}

/**
 * Generate random bytes as base64 string
 */
export function randomBytesBase64(size: number): string {
  return randomBytes(size).toString('base64');
}

export default randomBytes;

// CLI Demo
if (import.meta.url.includes("elide-random-bytes.ts")) {
  console.log("🎲 Random Bytes - Secure Random Generation for Elide (POLYGLOT!)\n");

  console.log("=== Example 1: Generate Random Bytes ===");
  const bytes = randomBytes(16);
  console.log("16 bytes:", bytes);
  console.log("As hex:", bytes.toString('hex'));
  console.log("As base64:", bytes.toString('base64'));
  console.log();

  console.log("=== Example 2: Hex String ===");
  console.log("8 bytes hex:", randomBytesHex(8));
  console.log("16 bytes hex:", randomBytesHex(16));
  console.log("32 bytes hex:", randomBytesHex(32));
  console.log();

  console.log("=== Example 3: Base64 String ===");
  console.log("16 bytes base64:", randomBytesBase64(16));
  console.log("32 bytes base64:", randomBytesBase64(32));
  console.log();

  console.log("=== Example 4: Session Tokens ===");
  function generateSessionToken(): string {
    return randomBytesHex(32);
  }
  console.log("Session token:", generateSessionToken());
  console.log();

  console.log("=== Example 5: API Keys ===");
  function generateApiKey(): string {
    return randomBytesBase64(24);
  }
  console.log("API key:", generateApiKey());
  console.log();

  console.log("=== Example 6: POLYGLOT Use Case ===");
  console.log("🌐 Same random bytes library works in:");
  console.log("  • JavaScript/TypeScript");
  console.log("  • Python (via Elide)");
  console.log("  • Ruby (via Elide)");
  console.log("  • Java (via Elide)");
  console.log();
  console.log("Benefits:");
  console.log("  ✓ One random library, all languages");
  console.log("  ✓ Consistent security across your stack");
  console.log("  ✓ Share security primitives everywhere");
  console.log();

  console.log("🚀 Performance: Zero dependencies, instant execution!");
  console.log("📦 ~2M+ downloads/week on npm!");
}
