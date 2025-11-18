/**
 * secure-random - Cryptographically Secure Random
 *
 * Generate cryptographically secure random bytes.
 *
 * Package has ~2M+ downloads/week on npm!
 */

function secureRandom(length: number): Uint8Array {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return bytes;
}

function secureRandomHex(length: number): string {
  const bytes = secureRandom(length);
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export default secureRandom;
export { secureRandom, secureRandomHex };

if (import.meta.url.includes("elide-secure-random.ts")) {
  console.log("🔐 secure-random - Cryptographically Secure Random\n");
  console.log("Random bytes (16):", secureRandom(16));
  console.log("Random hex (32):", secureRandomHex(32));
  console.log("\n🚀 ~2M+ downloads/week on npm");
}
