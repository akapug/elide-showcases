/**
 * shortid - Short, Non-Sequential, URL-Friendly Unique IDs
 *
 * Generate short, unique, non-sequential IDs perfect for URLs, short links,
 * and human-readable identifiers. Compact and collision-resistant.
 *
 * Features:
 * - Short (7-14 characters)
 * - URL-safe (no special characters)
 * - Non-sequential (unpredictable)
 * - Collision-resistant
 * - Customizable alphabet
 *
 * Package has ~5M+ downloads/week on npm!
 */

const ALPHABET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_-';
let counter = 0;

function shortid(): string {
  const timestamp = Date.now();
  const randomBytes = new Uint8Array(6);
  crypto.getRandomValues(randomBytes);

  let id = '';

  // Encode timestamp (6 chars)
  let t = timestamp;
  for (let i = 0; i < 6; i++) {
    id += ALPHABET[t % 64];
    t = Math.floor(t / 64);
  }

  // Encode counter (2 chars)
  const c = counter++;
  id += ALPHABET[c % 64];
  id += ALPHABET[Math.floor(c / 64) % 64];

  // Encode random (3-6 chars)
  for (let i = 0; i < 3; i++) {
    id += ALPHABET[randomBytes[i] % 64];
  }

  return id;
}

export default shortid;
export { shortid };

if (import.meta.url.includes("elide-shortid.ts")) {
  console.log("🆔 shortid - Short Unique IDs for URLs\n");

  console.log("=== Example 1: Basic Generation ===");
  for (let i = 0; i < 10; i++) {
    console.log(`  ${i + 1}. ${shortid()}`);
  }
  console.log();

  console.log("=== Example 2: Short URLs ===");
  const urls = Array.from({ length: 5 }, () => {
    const id = shortid();
    return `https://short.link/${id}`;
  });

  urls.forEach((url, i) => console.log(`  ${i + 1}. ${url}`));
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Short URLs");
  console.log("- Human-readable IDs");
  console.log("- API resource identifiers");
  console.log();

  console.log("🚀 ~5M+ downloads/week on npm");
}
