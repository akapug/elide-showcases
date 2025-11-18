/**
 * Event buffering and batching for efficient anomaly detection.
 * Accumulates events and processes them in batches.
 */

export interface Event {
  id: string;
  timestamp: number;
  features: number[];
  metadata?: Record<string, any>;
}

export interface BufferStats {
  size: number;
  capacity: number;
  utilization: number;
  oldestEvent: number | null;
  newestEvent: number | null;
  flushCount: number;
}

export class EventBuffer {
  private buffer: Event[] = [];
  private capacity: number;
  private flushCount = 0;
  private autoFlushEnabled: boolean;
  private flushInterval: number;
  private flushTimer?: NodeJS.Timeout;

  constructor(
    capacity: number = 1000,
    autoFlush: boolean = false,
    flushInterval: number = 5000
  ) {
    this.capacity = capacity;
    this.autoFlushEnabled = autoFlush;
    this.flushInterval = flushInterval;

    if (this.autoFlushEnabled) {
      this.startAutoFlush();
    }
  }

  /**
   * Add an event to the buffer.
   */
  push(event: Event): boolean {
    if (this.buffer.length >= this.capacity) {
      // Buffer full - remove oldest event
      this.buffer.shift();
    }

    this.buffer.push(event);
    return true;
  }

  /**
   * Add multiple events to the buffer.
   */
  pushBatch(events: Event[]): number {
    let added = 0;
    for (const event of events) {
      if (this.push(event)) {
        added++;
      }
    }
    return added;
  }

  /**
   * Get all events and clear the buffer.
   */
  flush(): Event[] {
    const events = [...this.buffer];
    this.buffer = [];
    this.flushCount++;
    return events;
  }

  /**
   * Get events without clearing the buffer.
   */
  peek(count?: number): Event[] {
    if (count === undefined) {
      return [...this.buffer];
    }
    return this.buffer.slice(-count);
  }

  /**
   * Get recent events within a time window.
   */
  getRecent(windowMs: number): Event[] {
    const cutoff = Date.now() - windowMs;
    return this.buffer.filter(e => e.timestamp >= cutoff);
  }

  /**
   * Extract features from buffered events.
   */
  extractFeatures(): number[][] {
    return this.buffer.map(e => e.features);
  }

  /**
   * Get buffer statistics.
   */
  getStats(): BufferStats {
    const timestamps = this.buffer.map(e => e.timestamp);

    return {
      size: this.buffer.length,
      capacity: this.capacity,
      utilization: this.buffer.length / this.capacity,
      oldestEvent: timestamps.length > 0 ? Math.min(...timestamps) : null,
      newestEvent: timestamps.length > 0 ? Math.max(...timestamps) : null,
      flushCount: this.flushCount
    };
  }

  /**
   * Clear the buffer.
   */
  clear(): void {
    this.buffer = [];
  }

  /**
   * Check if buffer is empty.
   */
  isEmpty(): boolean {
    return this.buffer.length === 0;
  }

  /**
   * Check if buffer is full.
   */
  isFull(): boolean {
    return this.buffer.length >= this.capacity;
  }

  /**
   * Start auto-flush timer.
   */
  private startAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }

    this.flushTimer = setInterval(() => {
      if (!this.isEmpty()) {
        this.flush();
      }
    }, this.flushInterval);
  }

  /**
   * Stop auto-flush timer.
   */
  stopAutoFlush(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  /**
   * Destroy the buffer and clean up resources.
   */
  destroy(): void {
    this.stopAutoFlush();
    this.clear();
  }
}

/**
 * Sliding window buffer for time-series data.
 */
export class SlidingWindowBuffer {
  private values: number[] = [];
  private timestamps: number[] = [];
  private windowSize: number;

  constructor(windowSize: number = 50) {
    this.windowSize = windowSize;
  }

  /**
   * Add a value to the window.
   */
  push(value: number, timestamp: number = Date.now()): void {
    this.values.push(value);
    this.timestamps.push(timestamp);

    // Remove old values
    while (this.values.length > this.windowSize) {
      this.values.shift();
      this.timestamps.shift();
    }
  }

  /**
   * Get all values in the window.
   */
  getValues(): number[] {
    return [...this.values];
  }

  /**
   * Get all timestamps in the window.
   */
  getTimestamps(): number[] {
    return [...this.timestamps];
  }

  /**
   * Calculate statistics over the window.
   */
  getStats(): {
    mean: number;
    std: number;
    min: number;
    max: number;
    median: number;
    count: number;
  } {
    if (this.values.length === 0) {
      return { mean: 0, std: 0, min: 0, max: 0, median: 0, count: 0 };
    }

    const sorted = [...this.values].sort((a, b) => a - b);
    const mean = this.values.reduce((a, b) => a + b, 0) / this.values.length;
    const variance = this.values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / this.values.length;
    const std = Math.sqrt(variance);

    return {
      mean,
      std,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      median: sorted[Math.floor(sorted.length / 2)],
      count: this.values.length
    };
  }

  /**
   * Clear the window.
   */
  clear(): void {
    this.values = [];
    this.timestamps = [];
  }

  /**
   * Check if window is full.
   */
  isFull(): boolean {
    return this.values.length >= this.windowSize;
  }

  /**
   * Get current size.
   */
  size(): number {
    return this.values.length;
  }
}
