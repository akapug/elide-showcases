/**
 * MemoryStore for Elide - Memory Session Store
 * Features: In-memory storage, TTL expiration, Pruning, Statistics
 * Pure TypeScript, zero dependencies, polyglot-ready
 * NPM: 2M+ downloads/week
 */

export interface MemoryStoreOptions {
  checkPeriod?: number;
  ttl?: number;
  max?: number;
}

export class MemoryStore {
  private sessions: Map<string, { data: any; expires: number }> = new Map();
  private checkInterval: any;

  constructor(options: MemoryStoreOptions = {}) {
    const checkPeriod = options.checkPeriod || 60000;
    this.checkInterval = setInterval(() => this.prune(), checkPeriod);
  }

  get(sid: string, callback: (err: any, session?: any) => void): void {
    const session = this.sessions.get(sid);
    if (!session || session.expires < Date.now()) {
      this.sessions.delete(sid);
      return callback(null, null);
    }
    callback(null, session.data);
  }

  set(sid: string, session: any, callback: (err?: any) => void): void {
    const ttl = session.cookie?.maxAge || 86400000;
    this.sessions.set(sid, { data: session, expires: Date.now() + ttl });
    callback();
  }

  destroy(sid: string, callback: (err?: any) => void): void {
    this.sessions.delete(sid);
    callback();
  }

  touch(sid: string, session: any, callback: (err?: any) => void): void {
    const existing = this.sessions.get(sid);
    if (existing) {
      const ttl = session.cookie?.maxAge || 86400000;
      existing.expires = Date.now() + ttl;
    }
    callback();
  }

  private prune(): void {
    const now = Date.now();
    for (const [sid, session] of this.sessions.entries()) {
      if (session.expires < now) {
        this.sessions.delete(sid);
      }
    }
  }

  length(callback: (err: any, length?: number) => void): void {
    callback(null, this.sessions.size);
  }

  clear(callback: (err?: any) => void): void {
    this.sessions.clear();
    callback();
  }

  stopInterval(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }
}

if (import.meta.url.includes("memorystore")) {
  console.log("💾 MemoryStore for Elide - Memory Session Store\n");
  const store = new MemoryStore({ checkPeriod: 30000 });
  store.set('sess1', { user: 'alice' }, () => {
    console.log("✓ Session saved");
    store.length((err, len) => console.log("Sessions count:", len));
  });
  console.log("\n🚀 Polyglot: 2M+ npm downloads/week");
}

export default MemoryStore;
