/**
 * unique-slug - Generate Unique Slugs
 *
 * Generate unique URL-safe slugs.
 * **POLYGLOT SHOWCASE**: One slug generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/unique-slug (~5M+ downloads/week)
 *
 * Features:
 * - Generate unique slugs
 * - URL-safe characters
 * - Hash-based from strings
 * - Random generation
 * - Zero dependencies
 */

const crypto = await import('node:crypto');

function hash(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex').substring(0, 8);
}

function random(): string {
  const bytes = crypto.randomBytes(4);
  return bytes.toString('hex');
}

export function uniqueSlug(input?: string): string {
  if (input) {
    return hash(input);
  }
  return random();
}

export default uniqueSlug;

if (import.meta.url.includes("elide-unique-slug.ts")) {
  console.log("🏷️ unique-slug - Generate Unique Slugs (POLYGLOT!)\n");

  console.log("=== Example 1: Random Slugs ===");
  console.log("Random:", uniqueSlug());
  console.log("Random:", uniqueSlug());
  console.log("Random:", uniqueSlug());
  console.log();

  console.log("=== Example 2: Hash from String ===");
  console.log("From 'hello':", uniqueSlug('hello'));
  console.log("From 'hello' again:", uniqueSlug('hello'));
  console.log("From 'world':", uniqueSlug('world'));
  console.log("Note: Same input = same slug (deterministic)");
  console.log();

  console.log("=== Example 3: URL Generation ===");
  const articleTitle = "10 Tips for Better Code";
  const slug = uniqueSlug(articleTitle);
  console.log("Article:", articleTitle);
  console.log("URL slug:", slug);
  console.log("Full URL:", `https://blog.example.com/posts/${slug}`);
  console.log();

  console.log("=== Example 4: Generate Multiple Slugs ===");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}:`, uniqueSlug());
  }
  console.log();

  console.log("🚀 Performance: ~5M+ downloads/week on npm!");
}
