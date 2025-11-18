/**
 * unique-filename - Generate Unique Filenames
 *
 * Generate unique filenames for temporary files.
 * **POLYGLOT SHOWCASE**: One filename generator for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/unique-filename (~5M+ downloads/week)
 *
 * Features:
 * - Generate unique filenames
 * - Hash-based uniqueness
 * - Custom prefix support
 * - Cross-platform compatible
 * - Zero dependencies
 */

const path = await import('node:path');
const crypto = await import('node:crypto');

function hash(input: string): string {
  return crypto.createHash('md5').update(input).digest('hex').substring(0, 8);
}

export function uniqueFilename(dir: string, prefix?: string, suffix?: string): string {
  const random = Math.random().toString(36).substring(2, 15);
  const timestamp = Date.now().toString(36);
  const uniquePart = hash(random + timestamp);

  let filename = '';

  if (prefix) {
    filename += prefix + '-';
  }

  filename += uniquePart;

  if (suffix) {
    filename += '-' + suffix;
  }

  return path.join(dir, filename);
}

export default uniqueFilename;

if (import.meta.url.includes("elide-unique-filename.ts")) {
  console.log("🔖 unique-filename - Generate Unique Filenames (POLYGLOT!)\n");

  console.log("=== Example 1: Basic Usage ===");
  console.log("Unique file:", uniqueFilename('/tmp'));
  console.log("Another:", uniqueFilename('/tmp'));
  console.log();

  console.log("=== Example 2: With Prefix ===");
  console.log("Upload file:", uniqueFilename('/tmp', 'upload'));
  console.log("Cache file:", uniqueFilename('/tmp', 'cache'));
  console.log();

  console.log("=== Example 3: With Prefix and Suffix ===");
  console.log("Session:", uniqueFilename('/tmp', 'session', 'data'));
  console.log("Backup:", uniqueFilename('/tmp', 'backup', 'json'));
  console.log();

  console.log("=== Example 4: Multiple Unique Files ===");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}:`, uniqueFilename('/tmp', 'file'));
  }
  console.log();

  console.log("🚀 Performance: ~5M+ downloads/week on npm!");
}
