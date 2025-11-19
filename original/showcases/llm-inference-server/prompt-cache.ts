/**
 * Prompt Cache - Intelligent Prompt Caching System
 *
 * Caches prompts and responses with LRU eviction, similarity-based matching,
 * and cache warming strategies for improved performance and cost reduction.
 */

export interface CachedPrompt {
  id: string;
  prompt: string;
  promptHash: string;
  model: string;
  response: any;
  embedding?: number[];
  temperature: number;
  createdAt: Date;
  lastAccessedAt: Date;
  accessCount: number;
  tokensSaved: number;
  costSaved: number;
}

export interface CacheStats {
  totalEntries: number;
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  tokensSaved: number;
  costSaved: number;
  cacheSize: number;
  maxCacheSize: number;
}

export interface CacheConfig {
  maxSize: number;
  ttlMs: number;
  enableSemanticSimilarity: boolean;
  similarityThreshold: number;
  enablePrefixMatching: boolean;
}

/**
 * Prompt Cache Manager
 */
export class PromptCache {
  private cache: Map<string, CachedPrompt> = new Map();
  private config: CacheConfig;
  private stats: CacheStats;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(config?: Partial<CacheConfig>) {
    this.config = {
      maxSize: config?.maxSize ?? 1000,
      ttlMs: config?.ttlMs ?? 3600000, // 1 hour default
      enableSemanticSimilarity: config?.enableSemanticSimilarity ?? false,
      similarityThreshold: config?.similarityThreshold ?? 0.95,
      enablePrefixMatching: config?.enablePrefixMatching ?? true,
    };

    this.stats = {
      totalEntries: 0,
      totalHits: 0,
      totalMisses: 0,
      hitRate: 0,
      tokensSaved: 0,
      costSaved: 0,
      cacheSize: 0,
      maxCacheSize: this.config.maxSize,
    };

    this.startCleanupInterval();
  }

  /**
   * Get cached response for a prompt
   */
  get(
    prompt: string,
    model: string,
    temperature: number = 0.7
  ): CachedPrompt | null {
    // Exact match with hash
    const hash = this.hashPrompt(prompt, model, temperature);
    let cached = this.cache.get(hash);

    if (cached) {
      this.updateCacheHit(cached);
      return cached;
    }

    // Try prefix matching for zero-temperature (deterministic) requests
    if (this.config.enablePrefixMatching && temperature === 0) {
      cached = this.findByPrefixMatch(prompt, model);
      if (cached) {
        this.updateCacheHit(cached);
        return cached;
      }
    }

    // Try semantic similarity matching
    if (this.config.enableSemanticSimilarity) {
      cached = this.findBySimilarity(prompt, model);
      if (cached) {
        this.updateCacheHit(cached);
        return cached;
      }
    }

    this.stats.totalMisses++;
    this.updateHitRate();
    return null;
  }

  /**
   * Store a prompt and its response in cache
   */
  set(
    prompt: string,
    model: string,
    response: any,
    temperature: number = 0.7,
    tokens: number = 0,
    cost: number = 0,
    embedding?: number[]
  ): void {
    const hash = this.hashPrompt(prompt, model, temperature);

    // Check if we need to evict
    if (this.cache.size >= this.config.maxSize && !this.cache.has(hash)) {
      this.evictLRU();
    }

    const cached: CachedPrompt = {
      id: this.generateId(),
      prompt,
      promptHash: hash,
      model,
      response,
      embedding,
      temperature,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 0,
      tokensSaved: tokens,
      costSaved: cost,
    };

    this.cache.set(hash, cached);
    this.stats.totalEntries = this.cache.size;
    this.stats.cacheSize = this.cache.size;
  }

  /**
   * Find cached prompt by prefix matching
   */
  private findByPrefixMatch(
    prompt: string,
    model: string
  ): CachedPrompt | null {
    for (const cached of this.cache.values()) {
      if (
        cached.model === model &&
        cached.temperature === 0 &&
        prompt.startsWith(cached.prompt.substring(0, 100))
      ) {
        return cached;
      }
    }
    return null;
  }

  /**
   * Find cached prompt by semantic similarity
   */
  private findBySimilarity(prompt: string, model: string): CachedPrompt | null {
    // This would require embedding generation
    // For now, return null (would integrate with embeddings engine)
    return null;
  }

  /**
   * Update cache hit statistics
   */
  private updateCacheHit(cached: CachedPrompt): void {
    cached.lastAccessedAt = new Date();
    cached.accessCount++;

    this.stats.totalHits++;
    this.stats.tokensSaved += cached.tokensSaved;
    this.stats.costSaved += cached.costSaved;
    this.updateHitRate();
  }

