/**
 * ULID - Universally Unique Lexicographically Sortable Identifier
 *
 * Generate ULIDs - time-ordered unique identifiers that are compatible with UUID,
 * sortable by timestamp, and URL-safe. Better than UUID v4 for distributed systems.
 *
 * Features:
 * - Lexicographically sortable by timestamp
 * - 128-bit compatibility with UUID
 * - URL-safe (no special characters)
 * - Monotonic ordering (same millisecond)
 * - Cryptographically random
 *
 * Polyglot Benefits:
 * - ONE ID generation for ALL languages
 * - Consistent sorting across services
 * - Database-friendly primary keys
 *
 * Use cases:
 * - Database primary keys
 * - Distributed system IDs
 * - Event sourcing
 * - Log correlation
 *
 * Package has ~2M+ downloads/week on npm!
 */

const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'; // Crockford's Base32
const ENCODING_LEN = ENCODING.length;
const TIME_MAX = Math.pow(2, 48) - 1;
const TIME_LEN = 10;
const RANDOM_LEN = 16;

let lastTime = 0;
let lastRandom: number[] = [];

/**
 * Generate a ULID
 */
function ulid(seedTime?: number): string {
  const now = seedTime ?? Date.now();

  if (now > TIME_MAX) {
    throw new Error('Time value is too large');
  }

  let time = now;
  let random: number[];

  // Monotonic: increment random if same millisecond
  if (now === lastTime) {
    random = incrementRandom(lastRandom);
  } else {
    random = generateRandom();
  }

  lastTime = now;
  lastRandom = random;

  return encodeTime(time, TIME_LEN) + encodeRandom(random, RANDOM_LEN);
}

/**
 * Generate ULID with monotonic guarantee
 */
function monotonicFactory() {
  let lastTimestamp = 0;
  let lastRandomValues: number[] = [];

  return function (seedTime?: number): string {
    const now = seedTime ?? Date.now();

    if (now > TIME_MAX) {
      throw new Error('Time value is too large');
    }

    if (now === lastTimestamp) {
      lastRandomValues = incrementRandom(lastRandomValues);
    } else {
      lastRandomValues = generateRandom();
      lastTimestamp = now;
    }

    return encodeTime(now, TIME_LEN) + encodeRandom(lastRandomValues, RANDOM_LEN);
  };
}

/**
 * Decode ULID to timestamp
 */
function decodeTime(id: string): number {
  if (id.length !== TIME_LEN + RANDOM_LEN) {
    throw new Error('Invalid ULID');
  }

  const time = id.substring(0, TIME_LEN);
  let timestamp = 0;

  for (let i = 0; i < time.length; i++) {
    const char = time[i];
    const index = ENCODING.indexOf(char);

    if (index === -1) {
      throw new Error('Invalid ULID character');
    }

    timestamp = timestamp * ENCODING_LEN + index;
  }

  return timestamp;
}

/**
 * Encode time component
 */
function encodeTime(time: number, len: number): string {
  let result = '';

  for (let i = len; i > 0; i--) {
    const mod = time % ENCODING_LEN;
    result = ENCODING[mod] + result;
    time = Math.floor(time / ENCODING_LEN);
  }

  return result;
}

/**
 * Generate random bytes
 */
function generateRandom(): number[] {
  const buffer = new Uint8Array(RANDOM_LEN);
  crypto.getRandomValues(buffer);
  return Array.from(buffer);
}

/**
 * Increment random for monotonic ordering
 */
function incrementRandom(random: number[]): number[] {
  const incremented = [...random];

  for (let i = incremented.length - 1; i >= 0; i--) {
    incremented[i]++;

    if (incremented[i] < 256) {
      return incremented;
    }

    incremented[i] = 0;
  }

  // Overflow - generate new random
  return generateRandom();
}

/**
 * Encode random component
 */
function encodeRandom(random: number[], len: number): string {
  let result = '';
  let buffer = 0;
  let bits = 0;

  for (let i = 0; i < random.length; i++) {
    buffer = (buffer << 8) | random[i];
    bits += 8;

    while (bits >= 5 && result.length < len) {
      const index = (buffer >>> (bits - 5)) & 31;
      result += ENCODING[index];
      bits -= 5;
    }
  }

  // Pad if needed
  while (result.length < len) {
    result += ENCODING[0];
  }

  return result.substring(0, len);
}

