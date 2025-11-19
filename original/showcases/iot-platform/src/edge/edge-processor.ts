/**
 * Elide IoT Platform - Edge Processor
 *
 * Local edge processing to reduce bandwidth, latency, and enable offline operation.
 * Intelligent sync strategies and edge ML inference.
 */

import {
  EdgeConfig,
  ProcessingMode,
  SyncStrategy,
  EdgeProcessingResult,
  SensorReading,
  AggregationType
} from '../types';

// ============================================================================
// Edge Processor Implementation
// ============================================================================

export class EdgeProcessor {
  private localBuffer: SensorReading[] = [];
  private lastSyncTime: number = 0;
  private bytesStored: number = 0;
  private syncQueue: SensorReading[] = [];

  constructor(private config: EdgeConfig) {}

  async process(
    data: SensorReading | SensorReading[],
    options?: ProcessingOptions
  ): Promise<EdgeProcessingResult> {
    const startTime = performance.now();
    const readings = Array.isArray(data) ? data : [data];

    let processed = 0;
    let filtered = 0;
    let aggregated = 0;
    let synced = 0;
    let stored = 0;
    let errors = 0;

    for (const reading of readings) {
      try {
        // Apply local processing
        const processedReading = await this.processReading(reading, options);

        if (!processedReading) {
          filtered++;
          continue;
        }

        processed++;

        // Store locally
        if (await this.storeLocally(processedReading)) {
          stored++;
        }

        // Check if should sync
        if (await this.shouldSync(processedReading)) {
          this.syncQueue.push(processedReading);
        }
      } catch (error) {
        errors++;
      }
    }

    // Perform aggregation if needed
    if (options?.aggregation) {
      const aggResult = await this.aggregate(this.localBuffer, options.aggregation);
      aggregated = aggResult.length;
    }

    // Sync if needed
    if (this.shouldPerformSync()) {
      synced = await this.sync();
    }

    const processingTime = performance.now() - startTime;

    return {
      processed,
      filtered,
      aggregated,
      synced,
      stored,
      errors,
      processingTime
    };
  }

  private async processReading(
    reading: SensorReading,
    options?: ProcessingOptions
  ): Promise<SensorReading | null> {
    // Apply filters
    if (options?.filters) {
      for (const filter of options.filters) {
        if (!this.applyFilter(reading, filter)) {
          return null; // Filtered out
        }
      }
    }

    // Apply transformations
    if (options?.transform) {
      reading = this.transform(reading, options.transform);
    }

    return reading;
  }

  private applyFilter(reading: SensorReading, filter: string): boolean {
    switch (filter) {
      case 'lowpass':
        return typeof reading.value === 'number' && reading.value < 100;
      case 'outlier-removal':
        return typeof reading.value === 'number' && Math.abs(reading.value) < 1000;
      default:
        return true;
    }
  }

  private transform(reading: SensorReading, transform: string): SensorReading {
    if (transform === 'normalize' && typeof reading.value === 'number') {
      reading.value = reading.value / 100;
    }
    return reading;
  }

  private async storeLocally(reading: SensorReading): Promise<boolean> {
    const size = JSON.stringify(reading).length;

    if (this.bytesStored + size > this.config.localStorageLimit) {
      // Remove oldest readings
      while (this.localBuffer.length > 0 && this.bytesStored + size > this.config.localStorageLimit) {
        const removed = this.localBuffer.shift();
        if (removed) {
          this.bytesStored -= JSON.stringify(removed).length;
        }
      }
    }

    this.localBuffer.push(reading);
    this.bytesStored += size;
    return true;
  }

  private async shouldSync(reading: SensorReading): Promise<boolean> {
    switch (this.config.syncStrategy) {
      case SyncStrategy.REALTIME:
        return true;
      case SyncStrategy.ON_CHANGE:
        return this.detectSignificantChange(reading);
      case SyncStrategy.PERIODIC:
        return false; // Handled by timer
      case SyncStrategy.SMART:
        return this.smartSyncDecision(reading);
      default:
        return false;
    }
  }

  private detectSignificantChange(reading: SensorReading): boolean {
    if (this.localBuffer.length === 0) return true;

    const lastReading = this.localBuffer[this.localBuffer.length - 1];
    if (typeof reading.value === 'number' && typeof lastReading.value === 'number') {
      const change = Math.abs(reading.value - lastReading.value);
      return change > lastReading.value * 0.1; // 10% change
    }

    return false;
  }

  private smartSyncDecision(reading: SensorReading): boolean {
    // Sync on significant changes, anomalies, or periodic
    if (this.detectSignificantChange(reading)) return true;
    if (Date.now() - this.lastSyncTime > this.config.syncInterval) return true;
    return false;
  }

  private shouldPerformSync(): boolean {
    if (this.syncQueue.length === 0) return false;
    if (this.config.syncStrategy === SyncStrategy.REALTIME) return true;
    if (Date.now() - this.lastSyncTime > this.config.syncInterval) return true;
    if (this.syncQueue.length > 1000) return true; // Buffer full
    return false;
  }

  private async sync(): Promise<number> {
    const toSync = [...this.syncQueue];
    this.syncQueue = [];

    if (this.config.compressionEnabled) {
      // Compress before sending
      const compressed = this.compress(toSync);
      // Send compressed data
    }

    this.lastSyncTime = Date.now();
    return toSync.length;
  }

  private compress(readings: SensorReading[]): any {
    // Simple compression: remove redundant fields
    return readings.map(r => ({
      s: r.sensorId,
      t: r.timestamp,
      v: r.value
    }));
  }

  private async aggregate(
    readings: SensorReading[],
    aggregation: AggregationType
  ): Promise<SensorReading[]> {
    const grouped = new Map<string, SensorReading[]>();

    // Group by sensor
    for (const reading of readings) {
      if (!grouped.has(reading.sensorId)) {
        grouped.set(reading.sensorId, []);
      }
      grouped.get(reading.sensorId)!.push(reading);
    }

    const aggregated: SensorReading[] = [];

    for (const [sensorId, sensorReadings] of grouped) {
      if (sensorReadings.length === 0) continue;

      const values = sensorReadings
        .filter(r => typeof r.value === 'number')
        .map(r => r.value as number);

      if (values.length === 0) continue;

      let aggValue: number;

      switch (aggregation) {
        case AggregationType.MEAN:
          aggValue = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case AggregationType.MIN:
          aggValue = Math.min(...values);
          break;
        case AggregationType.MAX:
          aggValue = Math.max(...values);
          break;
        case AggregationType.SUM:
          aggValue = values.reduce((a, b) => a + b, 0);
          break;
        default:
          aggValue = values.reduce((a, b) => a + b, 0) / values.length;
      }

      aggregated.push({
        ...sensorReadings[0],
        value: aggValue,
        timestamp: Date.now()
      });
    }

    return aggregated;
  }

  getBufferSize(): number {
    return this.localBuffer.length;
  }

  getBytesStored(): number {
    return this.bytesStored;
  }

  getLocalBuffer(): SensorReading[] {
    return [...this.localBuffer];
  }

  clearBuffer(): void {
    this.localBuffer = [];
    this.bytesStored = 0;
  }
}

interface ProcessingOptions {
  filters?: string[];
  transform?: string;
  aggregation?: AggregationType;
  window?: number;
}
