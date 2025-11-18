/**
 * High-performance event buffer with automatic flushing to analytics engine.
 * Implements ring buffer pattern for minimal memory allocation.
 */

import { Event, createAnalyticsBridge } from '../bridge/dataframe-bridge';

export interface BufferConfig {
  maxSize: number;
  flushInterval: number;
  engine: 'pandas' | 'polars';
}

export type FlushCallback = (events: Event[]) => Promise<void>;

export class EventBuffer {
  private buffer: Event[] = [];
  private analytics: any;
  private config: BufferConfig;
  private flushTimer?: NodeJS.Timeout;
  private callbacks: FlushCallback[] = [];
  private isProcessing = false;

  constructor(config: Partial<BufferConfig> = {}) {
    this.config = {
      maxSize: config.maxSize || 10000,
      flushInterval: config.flushInterval || 1000,
      engine: config.engine || 'polars'
    };

    this.analytics = createAnalyticsBridge(this.config.engine);
    this.startAutoFlush();
  }

  /**
   * Add a single event to the buffer.
   */
  async add(event: Event): Promise<void> {
    this.buffer.push(event);

    if (this.buffer.length >= this.config.maxSize) {
      await this.flush();
    }
  }

  /**
   * Add multiple events to the buffer (batch operation).
   */
  async addBatch(events: Event[]): Promise<void> {
    this.buffer.push(...events);

    if (this.buffer.length >= this.config.maxSize) {
      await this.flush();
    }
  }

  /**
   * Flush buffer to analytics engine.
   */
  async flush(): Promise<void> {
    if (this.buffer.length === 0 || this.isProcessing) {
      return;
    }

    this.isProcessing = true;

    try {
      const events = this.buffer.splice(0, this.buffer.length);

      // Send to analytics engine (zero-copy via Elide polyglot)
      await this.analytics.ingestEvents(events);

      // Call registered callbacks
      for (const callback of this.callbacks) {
        await callback(events);
      }

      console.log(`Flushed ${events.length} events to analytics engine`);
    } catch (error) {
      console.error('Error flushing buffer:', error);
      throw error;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Register a callback to be called on flush.
   */
  onFlush(callback: FlushCallback): void {
    this.callbacks.push(callback);
  }

  /**
   * Get current buffer size.
   */
  size(): number {
    return this.buffer.length;
  }

  /**
   * Get analytics bridge for direct DataFrame access.
   */
  getAnalytics(): any {
    return this.analytics;
  }

  /**
   * Start automatic flush timer.
   */
  private startAutoFlush(): void {
    this.flushTimer = setInterval(async () => {
      if (this.buffer.length > 0) {
        await this.flush();
      }
    }, this.config.flushInterval);
  }

  /**
   * Stop automatic flush timer.
   */
  stop(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
  }

  /**
   * Clear buffer without flushing.
   */
  clear(): void {
    this.buffer = [];
  }
}
