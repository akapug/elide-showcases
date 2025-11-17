/**
 * Metrics Collector
 */

export class MetricsCollector {
  private queryCount: number = 0;
  private queryDurations: number[] = [];
  private transactionCount: number = 0;
  private transactionSuccessCount: number = 0;
  private transactionFailureCount: number = 0;
  private errorCount: number = 0;

  /**
   * Record query
   */
  recordQuery(operation: string, duration: number): void {
    this.queryCount++;
    this.queryDurations.push(duration);
  }

  /**
   * Record transaction
   */
  recordTransaction(success: boolean, duration: number): void {
    this.transactionCount++;
    if (success) {
      this.transactionSuccessCount++;
    } else {
      this.transactionFailureCount++;
    }
  }

  /**
   * Record error
   */
  recordError(error: Error): void {
    this.errorCount++;
  }

  /**
   * Get stats
   */
  getStats() {
    const avgDuration = this.queryDurations.length > 0
      ? this.queryDurations.reduce((a, b) => a + b, 0) / this.queryDurations.length
      : 0;

    return {
      queries: {
        total: this.queryCount,
        avgDuration: Math.round(avgDuration * 100) / 100
      },
      transactions: {
        total: this.transactionCount,
        successful: this.transactionSuccessCount,
        failed: this.transactionFailureCount
      },
      errors: this.errorCount
    };
  }

  /**
   * Reset stats
   */
  reset(): void {
    this.queryCount = 0;
    this.queryDurations = [];
    this.transactionCount = 0;
    this.transactionSuccessCount = 0;
    this.transactionFailureCount = 0;
    this.errorCount = 0;
  }
}
