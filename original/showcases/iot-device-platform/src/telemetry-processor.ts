/**
 * Telemetry Processor - Real-time Telemetry Processing
 *
 * High-performance telemetry processing:
 * - Batch processing for efficiency
 * - Real-time aggregation
 * - Time-series data storage (InfluxDB)
 * - Data validation and transformation
 * - Backpressure handling
 * - Downsampling for historical data
 */

import { InfluxDB, FieldType, Point } from 'influx';
import Redis from 'ioredis';
import { Logger } from 'pino';
import { EventEmitter } from 'events';
import { z } from 'zod';

interface TelemetryData {
  deviceId: string;
  timestamp: number;
  metrics: Record<string, number | string | boolean>;
}

interface TelemetryQuery {
  start?: string;
  end?: string;
  metric?: string;
  aggregation?: 'mean' | 'min' | 'max' | 'sum' | 'count';
  interval?: string;
  limit?: number;
}

interface ProcessingLimits {
  batchSize: number;
  batchInterval: number;
  maxQueueSize: number;
  maxTelemetryRate: number;
}

interface AggregatedMetric {
  deviceId: string;
  metric: string;
  value: number;
  min: number;
  max: number;
  avg: number;
  count: number;
  timestamp: number;
}

/**
 * Telemetry validation schema
 */
const TelemetrySchema = z.object({
  deviceId: z.string(),
  timestamp: z.number(),
  metrics: z.record(z.union([z.number(), z.string(), z.boolean()])),
});

/**
 * Telemetry Processor for real-time data ingestion
 */
export class TelemetryProcessor extends EventEmitter {
  private influx: InfluxDB;
  private redis: Redis;
  private logger: Logger;
  private limits: ProcessingLimits;

  private queue: TelemetryData[] = [];
  private processingInterval: NodeJS.Timeout | null = null;
  private initialized = false;

  // Statistics
  private stats = {
    received: 0,
    processed: 0,
    errors: 0,
    lastProcessedAt: Date.now(),
    currentRate: 0,
  };

  // Rate tracking
  private rateWindow: number[] = [];
  private readonly RATE_WINDOW_SIZE = 60; // 60 seconds

  // Aggregation buffers
  private aggregationBuffers = new Map<string, Map<string, number[]>>();

  constructor(
    influx: InfluxDB,
    redis: Redis,
    limits: ProcessingLimits,
    logger: Logger
  ) {
    super();
    this.influx = influx;
    this.redis = redis;
    this.limits = limits;
    this.logger = logger;
  }

  /**
   * Initialize the telemetry processor
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    this.logger.info('Initializing Telemetry Processor...');

    try {
      // Ensure InfluxDB database exists
      const databases = await this.influx.getDatabaseNames();
      const dbName = this.influx.options.database as string;

      if (!databases.includes(dbName)) {
        await this.influx.createDatabase(dbName);
        this.logger.info({ database: dbName }, 'Created InfluxDB database');
      }

      // Create retention policies
      await this.createRetentionPolicies();

      // Start processing interval
      this.startProcessing();

      // Start rate tracking
      this.startRateTracking();

      // Start aggregation
      this.startAggregation();

      this.initialized = true;
      this.logger.info('Telemetry Processor initialized');
    } catch (error) {
      this.logger.error({ error }, 'Failed to initialize Telemetry Processor');
      throw error;
    }
  }

  /**
   * Create retention policies for data lifecycle management
   */
  private async createRetentionPolicies(): Promise<void> {
    const dbName = this.influx.options.database as string;

    try {
      // Raw data: 7 days
      await this.influx.query(`
        CREATE RETENTION POLICY "raw_data" ON "${dbName}"
        DURATION 7d REPLICATION 1 DEFAULT
      `).catch(() => {
        // Policy might already exist
      });

      // Downsampled 1min: 30 days
      await this.influx.query(`
        CREATE RETENTION POLICY "downsampled_1m" ON "${dbName}"
        DURATION 30d REPLICATION 1
      `).catch(() => {});

      // Downsampled 1hour: 1 year
      await this.influx.query(`
        CREATE RETENTION POLICY "downsampled_1h" ON "${dbName}"
        DURATION 365d REPLICATION 1
      `).catch(() => {});

      this.logger.info('Retention policies configured');
    } catch (error) {
      this.logger.error({ error }, 'Failed to create retention policies');
    }
  }

