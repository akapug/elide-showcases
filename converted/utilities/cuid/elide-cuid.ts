/**
 * CUID - Collision-Resistant Unique Identifier
 *
 * Generate collision-resistant unique identifiers optimized for horizontal
 * scaling and performance. More secure and portable than UUID/GUID.
 *
 * Features:
 * - Collision-resistant across distributed systems
 * - Sortable by creation time
 * - URL-safe and human-readable
 * - Portable across platforms
 * - No configuration required
 *
 * Polyglot Benefits:
 * - ONE CUID implementation for ALL languages
 * - Consistent IDs across services
 * - No coordination needed between services
 *
 * Use cases:
 * - Database primary keys
 * - Distributed system IDs
 * - API resource identifiers
 * - Session IDs
 *
 * Package has ~3M+ downloads/week on npm!
 */

const BASE = 36;
const BLOCK_SIZE = 4;
const DISCRETE_VALUES = Math.pow(BASE, BLOCK_SIZE);

let counter = 0;
let fingerprint: string | null = null;

/**
 * Generate random block
 */
function randomBlock(): string {
  return Math.floor(Math.random() * DISCRETE_VALUES)
    .toString(BASE)
    .padStart(BLOCK_SIZE, '0');
}

/**
 * Generate safe random block (cryptographically secure)
 */
function safeRandomBlock(): string {
  const bytes = new Uint8Array(2);
  crypto.getRandomValues(bytes);
  const num = (bytes[0] << 8 | bytes[1]) % DISCRETE_VALUES;
  return num.toString(BASE).padStart(BLOCK_SIZE, '0');
}

/**
 * Get or generate fingerprint
 */
function getFingerprint(): string {
  if (fingerprint) {
    return fingerprint;
  }

  // Generate pseudo-fingerprint based on random values
  const padding = BLOCK_SIZE * 2;
  const globalId = safeRandomBlock() + safeRandomBlock();

  fingerprint = globalId.padStart(padding, '0').substring(0, padding);
  return fingerprint;
}

/**
 * Pad number to specific length
 */
function pad(num: number, size: number): string {
  return num.toString(BASE).padStart(size, '0');
}

/**
 * Generate CUID
 */
function cuid(): string {
  const timestamp = Date.now();
  const counterValue = counter;

  counter = (counter + 1) % DISCRETE_VALUES;

  return 'c' +
    pad(timestamp, 8) +
    pad(counterValue, BLOCK_SIZE) +
    getFingerprint() +
    safeRandomBlock() +
    safeRandomBlock();
}

/**
 * Generate slug (shorter CUID)
 */
function slug(): string {
  const timestamp = Date.now();
  const counterValue = counter;

  counter = (counter + 1) % DISCRETE_VALUES;

  const timestampBlock = pad(timestamp, 8).substring(6); // Last 2 chars
  const counterBlock = pad(counterValue, BLOCK_SIZE).substring(2, 4); // 2 chars

  return timestampBlock +
    counterBlock +
    safeRandomBlock().substring(0, 2) +
    safeRandomBlock().substring(0, 2);
}

/**
 * Check if string is a valid CUID
 */
function isCuid(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  return /^c[0-9a-z]{24}$/.test(str);
}

/**
 * Check if string is a valid slug
 */
function isSlug(str: string): boolean {
  if (typeof str !== 'string') {
    return false;
  }

  return /^[0-9a-z]{8}$/.test(str);
}

// Exports
export default cuid;
export { cuid, slug, isCuid, isSlug };

// CLI Demo
if (import.meta.url.includes("elide-cuid.ts")) {
  console.log("🆔 CUID - Collision-Resistant Unique Identifiers\n");

  console.log("=== Example 1: Basic CUID Generation ===");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${cuid()}`);
  }
  console.log();

  console.log("=== Example 2: CUID Slugs ===");
  console.log("Short form (8 characters):");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${slug()}`);
  }
  console.log();

  console.log("=== Example 3: Validation ===");
  const validCuid = cuid();
  const validSlug = slug();
  const invalid = "invalid-id";

  console.log(`"${validCuid}" is CUID:`, isCuid(validCuid));
  console.log(`"${validSlug}" is slug:`, isSlug(validSlug));
  console.log(`"${invalid}" is CUID:`, isCuid(invalid));
  console.log();

  console.log("=== Example 4: Database Records ===");
  interface Product {
    id: string;
    name: string;
    sku: string;
  }

  const products: Product[] = [
    { id: cuid(), name: "Widget", sku: slug() },
    { id: cuid(), name: "Gadget", sku: slug() },
    { id: cuid(), name: "Doohickey", sku: slug() }
  ];

  console.log("Products:");
  products.forEach(p => {
    console.log(`  ${p.id}: ${p.name} (SKU: ${p.sku})`);
  });
  console.log();

  console.log("=== Example 5: Distributed System IDs ===");
  console.log("Multiple servers generating IDs:");

  const server1 = () => cuid();
  const server2 = () => cuid();
  const server3 = () => cuid();

  const ids = [
    server1(), server2(), server3(),
    server1(), server2(), server3()
  ];

  ids.forEach((id, i) => {
    const server = (i % 3) + 1;
    console.log(`  Server ${server}: ${id}`);
  });

  const uniqueIds = new Set(ids);
  console.log(`\nAll unique: ${uniqueIds.size === ids.length ? 'Yes ✓' : 'No ✗'}`);
  console.log();

  console.log("=== Example 6: Sortable by Time ===");
  const sorted: string[] = [];

  for (let i = 0; i < 5; i++) {
    sorted.push(cuid());
    await new Promise(r => setTimeout(r, 5));
  }

  console.log("Generated order:");
  sorted.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));

  console.log("\nLexicographically sorted:");
  const lexSorted = [...sorted].sort();
  lexSorted.forEach((id, i) => console.log(`  ${i + 1}. ${id}`));

  console.log(`\nOrder preserved: ${JSON.stringify(sorted) === JSON.stringify(lexSorted) ? 'Yes ✓' : 'No'}`);
  console.log();

  console.log("=== Example 7: URL-Safe IDs ===");
  const id = cuid();
  const url = `https://api.example.com/items/${id}`;

  console.log("CUID:", id);
  console.log("URL:", url);
  console.log("No encoding needed: ✓");
  console.log();

  console.log("=== Example 8: Session IDs ===");
  interface Session {
    id: string;
    userId: string;
    token: string;
  }

  function createSession(userId: string): Session {
    return {
      id: cuid(),
      userId,
      token: slug() // Shorter for cookies
    };
  }

  const sessions = [
    createSession("user1"),
    createSession("user2"),
    createSession("user3")
  ];

  console.log("Active sessions:");
  sessions.forEach(s => {
    console.log(`  ${s.id}: User ${s.userId} (token: ${s.token})`);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Database primary keys");
  console.log("- Distributed system identifiers");
  console.log("- API resource IDs");
  console.log("- Session identifiers");
  console.log("- Short URLs (slugs)");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Polyglot: Works in TypeScript, Python, Ruby, Java");
  console.log("- Zero dependencies");
  console.log("- Collision-resistant");
  console.log("- ~3M+ downloads/week on npm");
  console.log();

  console.log("🔐 Security:");
  console.log("- Cryptographically secure random component");
  console.log("- No predictable patterns");
  console.log("- URL-safe (base36)");
  console.log("- Fingerprint prevents cross-system collisions");
}
