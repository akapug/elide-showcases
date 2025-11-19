/**
 * Elide IoT Platform - Time Series Database
 *
 * Efficient storage and querying of IoT time series data with compression,
 * downsampling, and retention policies.
 */

import {
  TimeSeriesPoint,
  TimeSeriesQuery,
  QueryResult,
  AggregationType,
  RetentionPolicy,
  DownsamplingRule
} from '../types';

// ============================================================================
// Time Series Database Implementation
// ============================================================================

export class TimeSeriesDB {
  private data: Map<string, TimeSeriesPoint[]> = new Map();
  private indexes: Map<string, Map<string, number[]>> = new Map();
  private retentionPolicies: RetentionPolicy[] = [];
  private downsamplingRules: DownsamplingRule[] = [];
  private queryCache: Map<string, QueryResult> = new Map();
  private cacheSize: number = 0;

  constructor(private config: TimeSeriesDBConfig) {
    if (config.retention) {
      this.retentionPolicies = Array.isArray(config.retention)
        ? config.retention
        : [config.retention];
    }

    if (config.downsampling) {
      this.downsamplingRules = config.downsampling;
    }

    // Start background tasks
    this.startRetentionTask();
    this.startDownsamplingTask();
  }

  // ========================================================================
  // Write Operations
  // ========================================================================

  async write(point: TimeSeriesPoint): Promise<void> {
    const key = this.getMeasurementKey(point.measurement, point.tags);

    if (!this.data.has(key)) {
      this.data.set(key, []);
    }

    // Insert in chronological order
    const points = this.data.get(key)!;
    const insertIndex = this.findInsertIndex(points, point.timestamp);
    points.splice(insertIndex, 0, point);

    // Update indexes
    await this.updateIndexes(point);

    // Apply compression if configured
    if (this.config.compression !== 'none') {
      await this.compressIfNeeded(key);
    }
  }

  async writeBatch(points: TimeSeriesPoint[]): Promise<void> {
    // Batch writes for better performance
    for (const point of points) {
      await this.write(point);
    }
  }

  private findInsertIndex(points: TimeSeriesPoint[], timestamp: number): number {
    // Binary search for insertion point
    let left = 0;
    let right = points.length;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (points[mid].timestamp < timestamp) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    return left;
  }

  // ========================================================================
  // Query Operations
  // ========================================================================

  async query(query: TimeSeriesQuery): Promise<QueryResult> {
    const startTime = performance.now();

    // Check cache
    const cacheKey = this.getCacheKey(query);
    if (this.queryCache.has(cacheKey)) {
      const cached = this.queryCache.get(cacheKey)!;
      return {
        ...cached,
        fromCache: true
      };
    }

    // Get matching keys
    const keys = this.findMatchingKeys(query.measurement, query.tags);

    // Collect points
    let points: TimeSeriesPoint[] = [];

    for (const key of keys) {
      const seriesPoints = this.data.get(key) || [];
      const filtered = this.filterByTime(seriesPoints, query.start, query.end);
      points.push(...filtered);
    }

    // Apply field filter
    if (query.fields) {
      points = this.filterFields(points, query.fields);
    }

    // Apply aggregation
    if (query.aggregation) {
      points = await this.aggregate(points, query);
    }

    // Apply ordering
    if (query.orderBy === 'desc') {
      points.reverse();
    }

    // Apply limit and offset
    if (query.offset) {
      points = points.slice(query.offset);
    }
    if (query.limit) {
      points = points.slice(0, query.limit);
    }

    const executionTime = performance.now() - startTime;

    const result: QueryResult = {
      points,
      count: points.length,
      executionTime,
      fromCache: false
    };

    // Cache result
    this.cacheQuery(cacheKey, result);

    return result;
  }

  private findMatchingKeys(measurement: string, tags?: Record<string, string>): string[] {
    const keys: string[] = [];

    for (const key of this.data.keys()) {
      const [meas, tagStr] = key.split('::');
      if (meas !== measurement) continue;

      if (tags) {
        const keyTags = JSON.parse(tagStr);
        if (this.tagsMatch(keyTags, tags)) {
          keys.push(key);
        }
      } else {
        keys.push(key);
      }
    }

    return keys;
  }