  /**
   * Process incoming telemetry data
   */
  async processTelemetry(data: TelemetryData): Promise<void> {
    try {
      // Validate data
      TelemetrySchema.parse(data);

      // Check queue size
      if (this.queue.length >= this.limits.maxQueueSize) {
        this.logger.warn({ queueSize: this.queue.length }, 'Queue full, dropping telemetry');
        this.stats.errors++;
        return;
      }

      // Add to queue
      this.queue.push(data);
      this.stats.received++;

      // Track rate
      this.trackRate();

      // Emit event for real-time processing
      this.emit('telemetry', data);

      // Update latest values in Redis
      await this.updateLatestValues(data);

      // Update aggregation buffers
      this.updateAggregationBuffers(data);

    } catch (error) {
      this.logger.error({ error, data }, 'Failed to process telemetry');
      this.stats.errors++;
    }
  }

  /**
   * Start batch processing
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(
      () => this.processBatch(),
      this.limits.batchInterval
    );
  }

  /**
   * Process a batch of telemetry data
   */
  private async processBatch(): Promise<void> {
    if (this.queue.length === 0) {
      return;
    }

    const batchSize = Math.min(this.queue.length, this.limits.batchSize);
    const batch = this.queue.splice(0, batchSize);

    try {
      const points = batch.map(data => this.createInfluxPoint(data));

      await this.influx.writePoints(points);

      this.stats.processed += batch.length;
      this.stats.lastProcessedAt = Date.now();

      this.logger.debug(
        { batchSize: batch.length, queueSize: this.queue.length },
        'Batch processed'
      );
    } catch (error) {
      this.logger.error({ error, batchSize: batch.length }, 'Failed to process batch');
      this.stats.errors += batch.length;

      // Re-queue failed batch (with limit)
      if (this.queue.length < this.limits.maxQueueSize) {
        this.queue.unshift(...batch.slice(0, this.limits.maxQueueSize - this.queue.length));
      }
    }
  }

  /**
   * Create InfluxDB point from telemetry data
   */
  private createInfluxPoint(data: TelemetryData): any {
    const fields: Record<string, any> = {};
    const tags: Record<string, string> = {
      deviceId: data.deviceId,
    };

    // Separate numeric and non-numeric metrics
    for (const [key, value] of Object.entries(data.metrics)) {
      if (typeof value === 'number') {
        fields[key] = value;
      } else if (typeof value === 'boolean') {
        fields[key] = value;
      } else {
        tags[key] = String(value);
      }
    }

    return {
      measurement: 'telemetry',
      tags,
      fields,
      timestamp: new Date(data.timestamp),
    };
  }

  /**
   * Query telemetry data
   */
  async queryTelemetry(
    deviceId: string,
    query: TelemetryQuery
  ): Promise<any[]> {
    const start = query.start || new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const end = query.end || new Date().toISOString();
    const limit = query.limit || 1000;

    let influxQuery = `SELECT `;

    if (query.metric) {
      // Specific metric
      if (query.aggregation) {
        influxQuery += `${query.aggregation}("${query.metric}") AS "${query.metric}"`;
      } else {
        influxQuery += `"${query.metric}"`;
      }
    } else {
      // All metrics
      influxQuery += `*`;
    }

    influxQuery += ` FROM "telemetry"`;
    influxQuery += ` WHERE "deviceId" = '${deviceId}'`;
    influxQuery += ` AND time >= '${start}' AND time <= '${end}'`;

    if (query.interval && query.aggregation) {
      influxQuery += ` GROUP BY time(${query.interval}) fill(none)`;
    }

    influxQuery += ` ORDER BY time DESC`;
    influxQuery += ` LIMIT ${limit}`;

    try {
      const results = await this.influx.query(influxQuery);
      return results;
    } catch (error) {
      this.logger.error({ error, query: influxQuery }, 'Failed to query telemetry');
      throw error;
    }
  }

