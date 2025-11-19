/**
 * OpenTelemetry Metric Readers
 */

import type { MetricExporter, ResourceMetrics, ExportResult } from './types';

/**
 * Metric reader interface
 */
export interface MetricReader {
  collect(): Promise<ResourceMetrics>;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

/**
 * Periodic exporting metric reader
 */
export class PeriodicExportingMetricReader implements MetricReader {
  private timer: NodeJS.Timeout | null = null;
  private isShutdown = false;

  private readonly exportIntervalMillis: number;
  private readonly exportTimeoutMillis: number;

  constructor(
    private readonly exporter: MetricExporter,
    config: {
      exportIntervalMillis?: number;
      exportTimeoutMillis?: number;
    } = {}
  ) {
    this.exportIntervalMillis = config.exportIntervalMillis || 60000; // 1 minute
    this.exportTimeoutMillis = config.exportTimeoutMillis || 30000; // 30 seconds

    this.startTimer();
  }

  async collect(): Promise<ResourceMetrics> {
    // Would collect metrics from meter provider
    return {
      resource: { attributes: {}, merge: () => ({} as any) },
      scopeMetrics: [],
    };
  }

  async shutdown(): Promise<void> {
    if (this.isShutdown) {
      return;
    }

    this.isShutdown = true;

    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }

    await this.forceFlush();
    await this.exporter.shutdown();
  }

  async forceFlush(): Promise<void> {
    const metrics = await this.collect();

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Export timeout'));
      }, this.exportTimeoutMillis);

      this.exporter.export(metrics, (result: ExportResult) => {
        clearTimeout(timeout);

        if (result.code !== 0) {
          reject(result.error || new Error('Export failed'));
        } else {
          resolve();
        }
      });
    });
  }

  private startTimer(): void {
    this.timer = setInterval(async () => {
      try {
        await this.forceFlush();
      } catch (error) {
        console.error('Metric export error:', error);
      }
    }, this.exportIntervalMillis);
  }
}

/**
 * Manual metric reader
 */
export class ManualMetricReader implements MetricReader {
  async collect(): Promise<ResourceMetrics> {
    return {
      resource: { attributes: {}, merge: () => ({} as any) },
      scopeMetrics: [],
    };
  }

  async shutdown(): Promise<void> {}

  async forceFlush(): Promise<void> {}
}
