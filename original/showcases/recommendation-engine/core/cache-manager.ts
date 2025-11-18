import type { Logger } from 'pino';

export class CacheManager {
  private l1Cache = new Map<string, { value: any; expiresAt: number }>();
  private maxSize: number;
  private ttl: number;

  constructor(private logger: Logger) {
    this.maxSize = parseInt(process.env.L1_CACHE_SIZE || '10000');
    this.ttl = parseInt(process.env.CACHE_TTL || '3600') * 1000;

    // Periodic cleanup
    setInterval(() => this.cleanup(), 60000);
  }

  async get(key: string): Promise<any | null> {
    const entry = this.l1Cache.get(key);

    if (!entry) {
      return null;
    }

    if (Date.now() > entry.expiresAt) {
      this.l1Cache.delete(key);
      return null;
    }

    return entry.value;
  }

  async set(key: string, value: any): Promise<void> {
    // Implement LRU eviction if cache is full
    if (this.l1Cache.size >= this.maxSize) {
      const firstKey = this.l1Cache.keys().next().value;
      this.l1Cache.delete(firstKey);
    }

    this.l1Cache.set(key, {
      value,
      expiresAt: Date.now() + this.ttl
    });
  }

  async invalidate(pattern: string): Promise<void> {
    const keys = Array.from(this.l1Cache.keys()).filter(k => k.includes(pattern));
    keys.forEach(k => this.l1Cache.delete(k));
    this.logger.info({ action: 'cache_invalidate', pattern, count: keys.length });
  }

  private cleanup(): void {
    const now = Date.now();
    let cleaned = 0;

    for (const [key, entry] of this.l1Cache.entries()) {
      if (now > entry.expiresAt) {
        this.l1Cache.delete(key);
        cleaned++;
      }
    }

    if (cleaned > 0) {
      this.logger.debug({ action: 'cache_cleanup', cleaned });
    }
  }
}