  /**
   * Get latest telemetry for a device
   */
  async getLatestTelemetry(deviceId: string): Promise<TelemetryData | null> {
    try {
      const cached = await this.redis.get(`telemetry:latest:${deviceId}`);
      if (cached) {
        return JSON.parse(cached);
      }

      // Query from InfluxDB
      const results = await this.influx.query(
        `SELECT * FROM "telemetry" WHERE "deviceId" = '${deviceId}' ORDER BY time DESC LIMIT 1`
      );

      if (results.length === 0) {
        return null;
      }

      const result = results[0];
      const data: TelemetryData = {
        deviceId,
        timestamp: new Date(result.time).getTime(),
        metrics: {},
      };

      // Extract metrics from result
      for (const [key, value] of Object.entries(result)) {
        if (key !== 'time' && key !== 'deviceId') {
          data.metrics[key] = value as any;
        }
      }

      return data;
    } catch (error) {
      this.logger.error({ error, deviceId }, 'Failed to get latest telemetry');
      return null;
    }
  }

  /**
   * Update latest values in Redis
   */
  private async updateLatestValues(data: TelemetryData): Promise<void> {
    try {
      const key = `telemetry:latest:${data.deviceId}`;
      await this.redis.setex(key, 3600, JSON.stringify(data));

      // Also store individual metrics
      for (const [metric, value] of Object.entries(data.metrics)) {
        const metricKey = `telemetry:latest:${data.deviceId}:${metric}`;
        await this.redis.setex(metricKey, 3600, String(value));
      }
    } catch (error) {
      this.logger.error({ error, deviceId: data.deviceId }, 'Failed to update latest values');
    }
  }

  /**
   * Update aggregation buffers for real-time stats
   */
  private updateAggregationBuffers(data: TelemetryData): void {
    if (!this.aggregationBuffers.has(data.deviceId)) {
      this.aggregationBuffers.set(data.deviceId, new Map());
    }

    const deviceBuffer = this.aggregationBuffers.get(data.deviceId)!;

    for (const [metric, value] of Object.entries(data.metrics)) {
      if (typeof value === 'number') {
        if (!deviceBuffer.has(metric)) {
          deviceBuffer.set(metric, []);
        }

        const buffer = deviceBuffer.get(metric)!;
        buffer.push(value);

        // Keep only last 100 values
        if (buffer.length > 100) {
          buffer.shift();
        }
      }
    }
  }

  /**
   * Get aggregated metrics for a device
   */
  getAggregatedMetrics(deviceId: string): AggregatedMetric[] {
    const deviceBuffer = this.aggregationBuffers.get(deviceId);
    if (!deviceBuffer) {
      return [];
    }

    const metrics: AggregatedMetric[] = [];

    for (const [metric, values] of deviceBuffer.entries()) {
      if (values.length === 0) {
        continue;
      }

      const sum = values.reduce((a, b) => a + b, 0);
      const avg = sum / values.length;
      const min = Math.min(...values);
      const max = Math.max(...values);

      metrics.push({
        deviceId,
        metric,
        value: values[values.length - 1],
        min,
        max,
        avg,
        count: values.length,
        timestamp: Date.now(),
      });
    }

    return metrics;
  }

  /**
   * Start aggregation job
   */
  private startAggregation(): void {
    // Create continuous queries for downsampling
    setInterval(() => {
      this.createDownsamplingQueries().catch(err => {
        this.logger.error({ err }, 'Failed to create downsampling queries');
      });
    }, 60000); // Every minute
  }

  /**
   * Create continuous queries for data downsampling
   */
  private async createDownsamplingQueries(): Promise<void> {
    const dbName = this.influx.options.database as string;

    try {
      // 1-minute aggregation
      await this.influx.query(`
        CREATE CONTINUOUS QUERY "cq_1m" ON "${dbName}"
        BEGIN
          SELECT mean(*) INTO "${dbName}"."downsampled_1m"."telemetry"
          FROM "telemetry"
          GROUP BY time(1m), "deviceId"
        END
      `).catch(() => {
        // Query might already exist
      });

      // 1-hour aggregation
      await this.influx.query(`
        CREATE CONTINUOUS QUERY "cq_1h" ON "${dbName}"
        BEGIN
          SELECT mean(*) INTO "${dbName}"."downsampled_1h"."telemetry"
          FROM "telemetry"
          GROUP BY time(1h), "deviceId"
        END
      `).catch(() => {});

    } catch (error) {
      this.logger.debug({ error }, 'Continuous queries already exist or failed to create');
    }
  }

