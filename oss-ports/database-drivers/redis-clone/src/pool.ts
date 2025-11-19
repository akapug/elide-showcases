/**
 * Redis connection pool implementation
 */

import * as types from './types';
import { RedisClient } from './client';

interface PooledConnection {
  client: RedisClient;
  inUse: boolean;
  createdAt: number;
  lastUsed: number;
}

export class RedisConnectionPool {
  private options: types.PoolOptions;
  private pool: PooledConnection[] = [];
  private waitQueue: Array<{ resolve: Function; reject: Function; timeout: NodeJS.Timeout }> = [];
  private evictionTimer: NodeJS.Timeout | null = null;

  constructor(options: types.PoolOptions = {}) {
    this.options = {
      min: 2,
      max: 10,
      acquireTimeout: 30000,
      idleTimeout: 300000, // 5 minutes
      evictionInterval: 60000, // 1 minute
      ...options
    };

    this.initialize();
  }

  /**
   * Initialize pool with minimum connections
   */
  private async initialize(): Promise<void> {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < this.options.min!; i++) {
      promises.push(this.createConnection());
    }

    await Promise.all(promises);

    // Start eviction timer
    this.startEviction();
  }

  /**
   * Create a new connection
   */
  private async createConnection(): Promise<void> {
    const client = new RedisClient(this.options);
    await client.connect();

    this.pool.push({
      client,
      inUse: false,
      createdAt: Date.now(),
      lastUsed: Date.now()
    });
  }

  /**
   * Acquire connection from pool
   */
  async acquire(): Promise<RedisClient> {
    return new Promise<RedisClient>((resolve, reject) => {
      const timeout = setTimeout(() => {
        const index = this.waitQueue.findIndex(w => w.resolve === resolve);
        if (index !== -1) {
          this.waitQueue.splice(index, 1);
        }
        reject(new types.TimeoutError('Connection acquisition timeout'));
      }, this.options.acquireTimeout);

      this.waitQueue.push({ resolve, reject, timeout });
      this.processWaitQueue();
    });
  }

  /**
   * Process wait queue
   */
  private async processWaitQueue(): Promise<void> {
    while (this.waitQueue.length > 0) {
      // Find available connection
      const available = this.pool.find(conn => !conn.inUse);

      if (available) {
        const waiter = this.waitQueue.shift()!;
        clearTimeout(waiter.timeout);

        available.inUse = true;
        available.lastUsed = Date.now();

        waiter.resolve(available.client);
      } else if (this.pool.length < this.options.max!) {
        // Create new connection if under max
        try {
          await this.createConnection();
        } catch (error) {
          const waiter = this.waitQueue.shift()!;
          clearTimeout(waiter.timeout);
          waiter.reject(error);
        }
      } else {
        // No connections available and at max capacity
        break;
      }
    }
  }

  /**
   * Release connection back to pool
   */
  release(client: RedisClient): void {
    const connection = this.pool.find(conn => conn.client === client);

    if (connection) {
      connection.inUse = false;
      connection.lastUsed = Date.now();

      // Process any waiting requests
      this.processWaitQueue();
    }
  }

  /**
   * Execute function with pooled connection
   */
  async execute<T>(fn: (client: RedisClient) => Promise<T>): Promise<T> {
    const client = await this.acquire();

    try {
      return await fn(client);
    } finally {
      this.release(client);
    }
  }

  /**
   * Start connection eviction
   */
  private startEviction(): void {
    this.evictionTimer = setInterval(() => {
      this.evictIdleConnections();
    }, this.options.evictionInterval);
  }

  /**
   * Evict idle connections
   */
  private async evictIdleConnections(): Promise<void> {
    const now = Date.now();
    const toRemove: number[] = [];

    for (let i = 0; i < this.pool.length; i++) {
      const conn = this.pool[i];

      // Don't evict if in use or below minimum
      if (conn.inUse || this.pool.length - toRemove.length <= this.options.min!) {
        continue;
      }

      // Check if idle for too long
      if (now - conn.lastUsed > this.options.idleTimeout!) {
        toRemove.push(i);
      }
    }

    // Remove idle connections
    for (let i = toRemove.length - 1; i >= 0; i--) {
      const index = toRemove[i];
      const conn = this.pool[index];

      await conn.client.disconnect();
      this.pool.splice(index, 1);
    }
  }

  /**
   * Destroy all connections
   */
  async destroy(): Promise<void> {
    // Clear eviction timer
    if (this.evictionTimer) {
      clearInterval(this.evictionTimer);
      this.evictionTimer = null;
    }

    // Reject all waiting requests
    for (const waiter of this.waitQueue) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Pool destroyed'));
    }
    this.waitQueue = [];

    // Close all connections
    const promises: Promise<void>[] = [];
    for (const conn of this.pool) {
      promises.push(conn.client.disconnect());
    }

    await Promise.all(promises);
    this.pool = [];
  }

  /**
   * Get pool statistics
   */
  get stats(): {
    total: number;
    available: number;
    inUse: number;
    waiting: number;
  } {
    return {
      total: this.pool.length,
      available: this.pool.filter(c => !c.inUse).length,
      inUse: this.pool.filter(c => c.inUse).length,
      waiting: this.waitQueue.length
    };
  }
}
