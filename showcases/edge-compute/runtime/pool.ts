/**
 * Runtime Pool - Manages a pool of function executors
 *
 * Provides connection pooling, load balancing, and resource management.
 */

import FunctionExecutor, { ExecutionRequest, ExecutionResult } from './executor';
import { EventEmitter } from 'events';

export interface PoolConfig {
  minSize: number;
  maxSize: number;
  idleTimeout: number; // milliseconds
  maxQueueSize: number;
}

export interface PoolStats {
  total: number;
  active: number;
  idle: number;
  waiting: number;
  executed: number;
  failed: number;
  averageExecutionTime: number;
}

interface QueuedRequest {
  request: ExecutionRequest;
  resolve: (result: ExecutionResult) => void;
  reject: (error: Error) => void;
  queuedAt: Date;
}

export class RuntimePool extends EventEmitter {
  private config: PoolConfig;
  private executors: FunctionExecutor[];
  private activeExecutors: Set<FunctionExecutor>;
  private idleExecutors: FunctionExecutor[];
  private queue: QueuedRequest[];
  private stats: {
    executed: number;
    failed: number;
    totalExecutionTime: number;
  };

  constructor(
    private storageDir: string,
    config: Partial<PoolConfig> = {}
  ) {
    super();

    this.config = {
      minSize: config.minSize || 2,
      maxSize: config.maxSize || 10,
      idleTimeout: config.idleTimeout || 60000,
      maxQueueSize: config.maxQueueSize || 100,
    };

    this.executors = [];
    this.activeExecutors = new Set();
    this.idleExecutors = [];
    this.queue = [];
    this.stats = {
      executed: 0,
      failed: 0,
      totalExecutionTime: 0,
    };

    this.initialize();
  }

  /**
   * Execute a function using the pool
   */
  async execute(request: ExecutionRequest): Promise<ExecutionResult> {
    // Get an available executor
    const executor = await this.acquire();

    const startTime = Date.now();

    try {
      const result = await executor.execute(request);

      // Update stats
      this.stats.executed++;
      this.stats.totalExecutionTime += Date.now() - startTime;

      return result;
    } catch (error) {
      this.stats.failed++;
      throw error;
    } finally {
      // Release executor back to pool
      this.release(executor);
    }
  }

  /**
   * Get pool statistics
   */
  getStats(): PoolStats {
    return {
      total: this.executors.length,
      active: this.activeExecutors.size,
      idle: this.idleExecutors.length,
      waiting: this.queue.length,
      executed: this.stats.executed,
      failed: this.stats.failed,
      averageExecutionTime:
        this.stats.executed > 0
          ? this.stats.totalExecutionTime / this.stats.executed
          : 0,
    };
  }

  /**
   * Shutdown the pool
   */
  async shutdown(): Promise<void> {
    // Clear queue
    for (const queued of this.queue) {
      queued.reject(new Error('Pool is shutting down'));
    }
    this.queue = [];

    // Wait for active executions to complete (with timeout)
    const timeout = 10000;
    const start = Date.now();

    while (this.activeExecutors.size > 0 && Date.now() - start < timeout) {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Clear all executors
    this.executors = [];
    this.idleExecutors = [];
    this.activeExecutors.clear();

    this.emit('shutdown');
  }

  // Private methods

  private initialize(): void {
    // Create minimum number of executors
    for (let i = 0; i < this.config.minSize; i++) {
      const executor = new FunctionExecutor(this.storageDir);
      this.executors.push(executor);
      this.idleExecutors.push(executor);
    }
  }

  private async acquire(): Promise<FunctionExecutor> {
    // Try to get an idle executor
    if (this.idleExecutors.length > 0) {
      const executor = this.idleExecutors.pop()!;
      this.activeExecutors.add(executor);
      return executor;
    }

    // Try to create a new executor if under max size
    if (this.executors.length < this.config.maxSize) {
      const executor = new FunctionExecutor(this.storageDir);
      this.executors.push(executor);
      this.activeExecutors.add(executor);
      return executor;
    }

    // Queue the request
    if (this.queue.length >= this.config.maxQueueSize) {
      throw new Error('Pool queue is full');
    }

    return new Promise((resolve, reject) => {
      this.queue.push({
        request: {} as ExecutionRequest, // Not used for acquisition
        resolve: resolve as any,
        reject,
        queuedAt: new Date(),
      });
    });
  }

  private release(executor: FunctionExecutor): void {
    this.activeExecutors.delete(executor);

    // Check if there are queued requests
    if (this.queue.length > 0) {
      const queued = this.queue.shift()!;
      this.activeExecutors.add(executor);
      queued.resolve(executor as any);
    } else {
      this.idleExecutors.push(executor);
    }

    // Trim pool if too many idle executors
    this.trimPool();
  }

  private trimPool(): void {
    const excess = this.executors.length - this.config.minSize;
    if (excess > 0 && this.idleExecutors.length > this.config.minSize) {
      const toRemove = Math.min(excess, this.idleExecutors.length - this.config.minSize);

      for (let i = 0; i < toRemove; i++) {
        const executor = this.idleExecutors.pop();
        if (executor) {
          const index = this.executors.indexOf(executor);
          if (index > -1) {
            this.executors.splice(index, 1);
          }
        }
      }
    }
  }
}

export default RuntimePool;