  /**
   * Track message rate
   */
  private trackRate(): void {
    const now = Math.floor(Date.now() / 1000);
    this.rateWindow.push(now);

    // Keep only last 60 seconds
    const cutoff = now - this.RATE_WINDOW_SIZE;
    this.rateWindow = this.rateWindow.filter(t => t > cutoff);
  }

  /**
   * Start rate tracking
   */
  private startRateTracking(): void {
    setInterval(() => {
      this.stats.currentRate = this.rateWindow.length / this.RATE_WINDOW_SIZE;
    }, 1000);
  }

  /**
   * Get current message processing rate
   */
  getCurrentRate(): number {
    return this.stats.currentRate;
  }

  /**
   * Get processing statistics
   */
  getStats(): any {
    return {
      ...this.stats,
      queueSize: this.queue.length,
      rate: this.stats.currentRate,
    };
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData(cutoffTimestamp: number): Promise<void> {
    this.logger.info({ cutoffTimestamp }, 'Cleaning up old telemetry data');

    try {
      const cutoffDate = new Date(cutoffTimestamp).toISOString();

      await this.influx.query(
        `DELETE FROM "telemetry" WHERE time < '${cutoffDate}'`
      );

      this.logger.info('Old data cleanup completed');
    } catch (error) {
      this.logger.error({ error }, 'Failed to cleanup old data');
    }
  }

  /**
   * Export telemetry data for analytics
   */
  async exportTelemetry(
    deviceId: string,
    start: Date,
    end: Date
  ): Promise<TelemetryData[]> {
    try {
      const results = await this.influx.query(
        `SELECT * FROM "telemetry"
         WHERE "deviceId" = '${deviceId}'
         AND time >= '${start.toISOString()}'
         AND time <= '${end.toISOString()}'
         ORDER BY time ASC`
      );

      return results.map(result => ({
        deviceId,
        timestamp: new Date(result.time).getTime(),
        metrics: Object.fromEntries(
          Object.entries(result).filter(([key]) => key !== 'time' && key !== 'deviceId')
        ),
      }));
    } catch (error) {
      this.logger.error({ error, deviceId }, 'Failed to export telemetry');
      throw error;
    }
  }

  /**
   * Get telemetry statistics for a time range
   */
  async getStatistics(
    deviceId: string,
    metric: string,
    start: Date,
    end: Date
  ): Promise<{
    count: number;
    min: number;
    max: number;
    mean: number;
    sum: number;
    stddev: number;
  }> {
    try {
      const results = await this.influx.query(
        `SELECT
          COUNT("${metric}") as count,
          MIN("${metric}") as min,
          MAX("${metric}") as max,
          MEAN("${metric}") as mean,
          SUM("${metric}") as sum,
          STDDEV("${metric}") as stddev
         FROM "telemetry"
         WHERE "deviceId" = '${deviceId}'
         AND time >= '${start.toISOString()}'
         AND time <= '${end.toISOString()}'`
      );

      if (results.length === 0) {
        return { count: 0, min: 0, max: 0, mean: 0, sum: 0, stddev: 0 };
      }

      return results[0] as any;
    } catch (error) {
      this.logger.error({ error, deviceId, metric }, 'Failed to get statistics');
      throw error;
    }
  }

  /**
   * Calculate percentiles
   */
  async getPercentiles(
    deviceId: string,
    metric: string,
    percentiles: number[],
    start: Date,
    end: Date
  ): Promise<Record<string, number>> {
    try {
      const percentileQueries = percentiles.map(
        p => `PERCENTILE("${metric}", ${p}) as p${p}`
      );

      const results = await this.influx.query(
        `SELECT ${percentileQueries.join(', ')}
         FROM "telemetry"
         WHERE "deviceId" = '${deviceId}'
         AND time >= '${start.toISOString()}'
         AND time <= '${end.toISOString()}'`
      );

      if (results.length === 0) {
        return {};
      }

      return results[0] as any;
    } catch (error) {
      this.logger.error({ error, deviceId, metric }, 'Failed to get percentiles');
      throw error;
    }
  }

  /**
   * Shutdown the processor
   */
  async shutdown(): Promise<void> {
    this.logger.info('Shutting down Telemetry Processor...');

    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }

    // Process remaining queue
    while (this.queue.length > 0) {
      await this.processBatch();
    }

    this.logger.info('Telemetry Processor shut down');
  }
}
