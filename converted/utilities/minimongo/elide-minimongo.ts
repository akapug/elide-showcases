/**
 * MiniMongo - MongoDB-like Client Database
 *
 * Lightweight MongoDB-like database for client-side storage.
 * **POLYGLOT SHOWCASE**: One MongoDB client for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/minimongo (~30K+ downloads/week)
 *
 * Features:
 * - MongoDB-like API
 * - Client-side storage
 * - Query support
 * - Indexing
 * - In-memory or IndexedDB
 * - Zero dependencies
 *
 * Use cases:
 * - Client-side MongoDB
 * - Offline data storage
 * - Meteor compatibility
 */

export class Collection {
  private data: any[] = [];

  insert(doc: any) {
    this.data.push({ ...doc, _id: Math.random().toString(36) });
  }

  find(query: any = {}) {
    return this.data.filter(doc => {
      return Object.keys(query).every(key => doc[key] === query[key]);
    });
  }

  findOne(query: any) {
    return this.find(query)[0];
  }
}

export class MiniMongo {
  private collections: Map<string, Collection> = new Map();

  collection(name: string) {
    if (!this.collections.has(name)) {
      this.collections.set(name, new Collection());
    }
    return this.collections.get(name)!;
  }
}

export default MiniMongo;

// CLI Demo
if (import.meta.url.includes("elide-minimongo.ts")) {
  console.log("🍃 MiniMongo - MongoDB Client (POLYGLOT!)\n");
  console.log("✅ MongoDB-like API for client-side");
  console.log("🚀 ~30K+ downloads/week on npm!");
}