// Exports
export default ulid;
export { ulid, monotonicFactory, decodeTime };

// CLI Demo
if (import.meta.url.includes("elide-ulid.ts")) {
  console.log("🆔 ULID - Universally Unique Lexicographically Sortable ID\n");

  console.log("=== Example 1: Basic ULID Generation ===");
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${ulid()}`);
  }
  console.log();

  console.log("=== Example 2: Timestamp Sorting ===");
  const ids: string[] = [];

  console.log("Generating ULIDs with delays:");
  for (let i = 0; i < 5; i++) {
    const id = ulid();
    ids.push(id);
    console.log(`  ${i + 1}. ${id} (${new Date(decodeTime(id)).toISOString()})`);
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  console.log("\nSorted lexicographically:");
  const sorted = [...ids].sort();
  sorted.forEach((id, i) => {
    console.log(`  ${i + 1}. ${id} ✓`);
  });
  console.log("(Notice: Lexicographic sort = Time sort)");
  console.log();

  console.log("=== Example 3: Monotonic ULIDs ===");
  const monotonic = monotonicFactory();

  console.log("Same millisecond - monotonically increasing:");
  const sameTime = Date.now();
  for (let i = 0; i < 5; i++) {
    console.log(`  ${i + 1}. ${monotonic(sameTime)}`);
  }
  console.log();

  console.log("=== Example 4: Decode Timestamp ===");
  const id = ulid();
  const timestamp = decodeTime(id);
  const date = new Date(timestamp);

  console.log("ULID:", id);
  console.log("Timestamp:", timestamp);
  console.log("Date:", date.toISOString());
  console.log("Human:", date.toLocaleString());
  console.log();

  console.log("=== Example 5: Database Primary Keys ===");
  interface Record {
    id: string;
    name: string;
    createdAt: Date;
  }

  const records: Record[] = [
    { id: ulid(), name: "Record 1", createdAt: new Date() },
    { id: ulid(), name: "Record 2", createdAt: new Date() },
    { id: ulid(), name: "Record 3", createdAt: new Date() }
  ];

  console.log("Database records:");
  records.forEach(r => {
    console.log(`  ${r.id}: ${r.name}`);
  });
  console.log();

  console.log("=== Example 6: Event Sourcing ===");
  interface Event {
    id: string;
    type: string;
    timestamp: number;
  }

  function createEvent(type: string): Event {
    const id = ulid();
    return {
      id,
      type,
      timestamp: decodeTime(id)
    };
  }

  const events = [
    createEvent('UserCreated'),
    createEvent('UserUpdated'),
    createEvent('UserDeleted')
  ];

  console.log("Event stream:");
  events.forEach(e => {
    console.log(`  ${e.id}: ${e.type}`);
  });
  console.log();

  console.log("=== Example 7: Distributed System IDs ===");
  console.log("Multiple services generating IDs:");

  const service1 = () => ulid();
  const service2 = () => ulid();
  const service3 = () => ulid();

  const distributed = [
    service1(),
    service2(),
    service3(),
    service1(),
    service2()
  ];

  distributed.forEach((id, i) => {
    console.log(`  Service ${(i % 3) + 1}: ${id}`);
  });

  console.log("\nSorted globally:");
  distributed.sort().forEach((id, i) => {
    console.log(`  ${i + 1}. ${id}`);
  });
  console.log();

  console.log("=== Example 8: ULID vs UUID Comparison ===");
  console.log("ULID:", ulid());
  console.log("UUID:", crypto.randomUUID());
  console.log("\nULID advantages:");
  console.log("  ✓ Time-ordered (sortable)");
  console.log("  ✓ More compact (no hyphens)");
  console.log("  ✓ Crockford Base32 (human-friendly)");
  console.log("  ✓ Monotonic within same millisecond");
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Database primary keys (sorted by creation)");
  console.log("- Distributed system identifiers");
  console.log("- Event sourcing event IDs");
  console.log("- Log correlation IDs");
  console.log("- API resource identifiers");
  console.log();

  console.log("🚀 Performance:");
  console.log("- Polyglot: Works in TypeScript, Python, Ruby, Java");
  console.log("- Zero dependencies");
  console.log("- ~2M+ downloads/week on npm");
  console.log("- Better than UUID for time-ordered data");
}