  /**
   * Evict least recently used entry
   */
  private evictLRU(): void {
    let oldestKey: string | null = null;
    let oldestTime = Date.now();

    for (const [key, cached] of this.cache.entries()) {
      const lastAccess = cached.lastAccessedAt.getTime();
      if (lastAccess < oldestTime) {
        oldestTime = lastAccess;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
    }
  }

  /**
   * Update hit rate statistics
   */
  private updateHitRate(): void {
    const total = this.stats.totalHits + this.stats.totalMisses;
    this.stats.hitRate = total > 0 ? (this.stats.totalHits / total) * 100 : 0;
  }

  /**
   * Hash a prompt for caching
   */
  private hashPrompt(prompt: string, model: string, temperature: number): string {
    const str = `${model}:${temperature}:${prompt}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  /**
   * Clear expired entries
   */
  private cleanup(): void {
    const now = Date.now();
    const expired: string[] = [];

    for (const [key, cached] of this.cache.entries()) {
      const age = now - cached.lastAccessedAt.getTime();
      if (age > this.config.ttlMs) {
        expired.push(key);
      }
    }

    for (const key of expired) {
      this.cache.delete(key);
    }

    this.stats.cacheSize = this.cache.size;
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60000); // Every minute
  }

  /**
   * Stop cleanup interval
   */
  stopCleanupInterval(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    return { ...this.stats };
  }

  /**
   * Clear all cache
   */
  clear(): void {
    this.cache.clear();
    this.stats.totalEntries = 0;
    this.stats.cacheSize = 0;
  }

  /**
   * Warm cache with common prompts
   */
  warmCache(prompts: Array<{ prompt: string; model: string; response: any }>): void {
    for (const item of prompts) {
      this.set(item.prompt, item.model, item.response);
    }
  }

  /**
   * Get cache entries (for analysis)
   */
  getEntries(limit: number = 100): CachedPrompt[] {
    return Array.from(this.cache.values())
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Get most accessed prompts
   */
  getPopularPrompts(limit: number = 10): CachedPrompt[] {
    return Array.from(this.cache.values())
      .filter((c) => c.accessCount > 0)
      .sort((a, b) => b.accessCount - a.accessCount)
      .slice(0, limit);
  }

  /**
   * Estimate cache efficiency
   */
  getCacheEfficiency(): {
    hitRate: number;
    avgTokensSavedPerHit: number;
    avgCostSavedPerHit: number;
    projectedMonthlySavings: number;
  } {
    const avgTokensSavedPerHit =
      this.stats.totalHits > 0 ? this.stats.tokensSaved / this.stats.totalHits : 0;
    const avgCostSavedPerHit =
      this.stats.totalHits > 0 ? this.stats.costSaved / this.stats.totalHits : 0;

    // Project monthly savings (assuming current hit rate continues)
    const totalRequests = this.stats.totalHits + this.stats.totalMisses;
    const dailyRequests = totalRequests; // Simplified assumption
    const monthlyRequests = dailyRequests * 30;
    const projectedHits = monthlyRequests * (this.stats.hitRate / 100);
    const projectedMonthlySavings = projectedHits * avgCostSavedPerHit;

    return {
      hitRate: this.stats.hitRate,
      avgTokensSavedPerHit,
      avgCostSavedPerHit,
      projectedMonthlySavings,
    };
  }

  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}

/**
 * Distributed Cache Manager (for multi-instance deployments)
 */
export class DistributedPromptCache {
  private localCache: PromptCache;
  private remoteCache: Map<string, CachedPrompt> = new Map(); // Simulated

  constructor(config?: Partial<CacheConfig>) {
    this.localCache = new PromptCache(config);
  }

  /**
   * Get with L1 (local) -> L2 (remote) fallback
   */
  async get(
    prompt: string,
    model: string,
    temperature: number = 0.7
  ): Promise<CachedPrompt | null> {
    // Try L1 cache first
    let cached = this.localCache.get(prompt, model, temperature);
    if (cached) {
      return cached;
    }

    // Try L2 cache (remote)
    const hash = this.hashPrompt(prompt, model, temperature);
    cached = this.remoteCache.get(hash);

    if (cached) {
      // Promote to L1 cache
      this.localCache.set(
        prompt,
        model,
        cached.response,
        temperature,
        cached.tokensSaved,
        cached.costSaved
      );
      return cached;
    }

    return null;
  }

  /**
   * Set in both L1 and L2 caches
   */
  async set(
    prompt: string,
    model: string,
    response: any,
    temperature: number = 0.7,
    tokens: number = 0,
    cost: number = 0
  ): Promise<void> {
    // Set in L1
    this.localCache.set(prompt, model, response, temperature, tokens, cost);

    // Set in L2 (simulated - in production would use Redis/Memcached)
    const hash = this.hashPrompt(prompt, model, temperature);
    this.remoteCache.set(hash, {
      id: this.generateId(),
      prompt,
      promptHash: hash,
      model,
      response,
      temperature,
      createdAt: new Date(),
      lastAccessedAt: new Date(),
      accessCount: 0,
      tokensSaved: tokens,
      costSaved: cost,
    });
  }

  getStats(): CacheStats {
    return this.localCache.getStats();
  }

  private hashPrompt(prompt: string, model: string, temperature: number): string {
    const str = `${model}:${temperature}:${prompt}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }

  private generateId(): string {
    return `cache_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
