/**
 * Performance Monitor
 *
 * Tracks and reports performance metrics for NLP operations
 */
export class PerformanceMonitor {
  private metrics: Map<string, Metric[]>;
  private maxHistorySize: number;

  constructor(maxHistorySize: number = 1000) {
    this.metrics = new Map();
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Record a metric
   */
  record(operation: string, duration: number, metadata?: Record<string, any>): void {
    if (!this.metrics.has(operation)) {
      this.metrics.set(operation, []);
    }

    const metrics = this.metrics.get(operation)!;
    metrics.push({
      duration,
      timestamp: Date.now(),
      metadata,
    });

    // Keep only recent metrics
    if (metrics.length > this.maxHistorySize) {
      metrics.shift();
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): OperationStats | null {
    const metrics = this.metrics.get(operation);

    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map((m) => m.duration);
    const sorted = [...durations].sort((a, b) => a - b);

    return {
      count: metrics.length,
      avg: durations.reduce((a, b) => a + b, 0) / durations.length,
      min: Math.min(...durations),
      max: Math.max(...durations),
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }

  /**
   * Get all statistics
   */
  getAllStats(): Record<string, OperationStats> {
    const stats: Record<string, OperationStats> = {};

    for (const operation of this.metrics.keys()) {
      const opStats = this.getStats(operation);
      if (opStats) {
        stats[operation] = opStats;
      }
    }

    return stats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Get recent metrics for an operation
   */
  getRecentMetrics(operation: string, limit: number = 10): Metric[] {
    const metrics = this.metrics.get(operation);

    if (!metrics) {
      return [];
    }

    return metrics.slice(-limit);
  }
}

interface Metric {
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface OperationStats {
  count: number;
  avg: number;
  min: number;
  max: number;
  p50: number;
  p95: number;
  p99: number;
}

// Global instance
export const performanceMonitor = new PerformanceMonitor();
