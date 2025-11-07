/**
 * KV Store - Fast key-value storage for edge functions
 *
 * Provides in-memory and persistent storage with TTL support.
 */

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface KVEntry {
  key: string;
  value: any;
  metadata?: {
    ttl?: number;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    tags?: string[];
  };
}

export interface KVStoreConfig {
  persistent: boolean;
  dataDir: string;
  maxSize: number; // Maximum number of keys
  maxMemory: number; // Maximum memory in bytes
  evictionPolicy: 'lru' | 'lfu' | 'fifo';
  syncInterval: number; // Sync to disk interval in ms
}

export class KVStore extends EventEmitter {
  private config: KVStoreConfig;
  private store: Map<string, KVEntry>;
  private accessCount: Map<string, number>;
  private accessOrder: string[];
  private memoryUsage: number;
  private syncTimer?: NodeJS.Timeout;

  constructor(config: Partial<KVStoreConfig> = {}) {
    super();

    this.config = {
      persistent: config.persistent !== false,
      dataDir: config.dataDir || './data/kv',
      maxSize: config.maxSize || 10000,
      maxMemory: config.maxMemory || 100 * 1024 * 1024, // 100MB
      evictionPolicy: config.evictionPolicy || 'lru',
      syncInterval: config.syncInterval || 60000, // 1 minute
    };

    this.store = new Map();
    this.accessCount = new Map();
    this.accessOrder = [];
    this.memoryUsage = 0;

    this.initialize();
  }

  /**
   * Get a value by key
   */
  async get(key: string): Promise<any | null> {
    const entry = this.store.get(key);

    if (!entry) return null;

    // Check if expired
    if (this.isExpired(entry)) {
      await this.delete(key);
      return null;
    }

    // Update access tracking
    this.trackAccess(key);

    this.emit('get', { key, found: true });
    return entry.value;
  }

  /**
   * Set a value
   */
  async set(key: string, value: any, options?: { ttl?: number; tags?: string[] }): Promise<void> {
    // Check size limits
    if (this.store.size >= this.config.maxSize && !this.store.has(key)) {
      await this.evict();
    }

    const now = new Date();
    const entry: KVEntry = {
      key,
      value,
      metadata: {
        ttl: options?.ttl,
        expiresAt: options?.ttl ? new Date(now.getTime() + options.ttl * 1000) : undefined,
        createdAt: this.store.get(key)?.metadata?.createdAt || now,
        updatedAt: now,
        tags: options?.tags,
      },
    };

    // Calculate memory usage
    const entrySize = this.calculateSize(entry);

    // Check memory limits
    if (this.memoryUsage + entrySize > this.config.maxMemory && !this.store.has(key)) {
      await this.evict();
    }

    // Remove old entry memory
    if (this.store.has(key)) {
      const oldEntry = this.store.get(key)!;
      this.memoryUsage -= this.calculateSize(oldEntry);
    }

    // Add new entry
    this.store.set(key, entry);
    this.memoryUsage += entrySize;
    this.trackAccess(key);

    this.emit('set', { key, size: entrySize });
  }

