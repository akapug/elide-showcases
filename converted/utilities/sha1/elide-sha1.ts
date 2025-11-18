/**
 * SHA1 - SHA1 Hashing Algorithm
 *
 * Generate SHA1 hashes for strings and data. Used for Git commits,
 * file integrity checks, and legacy systems.
 *
 * Features:
 * - Fast SHA1 hashing
 * - Hex output
 * - Web Crypto API powered
 *
 * Package has ~8M+ downloads/week on npm!
 */

async function sha1(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-1', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

export default sha1;
export { sha1 };

if (import.meta.url.includes("elide-sha1.ts")) {
  console.log("🔐 SHA1 - SHA1 Hashing Algorithm\n");

  console.log("=== Example 1: Hash Strings ===");
  console.log("SHA1('hello'):", await sha1('hello'));
  console.log("SHA1('world'):", await sha1('world'));
  console.log();

  console.log("=== Example 2: Git-Style Hashes ===");
  const content = "blob 14\x00Hello, World!";
  const hash = await sha1(content);
  console.log("Content hash:", hash);
  console.log();

  console.log("=== Example 3: File Integrity ===");
  const file = "Important file content";
  const checksum = await sha1(file);
  console.log("File checksum:", checksum);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Git commit hashes");
  console.log("- File integrity checks");
  console.log("- Legacy system compatibility");
  console.log();

  console.log("⚠️  Note: SHA1 is deprecated for security");
  console.log("   Use SHA-256 or SHA-512 for new applications");
  console.log();

  console.log("🚀 ~8M+ downloads/week on npm");
}
