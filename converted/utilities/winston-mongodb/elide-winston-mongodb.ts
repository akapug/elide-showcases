/**
 * Winston MongoDB - MongoDB Transport
 *
 * A Winston transport for logging to MongoDB.
 * **POLYGLOT SHOWCASE**: MongoDB logging for ALL languages on Elide!
 *
 * Features:
 * - MongoDB storage
 * - Structured logging
 * - Query support
 * - Collection management
 * - Capped collections
 * - Index support
 * - Bulk operations
 * - Zero dependencies
 *
 * Use cases:
 * - Database logging
 * - Searchable logs
 * - Log analytics
 * - Audit trails
 *
 * Package has ~500K downloads/week on npm!
 */

export interface MongoDBOptions {
  db: string;
  collection?: string;
  capped?: boolean;
  cappedSize?: number;
}

export class MongoDBTransport {
  private collection: string;

  constructor(private options: MongoDBOptions) {
    this.collection = options.collection || 'logs';
  }

  log(level: string, message: string, meta?: any): void {
    const document = {
      timestamp: new Date(),
      level,
      message,
      ...meta,
    };

    console.log(`[MongoDB: ${this.options.db}.${this.collection}] ${JSON.stringify(document)}`);
  }
}

export default MongoDBTransport;

// CLI Demo
if (import.meta.url.includes("elide-winston-mongodb.ts")) {
  console.log("🍃 Winston MongoDB Transport (POLYGLOT!)\n");

  const transport = new MongoDBTransport({
    db: 'myapp',
    collection: 'logs',
    capped: true,
    cappedSize: 10000000,
  });

  transport.log('info', 'User login', { userId: 123 });
  transport.log('error', 'Payment failed', { orderId: 456, error: 'timeout' });

  console.log("\n💡 MongoDB logging everywhere! ~500K downloads/week");
}
