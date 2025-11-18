/**
 * Real-time scoring engine with <100ms latency guarantee.
 * Optimized for high-throughput anomaly detection.
 */

import { ModelManager, PredictionResult, Algorithm } from './model-manager.js';
import { EventBuffer, Event } from './event-buffer.js';

export interface ScoringOptions {
  algorithm?: Algorithm;
  timeout?: number;
  batchSize?: number;
  threshold?: number;
}

export interface ScoringResult {
  eventId: string;
  timestamp: number;
  isAnomaly: boolean;
  score: number;
  confidence: number;
  algorithm: Algorithm;
  latencyMs: number;
}

export interface BatchScoringResult {
  results: ScoringResult[];
  totalLatencyMs: number;
  avgLatencyMs: number;
  anomalyCount: number;
  anomalyRate: number;
}

export class RealtimeScorer {
  private modelManager: ModelManager;
  private defaultTimeout: number;
  private defaultBatchSize: number;
  private defaultThreshold: number;
  private stats = {
    totalScored: 0,
    totalAnomalies: 0,
    totalLatency: 0,
    maxLatency: 0,
    minLatency: Infinity,
    timeoutCount: 0
  };

  constructor(
    modelManager: ModelManager,
    timeout: number = 100,
    batchSize: number = 100,
    threshold: number = 0.5
  ) {
    this.modelManager = modelManager;
    this.defaultTimeout = timeout;
    this.defaultBatchSize = batchSize;
    this.defaultThreshold = threshold;
  }

  /**
   * Score a single event in real-time.
   */
  async scoreEvent(
    event: Event,
    options: ScoringOptions = {}
  ): Promise<ScoringResult> {
    const startTime = performance.now();
    const timeout = options.timeout || this.defaultTimeout;

    try {
      const result = await Promise.race([
        this.modelManager.predict(
          [event.features],
          options.algorithm,
          timeout
        ),
        this.timeoutPromise(timeout)
      ]);

      const latency = performance.now() - startTime;
      this.updateStats(latency, false);

      if (result.status === 'error') {
        throw new Error(result.message || 'Prediction failed');
      }

      const prediction = result.results![0];
      const currentModel = this.modelManager.getCurrentModel();

      return {
        eventId: event.id,
        timestamp: event.timestamp,
        isAnomaly: prediction.is_anomaly,
        score: prediction.anomaly_score,
        confidence: prediction.confidence,
        algorithm: currentModel?.metadata.algorithm || 'isolation_forest',
        latencyMs: latency
      };
    } catch (error) {
      const latency = performance.now() - startTime;

      if (error instanceof TimeoutError) {
        this.updateStats(latency, true);
        throw new Error(`Scoring timeout after ${timeout}ms`);
      }

      throw error;
    }
  }

  /**
   * Score multiple events in batch.
   */
  async scoreBatch(
    events: Event[],
    options: ScoringOptions = {}
  ): Promise<BatchScoringResult> {
    const startTime = performance.now();
    const batchSize = options.batchSize || this.defaultBatchSize;
    const timeout = options.timeout || this.defaultTimeout;

    // Split into batches if needed
    const batches = this.splitIntoBatches(events, batchSize);
    const results: ScoringResult[] = [];

    for (const batch of batches) {
      const features = batch.map(e => e.features);

      try {
        const result = await Promise.race([
          this.modelManager.predict(features, options.algorithm, timeout),
          this.timeoutPromise(timeout)
        ]);

        if (result.status === 'error') {
          throw new Error(result.message || 'Batch prediction failed');
        }

        const currentModel = this.modelManager.getCurrentModel();
        const algorithm = currentModel?.metadata.algorithm || 'isolation_forest';

        for (let i = 0; i < batch.length; i++) {
          const prediction = result.results![i];
          results.push({
            eventId: batch[i].id,
            timestamp: batch[i].timestamp,
            isAnomaly: prediction.is_anomaly,
            score: prediction.anomaly_score,
            confidence: prediction.confidence,
            algorithm,
            latencyMs: result.scoring_time_ms || 0
          });
        }
      } catch (error) {
        if (error instanceof TimeoutError) {
          this.updateStats(timeout, true);
          throw new Error(`Batch scoring timeout after ${timeout}ms`);
        }
        throw error;
      }
    }

    const totalLatency = performance.now() - startTime;
    const anomalyCount = results.filter(r => r.isAnomaly).length;

    this.updateStats(totalLatency / results.length, false);

    return {
      results,
      totalLatencyMs: totalLatency,
      avgLatencyMs: totalLatency / results.length,
      anomalyCount,
      anomalyRate: anomalyCount / results.length
    };
  }

  /**
   * Score events from a buffer.
   */
  async scoreBuffer(
    buffer: EventBuffer,
    options: ScoringOptions = {}
  ): Promise<BatchScoringResult> {
    const events = buffer.flush();
    return this.scoreBatch(events, options);
  }

  /**
   * Stream scoring: score events as they arrive.
   */
  async *scoreStream(
    eventStream: AsyncIterable<Event>,
    options: ScoringOptions = {}
  ): AsyncGenerator<ScoringResult> {
    for await (const event of eventStream) {
      try {
        const result = await this.scoreEvent(event, options);
        yield result;
      } catch (error) {
        console.error('Stream scoring error:', error);
        // Continue processing other events
      }
    }
  }

  /**
   * Get scoring statistics.
   */
  getStats(): {
    totalScored: number;
    totalAnomalies: number;
    avgLatencyMs: number;
    maxLatencyMs: number;
    minLatencyMs: number;
    anomalyRate: number;
    timeoutRate: number;
  } {
    return {
      totalScored: this.stats.totalScored,
      totalAnomalies: this.stats.totalAnomalies,
      avgLatencyMs: this.stats.totalScored > 0
        ? this.stats.totalLatency / this.stats.totalScored
        : 0,
      maxLatencyMs: this.stats.maxLatency,
      minLatencyMs: this.stats.minLatency === Infinity ? 0 : this.stats.minLatency,
      anomalyRate: this.stats.totalScored > 0
        ? this.stats.totalAnomalies / this.stats.totalScored
        : 0,
      timeoutRate: this.stats.totalScored > 0
        ? this.stats.timeoutCount / this.stats.totalScored
        : 0
    };
  }

  /**
   * Reset statistics.
   */
  resetStats(): void {
    this.stats = {
      totalScored: 0,
      totalAnomalies: 0,
      totalLatency: 0,
      maxLatency: 0,
      minLatency: Infinity,
      timeoutCount: 0
    };
  }

  /**
   * Update statistics.
   */
  private updateStats(latency: number, timeout: boolean): void {
    this.stats.totalScored++;
    this.stats.totalLatency += latency;
    this.stats.maxLatency = Math.max(this.stats.maxLatency, latency);
    this.stats.minLatency = Math.min(this.stats.minLatency, latency);

    if (timeout) {
      this.stats.timeoutCount++;
    }
  }

  /**
   * Split events into batches.
   */
  private splitIntoBatches(events: Event[], batchSize: number): Event[][] {
    const batches: Event[][] = [];

    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }

    return batches;
  }

  /**
   * Create a timeout promise.
   */
  private timeoutPromise(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new TimeoutError(`Timeout after ${ms}ms`)), ms);
    });
  }
}

class TimeoutError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TimeoutError';
  }
}
