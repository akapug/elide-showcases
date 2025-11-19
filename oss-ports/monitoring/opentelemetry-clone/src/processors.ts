/**
 * OpenTelemetry Span Processors
 */

import type { ReadableSpan, SpanExporter, ExportResult, ExportResultCode, Context } from './types';

/**
 * Span processor interface
 */
export interface SpanProcessor {
  onStart(span: ReadableSpan, context: Context): void;
  onEnd(span: ReadableSpan): void;
  shutdown(): Promise<void>;
  forceFlush(): Promise<void>;
}

/**
 * Simple span processor - exports spans immediately
 */
export class SimpleSpanProcessor implements SpanProcessor {
  private isShutdown = false;

  constructor(private readonly exporter: SpanExporter) {}

  onStart(span: ReadableSpan, context: Context): void {
    // No-op for simple processor
  }

  onEnd(span: ReadableSpan): void {
    if (this.isShutdown) {
      return;
    }

    this.exporter.export([span], (result: ExportResult) => {
      if (result.code !== 0) {
        console.error('Export failed:', result.error);
      }
    });
  }

  async shutdown(): Promise<void> {
    if (this.isShutdown) {
      return;
    }

    this.isShutdown = true;
    await this.exporter.shutdown();
  }

  async forceFlush(): Promise<void> {
    // Simple processor exports immediately, so nothing to flush
  }
}

/**
 * Batch span processor - batches and exports spans periodically
 */
export class BatchSpanProcessor implements SpanProcessor {
  private spans: ReadableSpan[] = [];
  private timer: NodeJS.Timeout | null = null;
  private isShutdown = false;
  private isExporting = false;

  private readonly maxQueueSize: number;
  private readonly scheduledDelayMillis: number;
  private readonly exportTimeoutMillis: number;
  private readonly maxExportBatchSize: number;

  constructor(
    private readonly exporter: SpanExporter,
    config: {
      maxQueueSize?: number;
      scheduledDelayMillis?: number;
      exportTimeoutMillis?: number;
      maxExportBatchSize?: number;
    } = {}
  ) {
    this.maxQueueSize = config.maxQueueSize || 2048;
    this.scheduledDelayMillis = config.scheduledDelayMillis || 5000;
    this.exportTimeoutMillis = config.exportTimeoutMillis || 30000;
    this.maxExportBatchSize = config.maxExportBatchSize || 512;

    // Start export timer
    this.startTimer();
  }

  onStart(span: ReadableSpan, context: Context): void {
    // No-op
  }

  onEnd(span: ReadableSpan): void {
    if (this.isShutdown) {
      return;
    }

    // Add to buffer
    if (this.spans.length < this.maxQueueSize) {
      this.spans.push(span);
    } else {
      console.warn('Span buffer full, dropping span');
    }

    // Export if buffer is full
    if (this.spans.length >= this.maxExportBatchSize) {
      this.flush();
    }
  }

  async shutdown(): Promise<void> {
    if (this.isShutdown) {
      return;
    }

    this.isShutdown = true;

    // Stop timer
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    // Flush remaining spans
    await this.forceFlush();

    // Shutdown exporter
    await this.exporter.shutdown();
  }

  async forceFlush(): Promise<void> {
    if (this.isExporting) {
      // Wait for current export to complete
      await new Promise((resolve) => setTimeout(resolve, 100));
      return this.forceFlush();
    }

    await this.flush();
  }

  private startTimer(): void {
    this.timer = setTimeout(() => {
      this.flush();
      this.startTimer();
    }, this.scheduledDelayMillis);
  }

  private async flush(): Promise<void> {
    if (this.spans.length === 0 || this.isExporting) {
      return;
    }

    this.isExporting = true;

    // Take batch
    const batch = this.spans.splice(0, this.maxExportBatchSize);

    try {
      await new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Export timeout'));
        }, this.exportTimeoutMillis);

        this.exporter.export(batch, (result: ExportResult) => {
          clearTimeout(timeout);

          if (result.code !== 0) {
            reject(result.error || new Error('Export failed'));
          } else {
            resolve();
          }
        });
      });
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      this.isExporting = false;
    }
  }
}

/**
 * Multi-span processor - delegates to multiple processors
 */
export class MultiSpanProcessor implements SpanProcessor {
  constructor(private readonly processors: SpanProcessor[]) {}

  onStart(span: ReadableSpan, context: Context): void {
    for (const processor of this.processors) {
      processor.onStart(span, context);
    }
  }

  onEnd(span: ReadableSpan): void {
    for (const processor of this.processors) {
      processor.onEnd(span);
    }
  }

  async shutdown(): Promise<void> {
    await Promise.all(this.processors.map((p) => p.shutdown()));
  }

  async forceFlush(): Promise<void> {
    await Promise.all(this.processors.map((p) => p.forceFlush()));
  }
}

/**
 * No-op span processor
 */
export class NoopSpanProcessor implements SpanProcessor {
  onStart(span: ReadableSpan, context: Context): void {}
  onEnd(span: ReadableSpan): void {}
  async shutdown(): Promise<void> {}
  async forceFlush(): Promise<void> {}
}