  private tagsMatch(keyTags: Record<string, string>, queryTags: Record<string, string>): boolean {
    for (const [key, value] of Object.entries(queryTags)) {
      if (keyTags[key] !== value) {
        return false;
      }
    }
    return true;
  }

  private filterByTime(points: TimeSeriesPoint[], start: number, end: number): TimeSeriesPoint[] {
    return points.filter(p => p.timestamp >= start && p.timestamp <= end);
  }

  private filterFields(points: TimeSeriesPoint[], fields: string[]): TimeSeriesPoint[] {
    return points.map(p => ({
      ...p,
      fields: Object.fromEntries(
        Object.entries(p.fields).filter(([key]) => fields.includes(key))
      )
    }));
  }

  private async aggregate(points: TimeSeriesPoint[], query: TimeSeriesQuery): Promise<TimeSeriesPoint[]> {
    if (!query.aggregation) return points;

    // Group by time window or tags
    const groups: Map<string, TimeSeriesPoint[]> = new Map();

    if (typeof query.groupBy === 'number') {
      // Group by time window
      for (const point of points) {
        const bucket = Math.floor(point.timestamp / query.groupBy) * query.groupBy;
        const key = bucket.toString();

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(point);
      }
    } else if (typeof query.groupBy === 'string') {
      // Group by tag
      for (const point of points) {
        const key = point.tags[query.groupBy] || 'unknown';

        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(point);
      }
    } else {
      // Single group
      groups.set('all', points);
    }

    // Aggregate each group
    const aggregated: TimeSeriesPoint[] = [];

    for (const [groupKey, groupPoints] of groups) {
      if (groupPoints.length === 0) continue;

      const aggPoint = await this.aggregateGroup(groupPoints, query.aggregation);
      aggregated.push(aggPoint);
    }

    return aggregated;
  }

  private async aggregateGroup(
    points: TimeSeriesPoint[],
    aggregation: AggregationType
  ): Promise<TimeSeriesPoint> {
    const firstPoint = points[0];
    const fields: Record<string, number | string | boolean> = {};

    // Get all field names
    const fieldNames = new Set<string>();
    points.forEach(p => Object.keys(p.fields).forEach(k => fieldNames.add(k)));

    for (const fieldName of fieldNames) {
      const values = points
        .map(p => p.fields[fieldName])
        .filter(v => typeof v === 'number') as number[];

      if (values.length === 0) continue;

      switch (aggregation) {
        case AggregationType.MEAN:
          fields[fieldName] = values.reduce((a, b) => a + b, 0) / values.length;
          break;
        case AggregationType.MEDIAN:
          fields[fieldName] = this.median(values);
          break;
        case AggregationType.SUM:
          fields[fieldName] = values.reduce((a, b) => a + b, 0);
          break;
        case AggregationType.MIN:
          fields[fieldName] = Math.min(...values);
          break;
        case AggregationType.MAX:
          fields[fieldName] = Math.max(...values);
          break;
        case AggregationType.STDDEV:
          fields[fieldName] = this.stddev(values);
          break;
        case AggregationType.COUNT:
          fields[fieldName] = values.length;
          break;
        case AggregationType.FIRST:
          fields[fieldName] = values[0];
          break;
        case AggregationType.LAST:
          fields[fieldName] = values[values.length - 1];
          break;
        case AggregationType.PERCENTILE:
          fields[fieldName] = this.percentile(values, 95);
          break;
      }
    }

    return {
      measurement: firstPoint.measurement,
      tags: firstPoint.tags,
      fields,
      timestamp: points[points.length - 1].timestamp
    };
  }

  // ========================================================================
  // Compression
  // ========================================================================

  private async compressIfNeeded(key: string): Promise<void> {
    const points = this.data.get(key);
    if (!points || points.length < 100) return;

    if (this.config.compression === 'gorilla') {
      // Gorilla compression for numerical values
      // In production, implement actual Gorilla algorithm
      // For now, just a placeholder
    }
  }

  // ========================================================================
  // Retention & Downsampling
  // ========================================================================

  private startRetentionTask(): void {
    setInterval(() => {
      this.applyRetentionPolicies();
    }, 3600000); // Every hour
  }

  private startDownsamplingTask(): void {
    setInterval(() => {
      this.applyDownsampling();
    }, 3600000); // Every hour
  }

