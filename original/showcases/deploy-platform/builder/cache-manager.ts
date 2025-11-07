/**
 * Deploy Platform - Cache Manager
 *
 * Manages build cache, dependency cache, and asset caching.
 * Implements LRU eviction and efficient storage.
 */

import { createHash } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface CacheEntry {
  key: string;
  path: string;
  size: number;
  hits: number;
  lastAccessed: Date;
  createdAt: Date;
  metadata: Record<string, any>;
}

interface CacheStats {
  totalEntries: number;
  totalSize: number;
  hitRate: number;
  totalHits: number;
  totalMisses: number;
  oldestEntry?: Date;
  newestEntry?: Date;
}

interface CacheOptions {
  maxSize?: number; // in bytes
  maxAge?: number; // in milliseconds
  ttl?: number; // time to live in milliseconds
}

/**
 * Cache Manager
 */
export class CacheManager {
  private cacheDir: string;
  private entries: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private maxAge: number;
  private totalHits: number = 0;
  private totalMisses: number = 0;

  constructor(cacheDir: string, options: CacheOptions = {}) {
    this.cacheDir = cacheDir;
    this.maxSize = options.maxSize || 10 * 1024 * 1024 * 1024; // 10 GB
    this.maxAge = options.maxAge || 7 * 24 * 60 * 60 * 1000; // 7 days

    this.ensureCacheDir();
    this.loadCacheIndex();
  }

  /**
   * Get from cache
   */
  async get(key: string): Promise<string | null> {
    const entry = this.entries.get(key);

    if (!entry) {
      this.totalMisses++;
      return null;
    }

    // Check if expired
    if (this.isExpired(entry)) {
      await this.delete(key);
      this.totalMisses++;
      return null;
    }

    // Update access stats
    entry.hits++;
    entry.lastAccessed = new Date();
    this.totalHits++;

    return entry.path;
  }

  /**
   * Set cache entry
   */
  async set(key: string, sourcePath: string, metadata: Record<string, any> = {}): Promise<void> {
    const cachePath = path.join(this.cacheDir, key);
    const size = this.getDirectorySize(sourcePath);

    // Check if we need to evict entries
    await this.ensureSpace(size);

    // Copy to cache (mock implementation)
    if (!fs.existsSync(cachePath)) {
      fs.mkdirSync(cachePath, { recursive: true });
    }

    const entry: CacheEntry = {
      key,
      path: cachePath,
      size,
      hits: 0,
      lastAccessed: new Date(),
      createdAt: new Date(),
      metadata
    };

    this.entries.set(key, entry);
    await this.saveCacheIndex();
  }

  /**
   * Delete cache entry
   */
  async delete(key: string): Promise<boolean> {
    const entry = this.entries.get(key);

    if (!entry) {
      return false;
    }

    // Delete from disk
    try {
      if (fs.existsSync(entry.path)) {
        fs.rmSync(entry.path, { recursive: true, force: true });
      }
    } catch (error) {
      console.error(`Failed to delete cache entry: ${error}`);
    }

    this.entries.delete(key);
    await this.saveCacheIndex();

    return true;
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.entries.get(key);
    return entry ? !this.isExpired(entry) : false;
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    for (const key of this.entries.keys()) {
      await this.delete(key);
    }

    this.entries.clear();
    this.totalHits = 0;
    this.totalMisses = 0;

    await this.saveCacheIndex();
  }

  /**
   * Prune expired entries
   */
  async prune(): Promise<number> {
    let pruned = 0;

    for (const [key, entry] of this.entries) {
      if (this.isExpired(entry)) {
        await this.delete(key);
        pruned++;
      }
    }

    return pruned;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const entries = Array.from(this.entries.values());
    const totalSize = entries.reduce((sum, e) => sum + e.size, 0);
    const totalRequests = this.totalHits + this.totalMisses;
    const hitRate = totalRequests > 0 ? this.totalHits / totalRequests : 0;

    let oldestEntry: Date | undefined;
    let newestEntry: Date | undefined;

    if (entries.length > 0) {
      oldestEntry = entries.reduce((oldest, e) =>
        e.createdAt < oldest ? e.createdAt : oldest,
        entries[0].createdAt
      );

      newestEntry = entries.reduce((newest, e) =>
        e.createdAt > newest ? e.createdAt : newest,
        entries[0].createdAt
      );
    }

    return {
      totalEntries: entries.length,
      totalSize,
      hitRate,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      oldestEntry,
      newestEntry
    };
  }

  /**
   * Get top entries by hits
   */
  getTopEntries(limit: number = 10): CacheEntry[] {
    return Array.from(this.entries.values())
      .sort((a, b) => b.hits - a.hits)
      .slice(0, limit);
  }

