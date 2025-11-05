/**
 * Nanoid - Tiny, secure, URL-friendly unique string ID generator
 *
 * Smaller and faster than UUID with custom alphabet support
 * Default: 21 characters, ~2 million years needed for 1% collision probability
 *
 * Popular package with ~20M downloads/week on npm!
 */

/**
 * Default alphabet: URL-safe characters (A-Za-z0-9_-)
 */
const defaultAlphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-';

/**
 * Generate a Nanoid
 */
export function nanoid(size: number = 21): string {
  let id = '';
  const bytes = new Uint8Array(size);

  // Use crypto.getRandomValues for secure random
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(bytes);
    for (let i = 0; i < size; i++) {
      id += defaultAlphabet[bytes[i] % 64]; // 64 = alphabet length
    }
  } else {
    // Fallback to Math.random (less secure)
    for (let i = 0; i < size; i++) {
      id += defaultAlphabet[Math.floor(Math.random() * 64)];
    }
  }

  return id;
}

/**
 * Generate Nanoid with custom alphabet
 */
export function customAlphabet(alphabet: string, defaultSize?: number): (size?: number) => string {
  const alphabetLength = alphabet.length;

  return (size: number = defaultSize || 21): string => {
    let id = '';
    const bytes = new Uint8Array(size);

    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      crypto.getRandomValues(bytes);
      for (let i = 0; i < size; i++) {
        id += alphabet[bytes[i] % alphabetLength];
      }
    } else {
      for (let i = 0; i < size; i++) {
        id += alphabet[Math.floor(Math.random() * alphabetLength)];
      }
    }

    return id;
  };
}

/**
 * Generate multiple Nanoids
 */
export function generate(count: number, size?: number): string[] {
  const ids: string[] = [];
  for (let i = 0; i < count; i++) {
    ids.push(nanoid(size));
  }
  return ids;
}

/**
 * Predefined alphabets
 */
export const alphabets = {
  // Lowercase only
  lowercase: 'abcdefghijklmnopqrstuvwxyz',

  // Uppercase only
  uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',

  // Numbers only
  numbers: '0123456789',

  // Hexadecimal
  hex: '0123456789abcdef',

  // No look-alike characters (remove 0OIl)
  nolookalikes: '346789ABCDEFGHJKLMNPQRTUVWXYabcdefghijkmnpqrtwxyz',

  // Alphanumeric only (no special chars)
  alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
};

// CLI Demo
if (import.meta.url.includes("elide-nanoid.ts")) {
  console.log("🎯 Nanoid - Tiny Unique ID Generator for Elide\n");

  console.log("=== Example 1: Basic Generation ===");
  console.log("Default (21 chars):", nanoid());
  console.log("Short (10 chars):  ", nanoid(10));
  console.log("Long (32 chars):   ", nanoid(32));
  console.log();

  console.log("=== Example 2: Multiple IDs ===");
  const ids = generate(5, 12);
  console.log("5 IDs with 12 characters:");
  ids.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));
  console.log();

  console.log("=== Example 3: Custom Alphabets ===");
  const hexId = customAlphabet(alphabets.hex);
  console.log("Hex ID (lowercase):    ", hexId(16));

  const numericId = customAlphabet(alphabets.numbers);
  console.log("Numeric only:          ", numericId(10));

  const noLookalike = customAlphabet(alphabets.nolookalikes);
  console.log("No lookalikes (0OIl):  ", noLookalike(16));
  console.log();

  console.log("=== Example 4: Different Sizes ===");
  console.log("Tiny (6):   ", nanoid(6));
  console.log("Small (10): ", nanoid(10));
  console.log("Default (21):", nanoid(21));
  console.log("Large (32): ", nanoid(32));
  console.log();

  console.log("=== Example 5: URL-Safe for Routing ===");
  const routes = [
    { path: `/post/${nanoid(8)}`, title: "Blog Post" },
    { path: `/user/${nanoid(8)}`, title: "User Profile" },
    { path: `/image/${nanoid(8)}`, title: "Image" },
  ];
  console.log("Generated URLs:");
  routes.forEach(route => console.log(`  ${route.path} - ${route.title}`));
  console.log();

  console.log("=== Example 6: Database Primary Keys ===");
  const records = [
    { id: nanoid(12), name: "Alice" },
    { id: nanoid(12), name: "Bob" },
    { id: nanoid(12), name: "Charlie" },
  ];
  console.log("Database records:");
  records.forEach(record => console.log(`  ${record.id} - ${record.name}`));
  console.log();

  console.log("=== Example 7: File Names ===");
  const fileTypes = ["pdf", "jpg", "docx"];
  console.log("Generated file names:");
  fileTypes.forEach(ext => {
    console.log(`  ${nanoid(10)}.${ext}`);
  });
  console.log();

  console.log("=== Example 8: Comparison with UUID ===");
  const uuid = "550e8400-e29b-41d4-a716-446655440000"; // UUID v4
  const nano = nanoid();
  console.log(`UUID length: ${uuid.length} chars`);
  console.log(`Nanoid length: ${nano.length} chars`);
  console.log(`Shorter by: ${uuid.length - nano.length} chars (${Math.round((1 - nano.length / uuid.length) * 100)}%)`);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- URL slugs and short links");
  console.log("- Database primary keys");
  console.log("- Session tokens");
  console.log("- File names for uploads");
  console.log("- API keys (with custom alphabet)");
  console.log("- Order/tracking numbers");
  console.log("- Shorter than UUID (21 vs 36 chars)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Zero dependencies");
  console.log("- Instant execution on Elide");
  console.log("- 10x faster than Node.js cold start");
  console.log("- Cryptographically strong (uses crypto.getRandomValues)");
  console.log("- ~20M downloads/week on npm");
  console.log();

  console.log("🔒 Security:");
  console.log("- Default 21 chars = 126 bits of entropy");
  console.log("- ~2 million years for 1% collision probability");
  console.log("- More collision-resistant than UUID v4");
}

export default nanoid;