  private async applyRetentionPolicies(): Promise<void> {
    const now = Date.now();

    for (const policy of this.retentionPolicies) {
      const cutoffTime = now - policy.duration;

      for (const [key, points] of this.data) {
        const filtered = points.filter(p => p.timestamp >= cutoffTime);
        this.data.set(key, filtered);
      }
    }
  }

  private async applyDownsampling(): Promise<void> {
    const now = Date.now();

    for (const rule of this.downsamplingRules) {
      const cutoffTime = now - rule.retention;

      for (const [key, points] of this.data) {
        const oldPoints = points.filter(p => p.timestamp < cutoffTime);

        if (oldPoints.length === 0) continue;

        // Downsample old points
        const downsampled = await this.downsample(
          oldPoints,
          rule.targetResolution,
          rule.aggregation
        );

        // Replace old points with downsampled
        const newPoints = points.filter(p => p.timestamp >= cutoffTime);
        this.data.set(key, [...downsampled, ...newPoints]);
      }
    }
  }

  private async downsample(
    points: TimeSeriesPoint[],
    resolution: number,
    aggregation: AggregationType
  ): Promise<TimeSeriesPoint[]> {
    const groups: Map<number, TimeSeriesPoint[]> = new Map();

    for (const point of points) {
      const bucket = Math.floor(point.timestamp / resolution) * resolution;

      if (!groups.has(bucket)) {
        groups.set(bucket, []);
      }
      groups.get(bucket)!.push(point);
    }

    const downsampled: TimeSeriesPoint[] = [];

    for (const groupPoints of groups.values()) {
      const aggPoint = await this.aggregateGroup(groupPoints, aggregation);
      downsampled.push(aggPoint);
    }

    return downsampled;
  }

  // ========================================================================
  // Indexing
  // ========================================================================

  private async updateIndexes(point: TimeSeriesPoint): Promise<void> {
    const measurement = point.measurement;

    if (!this.indexes.has(measurement)) {
      this.indexes.set(measurement, new Map());
    }

    const measurementIndex = this.indexes.get(measurement)!;

    for (const [tagKey, tagValue] of Object.entries(point.tags)) {
      const indexKey = `${tagKey}:${tagValue}`;

      if (!measurementIndex.has(indexKey)) {
        measurementIndex.set(indexKey, []);
      }

      measurementIndex.get(indexKey)!.push(point.timestamp);
    }
  }

  // ========================================================================
  // Cache Management
  // ========================================================================

  private getCacheKey(query: TimeSeriesQuery): string {
    return JSON.stringify(query);
  }

  private cacheQuery(key: string, result: QueryResult): void {
    const size = JSON.stringify(result).length;

    if (this.cacheSize + size > this.config.cacheSize) {
      // Evict oldest entries
      const entries = Array.from(this.queryCache.entries());
      this.queryCache.delete(entries[0][0]);
    }

    this.queryCache.set(key, result);
    this.cacheSize += size;
  }

  clearCache(): void {
    this.queryCache.clear();
    this.cacheSize = 0;
  }

  // ========================================================================
  // Statistics
  // ========================================================================

  getStats(): DBStats {
    let totalPoints = 0;
    let totalSize = 0;

    for (const points of this.data.values()) {
      totalPoints += points.length;
      totalSize += JSON.stringify(points).length;
    }

    return {
      measurements: this.data.size,
      totalPoints,
      totalSize,
      cacheSize: this.cacheSize,
      cacheHits: 0, // Track in production
      cacheMisses: 0
    };
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  private getMeasurementKey(measurement: string, tags: Record<string, string>): string {
    return `${measurement}::${JSON.stringify(tags)}`;
  }

  private median(values: number[]): number {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 === 0
      ? (sorted[mid - 1] + sorted[mid]) / 2
      : sorted[mid];
  }

  private stddev(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    return Math.sqrt(variance);
  }

  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[index];
  }
}

// ============================================================================
// Supporting Types
// ============================================================================

interface TimeSeriesDBConfig {
  retention: RetentionPolicy | RetentionPolicy[];
  compression: 'none' | 'gorilla' | 'zstd';
  downsampling: DownsamplingRule[];
  cacheSize: number;
}

interface DBStats {
  measurements: number;
  totalPoints: number;
  totalSize: number;
  cacheSize: number;
  cacheHits: number;
  cacheMisses: number;
}