  /**
   * Ensure cache directory exists
   */
  private ensureCacheDir(): void {
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Load cache index from disk
   */
  private loadCacheIndex(): void {
    const indexPath = path.join(this.cacheDir, 'index.json');

    if (fs.existsSync(indexPath)) {
      try {
        const data = JSON.parse(fs.readFileSync(indexPath, 'utf-8'));

        for (const entry of data.entries) {
          entry.lastAccessed = new Date(entry.lastAccessed);
          entry.createdAt = new Date(entry.createdAt);
          this.entries.set(entry.key, entry);
        }

        this.totalHits = data.totalHits || 0;
        this.totalMisses = data.totalMisses || 0;
      } catch (error) {
        console.error('Failed to load cache index:', error);
      }
    }
  }

  /**
   * Save cache index to disk
   */
  private async saveCacheIndex(): Promise<void> {
    const indexPath = path.join(this.cacheDir, 'index.json');

    const data = {
      version: 1,
      totalHits: this.totalHits,
      totalMisses: this.totalMisses,
      entries: Array.from(this.entries.values())
    };

    try {
      fs.writeFileSync(indexPath, JSON.stringify(data, null, 2));
    } catch (error) {
      console.error('Failed to save cache index:', error);
    }
  }

  /**
   * Check if entry is expired
   */
  private isExpired(entry: CacheEntry): boolean {
    const age = Date.now() - entry.createdAt.getTime();
    return age > this.maxAge;
  }

  /**
   * Ensure space in cache
   */
  private async ensureSpace(requiredSize: number): Promise<void> {
    const stats = this.getStats();
    const currentSize = stats.totalSize;

    if (currentSize + requiredSize <= this.maxSize) {
      return;
    }

    // LRU eviction
    const entries = Array.from(this.entries.values())
      .sort((a, b) => a.lastAccessed.getTime() - b.lastAccessed.getTime());

    let freedSize = 0;

    for (const entry of entries) {
      if (currentSize - freedSize + requiredSize <= this.maxSize) {
        break;
      }

      await this.delete(entry.key);
      freedSize += entry.size;
    }
  }

  /**
   * Get directory size
   */
  private getDirectorySize(dirPath: string): number {
    // Mock implementation
    return 1024 * 1024; // 1 MB
  }

  /**
   * Generate cache key
   */
  static generateKey(components: string[]): string {
    return createHash('sha256')
      .update(components.join(':'))
      .digest('hex')
      .substring(0, 16);
  }
}

/**
 * Dependency Cache
 */
export class DependencyCache extends CacheManager {
  constructor(cacheDir: string) {
    super(path.join(cacheDir, 'dependencies'), {
      maxSize: 5 * 1024 * 1024 * 1024, // 5 GB
      maxAge: 14 * 24 * 60 * 60 * 1000 // 14 days
    });
  }

  /**
   * Get cache key for dependencies
   */
  getDependenciesKey(packageManager: string, lockfileHash: string): string {
    return CacheManager.generateKey([packageManager, lockfileHash]);
  }

  /**
   * Cache node_modules
   */
  async cacheNodeModules(projectPath: string, lockfileHash: string): Promise<void> {
    const key = this.getDependenciesKey('npm', lockfileHash);
    const nodeModulesPath = path.join(projectPath, 'node_modules');

    if (fs.existsSync(nodeModulesPath)) {
      await this.set(key, nodeModulesPath, {
        packageManager: 'npm',
        lockfileHash
      });
    }
  }

  /**
   * Restore node_modules
   */
  async restoreNodeModules(projectPath: string, lockfileHash: string): Promise<boolean> {
    const key = this.getDependenciesKey('npm', lockfileHash);
    const cachedPath = await this.get(key);

    if (!cachedPath) {
      return false;
    }

    // In real implementation, restore files here
    return true;
  }
}

/**
 * Asset Cache
 */
export class AssetCache extends CacheManager {
  constructor(cacheDir: string) {
    super(path.join(cacheDir, 'assets'), {
      maxSize: 20 * 1024 * 1024 * 1024, // 20 GB
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
  }

  /**
   * Cache static assets
   */
  async cacheAssets(deploymentId: string, assetsPath: string): Promise<void> {
    await this.set(deploymentId, assetsPath, {
      type: 'static-assets'
    });
  }

  /**
   * Get cached assets
   */
  async getAssets(deploymentId: string): Promise<string | null> {
    return this.get(deploymentId);
  }
}

// Export singleton instances
export const dependencyCache = new DependencyCache(
  process.env.CACHE_DIR || '/tmp/deploy-platform/cache'
);

export const assetCache = new AssetCache(
  process.env.CACHE_DIR || '/tmp/deploy-platform/cache'
);