  /**
   * Delete a key
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    // Update memory usage
    this.memoryUsage -= this.calculateSize(entry);

    // Remove from store
    this.store.delete(key);
    this.accessCount.delete(key);

    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }

    this.emit('delete', { key });
    return true;
  }

  /**
   * Check if key exists
   */
  async has(key: string): Promise<boolean> {
    const entry = this.store.get(key);
    if (!entry) return false;

    if (this.isExpired(entry)) {
      await this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * List keys with optional prefix
   */
  async list(options?: { prefix?: string; limit?: number; tags?: string[] }): Promise<string[]> {
    let keys = Array.from(this.store.keys());

    // Filter by prefix
    if (options?.prefix) {
      keys = keys.filter((k) => k.startsWith(options.prefix!));
    }

    // Filter by tags
    if (options?.tags) {
      keys = keys.filter((k) => {
        const entry = this.store.get(k);
        return entry?.metadata?.tags?.some((tag) => options.tags!.includes(tag));
      });
    }

    // Remove expired keys
    const validKeys: string[] = [];
    for (const key of keys) {
      const entry = this.store.get(key);
      if (entry && !this.isExpired(entry)) {
        validKeys.push(key);
      } else {
        await this.delete(key);
      }
    }

    // Apply limit
    if (options?.limit) {
      return validKeys.slice(0, options.limit);
    }

    return validKeys;
  }

  /**
   * Get multiple values
   */
  async getMany(keys: string[]): Promise<Record<string, any>> {
    const result: Record<string, any> = {};

    for (const key of keys) {
      const value = await this.get(key);
      if (value !== null) {
        result[key] = value;
      }
    }

    return result;
  }

  /**
   * Set multiple values
   */
  async setMany(entries: Array<{ key: string; value: any; options?: { ttl?: number } }>): Promise<void> {
    for (const entry of entries) {
      await this.set(entry.key, entry.value, entry.options);
    }
  }

  /**
   * Delete multiple keys
   */
  async deleteMany(keys: string[]): Promise<number> {
    let deleted = 0;
    for (const key of keys) {
      if (await this.delete(key)) {
        deleted++;
      }
    }
    return deleted;
  }

  /**
   * Clear all entries
   */
  async clear(): Promise<void> {
    this.store.clear();
    this.accessCount.clear();
    this.accessOrder = [];
    this.memoryUsage = 0;

    this.emit('clear');
  }

  /**
   * Get store statistics
   */
  getStats(): {
    size: number;
    memoryUsage: number;
    memoryUsageFormatted: string;
    maxSize: number;
    maxMemory: number;
    utilizationPercent: number;
  } {
    return {
      size: this.store.size,
      memoryUsage: this.memoryUsage,
      memoryUsageFormatted: this.formatBytes(this.memoryUsage),
      maxSize: this.config.maxSize,
      maxMemory: this.config.maxMemory,
      utilizationPercent: (this.memoryUsage / this.config.maxMemory) * 100,
    };
  }

  /**
   * Shutdown and cleanup
   */
  async shutdown(): Promise<void> {
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }

    if (this.config.persistent) {
      await this.syncToDisk();
    }

    this.emit('shutdown');
  }

  // Private methods

  private initialize(): void {
    // Create data directory
    if (this.config.persistent) {
      if (!fs.existsSync(this.config.dataDir)) {
        fs.mkdirSync(this.config.dataDir, { recursive: true });
      }

      // Load from disk
      this.loadFromDisk();

      // Start sync timer
      this.syncTimer = setInterval(() => {
        this.syncToDisk().catch((err) => {
          console.error('Failed to sync KV store to disk:', err);
        });
      }, this.config.syncInterval);
    }

    // Clean up expired entries periodically
    setInterval(() => {
      this.cleanupExpired().catch((err) => {
        console.error('Failed to cleanup expired entries:', err);
      });
    }, 60000); // Every minute
  }

  private trackAccess(key: string): void {
    // Update access count for LFU
    this.accessCount.set(key, (this.accessCount.get(key) || 0) + 1);

    // Update access order for LRU
    const index = this.accessOrder.indexOf(key);
    if (index > -1) {
      this.accessOrder.splice(index, 1);
    }
    this.accessOrder.push(key);
  }

  private async evict(): Promise<void> {
    if (this.store.size === 0) return;

    let keyToEvict: string | undefined;

    switch (this.config.evictionPolicy) {
      case 'lru':
        keyToEvict = this.accessOrder[0];
        break;
      case 'lfu':
        keyToEvict = this.getLFUKey();
        break;
      case 'fifo':
        keyToEvict = this.store.keys().next().value;
        break;
    }

    if (keyToEvict) {
      await this.delete(keyToEvict);
      this.emit('evict', { key: keyToEvict, policy: this.config.evictionPolicy });
    }
  }

  private getLFUKey(): string | undefined {
    let minCount = Infinity;
    let minKey: string | undefined;

    for (const [key, count] of this.accessCount.entries()) {
      if (count < minCount) {
        minCount = count;
        minKey = key;
      }
    }

    return minKey;
  }

  private isExpired(entry: KVEntry): boolean {
    if (!entry.metadata?.expiresAt) return false;
    return entry.metadata.expiresAt < new Date();
  }

  private async cleanupExpired(): Promise<void> {
    const expiredKeys: string[] = [];

    for (const [key, entry] of this.store.entries()) {
      if (this.isExpired(entry)) {
        expiredKeys.push(key);
      }
    }

    for (const key of expiredKeys) {
      await this.delete(key);
    }

    if (expiredKeys.length > 0) {
      this.emit('cleanup', { count: expiredKeys.length });
    }
  }

  private calculateSize(entry: KVEntry): number {
    // Rough estimate of memory usage
    const valueSize = JSON.stringify(entry.value).length;
    const keySize = entry.key.length;
    return keySize + valueSize + 100; // Add overhead
  }

  private formatBytes(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  private async syncToDisk(): Promise<void> {
    const data = {
      entries: Array.from(this.store.entries()),
      metadata: {
        timestamp: new Date().toISOString(),
        size: this.store.size,
      },
    };

    const filePath = path.join(this.config.dataDir, 'store.json');
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private loadFromDisk(): void {
    const filePath = path.join(this.config.dataDir, 'store.json');

    if (!fs.existsSync(filePath)) return;

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      for (const [key, entry] of data.entries) {
        // Convert date strings back to Date objects
        if (entry.metadata?.expiresAt) {
          entry.metadata.expiresAt = new Date(entry.metadata.expiresAt);
        }
        if (entry.metadata?.createdAt) {
          entry.metadata.createdAt = new Date(entry.metadata.createdAt);
        }
        if (entry.metadata?.updatedAt) {
          entry.metadata.updatedAt = new Date(entry.metadata.updatedAt);
        }

        // Skip expired entries
        if (this.isExpired(entry)) continue;

        this.store.set(key, entry);
        this.memoryUsage += this.calculateSize(entry);
      }
    } catch (error) {
      console.error('Failed to load KV store from disk:', error);
    }
  }
}

export default KVStore;
