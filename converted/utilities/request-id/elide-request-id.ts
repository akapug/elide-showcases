/**
 * request-id - Request ID Generation
 *
 * Generate and manage unique request identifiers.
 * **POLYGLOT SHOWCASE**: Request IDs for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/request-id (~20K+ downloads/week)
 *
 * Features:
 * - UUID v4 generation
 * - Custom formats
 * - Sequential IDs
 * - Prefix support
 * - Timestamp-based IDs
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Same ID format across languages
 * - ONE ID generation on Elide
 * - Consistent request tracking
 * - Cross-service correlation
 *
 * Use cases:
 * - Request tracking
 * - Log correlation
 * - Transaction IDs
 * - Unique identifiers
 *
 * Package has ~20K+ downloads/week on npm!
 */

class RequestId {
  private static counter = 0;
  private static prefix = '';

  static setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  static generate(): string {
    return this.uuid();
  }

  static uuid(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  static sequential(): string {
    this.counter++;
    const id = this.prefix ? `${this.prefix}-${this.counter}` : `${this.counter}`;
    return id.padStart(10, '0');
  }

  static timestamp(): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    return this.prefix ? `${this.prefix}-${timestamp}-${random}` : `${timestamp}-${random}`;
  }

  static short(): string {
    return Math.random().toString(36).substring(2, 11);
  }

  static custom(generator: () => string): string {
    const id = generator();
    return this.prefix ? `${this.prefix}-${id}` : id;
  }
}

export { RequestId };
export default RequestId;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🆔 request-id - Request ID Generation (POLYGLOT!)\n");

  console.log("=== UUID Generation ===");
  for (let i = 0; i < 3; i++) {
    console.log(`UUID ${i + 1}:`, RequestId.uuid());
  }
  console.log();

  console.log("=== Sequential IDs ===");
  RequestId.setPrefix('req');
  for (let i = 0; i < 5; i++) {
    console.log(`Sequential ${i + 1}:`, RequestId.sequential());
  }
  console.log();

  console.log("=== Timestamp-based IDs ===");
  RequestId.setPrefix('ts');
  for (let i = 0; i < 3; i++) {
    console.log(`Timestamp ${i + 1}:`, RequestId.timestamp());
  }
  console.log();

  console.log("=== Short IDs ===");
  for (let i = 0; i < 3; i++) {
    console.log(`Short ${i + 1}:`, RequestId.short());
  }
  console.log();

  console.log("=== Custom Generator ===");
  RequestId.setPrefix('custom');
  const customId = RequestId.custom(() => {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  });
  console.log('Custom ID:', customId);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Request tracking");
  console.log("- Log correlation");
  console.log("- Transaction IDs");
  console.log("- Unique identifiers");
  console.log("- ~20K+ downloads/week on npm!");
}
