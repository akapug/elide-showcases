/**
 * Buffer Pool - Zero-Copy Memory Management
 *
 * Manages a pool of reusable buffers for image/video processing.
 * Implements zero-copy buffer sharing between TypeScript and Python.
 *
 * Features:
 * - Pre-allocated buffer pool
 * - Automatic buffer recycling
 * - Memory usage tracking
 * - Thread-safe buffer acquisition
 *
 * @module shared/buffer-pool
 */

interface BufferEntry {
  buffer: Buffer;
  inUse: boolean;
  size: number;
  allocatedAt: number;
  lastUsedAt: number;
  useCount: number;
}

interface BufferPoolStats {
  totalBuffers: number;
  availableBuffers: number;
  buffersInUse: number;
  totalMemory: number;
  usedMemory: number;
  hits: number;
  misses: number;
  hitRate: number;
}

/**
 * Buffer Pool for zero-copy image processing
 */
export class BufferPool {
  private static instance: BufferPool;
  private buffers: Map<string, BufferEntry>;
  private maxBuffers: number;
  private maxMemory: number;
  private defaultBufferSize: number;
  private stats: {
    hits: number;
    misses: number;
    allocations: number;
    deallocations: number;
  };

  private constructor() {
    this.buffers = new Map();
    this.maxBuffers = parseInt(process.env.BUFFER_POOL_SIZE || '100', 10);
    this.maxMemory = parseInt(process.env.BUFFER_POOL_MAX_MEMORY || '536870912', 10); // 512MB default
    this.defaultBufferSize = parseInt(process.env.BUFFER_DEFAULT_SIZE || '8294400', 10); // 8MB default (typical 4K image)
    this.stats = {
      hits: 0,
      misses: 0,
      allocations: 0,
      deallocations: 0,
    };

    // Pre-allocate some buffers
    this.preallocate(10);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): BufferPool {
    if (!BufferPool.instance) {
      BufferPool.instance = new BufferPool();
    }
    return BufferPool.instance;
  }

  /**
   * Pre-allocate buffers
   */
  private preallocate(count: number): void {
    for (let i = 0; i < count; i++) {
      const id = this.generateBufferId();
      const buffer = Buffer.allocUnsafe(this.defaultBufferSize);

      this.buffers.set(id, {
        buffer,
        inUse: false,
        size: this.defaultBufferSize,
        allocatedAt: Date.now(),
        lastUsedAt: Date.now(),
        useCount: 0,
      });
    }
  }

  /**
   * Generate unique buffer ID
   */
  private generateBufferId(): string {
    return `buf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current memory usage
   */
  private getCurrentMemoryUsage(): number {
    let total = 0;
    for (const entry of this.buffers.values()) {
      total += entry.size;
    }
    return total;
  }

  /**
   * Acquire a buffer from the pool
   */
  public acquire(size: number): { id: string; buffer: Buffer; reused: boolean } {
    // Try to find an available buffer of sufficient size
    for (const [id, entry] of this.buffers.entries()) {
      if (!entry.inUse && entry.size >= size) {
        entry.inUse = true;
        entry.lastUsedAt = Date.now();
        entry.useCount++;
        this.stats.hits++;

        return {
          id,
          buffer: entry.buffer.slice(0, size),
          reused: true,
        };
      }
    }

    // No suitable buffer found - allocate new one if possible
    this.stats.misses++;

    const currentMemory = this.getCurrentMemoryUsage();
    const canAllocate =
      this.buffers.size < this.maxBuffers &&
      currentMemory + size <= this.maxMemory;

    if (!canAllocate) {
      // Try to evict least recently used buffer
      this.evictLRU();
    }

    // Allocate new buffer
    const id = this.generateBufferId();
    const buffer = Buffer.allocUnsafe(size);

    this.buffers.set(id, {
      buffer,
      inUse: true,
      size,
      allocatedAt: Date.now(),
      lastUsedAt: Date.now(),
      useCount: 1,
    });

    this.stats.allocations++;

    return {
      id,
      buffer,
      reused: false,
    };
  }

  /**
   * Release a buffer back to the pool
   */
  public release(id: string): boolean {
    const entry = this.buffers.get(id);
    if (!entry) {
      return false;
    }

    entry.inUse = false;
    entry.lastUsedAt = Date.now();

    return true;
  }

  /**
   * Evict least recently used buffer
   */
  private evictLRU(): void {
    let oldestId: string | null = null;
    let oldestTime = Infinity;

    for (const [id, entry] of this.buffers.entries()) {
      if (!entry.inUse && entry.lastUsedAt < oldestTime) {
        oldestTime = entry.lastUsedAt;
        oldestId = id;
      }
    }

    if (oldestId) {
      this.buffers.delete(oldestId);
      this.stats.deallocations++;
    }
  }

  /**
   * Get buffer pool statistics
   */
  public getStats(): BufferPoolStats {
    let totalMemory = 0;
    let usedMemory = 0;
    let buffersInUse = 0;

    for (const entry of this.buffers.values()) {
      totalMemory += entry.size;
      if (entry.inUse) {
        usedMemory += entry.size;
        buffersInUse++;
      }
    }

    const totalRequests = this.stats.hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0;

    return {
      totalBuffers: this.buffers.size,
      availableBuffers: this.buffers.size - buffersInUse,
      buffersInUse,
      totalMemory,
      usedMemory,
      hits: this.stats.hits,
      misses: this.stats.misses,
      hitRate,
    };
  }

  /**
   * Clear all buffers
   */
  public cleanup(): void {
    for (const [id, entry] of this.buffers.entries()) {
      if (!entry.inUse) {
        this.buffers.delete(id);
      }
    }
  }

  /**
   * Get buffer by ID
   */
  public getBuffer(id: string): Buffer | null {
    const entry = this.buffers.get(id);
    return entry ? entry.buffer : null;
  }

  /**
   * Get total buffer count
   */
  public size(): number {
    return this.buffers.size;
  }

  /**
   * Reset statistics
   */
  public resetStats(): void {
    this.stats = {
      hits: 0,
      misses: 0,
      allocations: 0,
      deallocations: 0,
    };
  }

  /**
   * Shrink pool to target size
   */
  public shrink(targetSize: number): number {
    let removed = 0;

    // Sort by last used time
    const entries = Array.from(this.buffers.entries())
      .filter(([_, entry]) => !entry.inUse)
      .sort(([_, a], [__, b]) => a.lastUsedAt - b.lastUsedAt);

    while (this.buffers.size > targetSize && removed < entries.length) {
      const [id] = entries[removed];
      this.buffers.delete(id);
      removed++;
      this.stats.deallocations++;
    }

    return removed;
  }

  /**
   * Get detailed buffer information
   */
  public getBufferInfo(id: string): BufferEntry | null {
    return this.buffers.get(id) || null;
  }

  /**
   * Get all buffer IDs
   */
  public getBufferIds(): string[] {
    return Array.from(this.buffers.keys());
  }

  /**
   * Check if buffer exists
   */
  public hasBuffer(id: string): boolean {
    return this.buffers.has(id);
  }
}
