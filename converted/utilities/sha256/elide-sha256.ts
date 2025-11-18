/**
 * SHA256 - SHA-256 Hashing Algorithm
 *
 * Generate SHA-256 hashes for strings and data. Industry-standard
 * cryptographic hash function for security-critical applications.
 *
 * Features:
 * - Secure SHA-256 hashing
 * - Hex output
 * - Cryptographically strong
 * - Web Crypto API powered
 *
 * Package has ~5M+ downloads/week on npm!
 */

async function sha256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * SHA-256 with base64 output
 */
async function sha256Base64(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = new Uint8Array(hashBuffer);
  return btoa(String.fromCharCode(...hashArray));
}

export default sha256;
export { sha256, sha256Base64 };

if (import.meta.url.includes("elide-sha256.ts")) {
  console.log("🔐 SHA256 - SHA-256 Hashing Algorithm\n");

  console.log("=== Example 1: Hash Strings ===");
  console.log("SHA256('hello'):", await sha256('hello'));
  console.log("SHA256('world'):", await sha256('world'));
  console.log();

  console.log("=== Example 2: Password Hashing ===");
  const password = "mySecurePassword123!";
  const hash = await sha256(password + "salt_12345");
  console.log("Hashed password:", hash);
  console.log();

  console.log("=== Example 3: Data Integrity ===");
  const data = "Critical data to verify";
  const checksum = await sha256(data);
  console.log("Data:", data);
  console.log("Checksum:", checksum);
  console.log();

  console.log("=== Example 4: Base64 Output ===");
  const base64Hash = await sha256Base64("hello");
  console.log("Base64:", base64Hash);
  console.log();

  console.log("=== Example 5: File Integrity ===");
  const fileContent = "Important file content";
  const fileHash = await sha256(fileContent);
  console.log("File hash:", fileHash);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Password hashing (with salt)");
  console.log("- Data integrity verification");
  console.log("- Digital signatures");
  console.log("- Blockchain and cryptocurrencies");
  console.log("- Certificate fingerprints");
  console.log();

  console.log("🚀 ~5M+ downloads/week on npm");
  console.log("🔒 Cryptographically secure");
}
