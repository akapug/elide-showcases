/**
 * unique-string - Generate Unique Random Strings
 *
 * Generate a unique random string useful for IDs, temporary file names,
 * and random identifiers. Simple and lightweight.
 *
 * Features:
 * - Cryptographically random
 * - Hex-based strings
 * - Collision-resistant
 * - Consistent length
 *
 * Package has ~20M+ downloads/week on npm!
 */

function uniqueString(): string {
  const timestamp = Date.now().toString(16);
  const randomBytes = new Uint8Array(12);
  crypto.getRandomValues(randomBytes);

  const randomHex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');

  return timestamp + randomHex;
}

export default uniqueString;
export { uniqueString };

if (import.meta.url.includes("elide-unique-string.ts")) {
  console.log("🆔 unique-string - Unique Random Strings\n");

  console.log("=== Example 1: Basic Generation ===");
  for (let i = 0; i < 10; i++) {
    console.log(`  ${i + 1}. ${uniqueString()}`);
  }
  console.log();

  console.log("=== Example 2: Temporary Files ===");
  const files = Array.from({ length: 5 }, () => {
    return `/tmp/${uniqueString()}.txt`;
  });

  files.forEach((f, i) => console.log(`  ${i + 1}. ${f}`));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Temporary file names");
  console.log("- Cache keys");
  console.log("- Random identifiers");
  console.log();

  console.log("🚀 ~20M+ downloads/week on npm");
}
