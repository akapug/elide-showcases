/**
 * Data Aggregator
 *
 * Aggregates metrics over different time windows and provides statistical analysis.
 * Supports real-time aggregation, moving averages, and time-series data preparation.
 */

import {
  SystemMetrics,
  ApplicationMetrics,
  CpuMetrics,
  MemoryMetrics,
  LatencyMetrics,
} from './metrics-collector.ts';

export interface AggregatedMetrics {
  timeWindow: string;
  startTime: number;
  endTime: number;
  dataPoints: number;
  cpu: AggregatedCpuMetrics;
  memory: AggregatedMemoryMetrics;
  application: AggregatedApplicationMetrics;
}

export interface AggregatedCpuMetrics {
  avgUsage: number;
  minUsage: number;
  maxUsage: number;
  avgLoadAverage: number[];
}

export interface AggregatedMemoryMetrics {
  avgUsagePercent: number;
  minUsagePercent: number;
  maxUsagePercent: number;
  avgUsedBytes: number;
}

export interface AggregatedApplicationMetrics {
  totalRequests: number;
  avgRequestRate: number;
  totalErrors: number;
  avgErrorRate: number;
  errorRatio: number;
  avgLatency: number;
  p95Latency: number;
  p99Latency: number;
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
}

export interface MovingAverageResult {
  timestamp: number;
  actual: number;
  ma: number;
  deviation: number;
}

export interface AnomalyDetectionResult {
  timestamp: number;
  value: number;
  isAnomaly: boolean;
  severity: 'low' | 'medium' | 'high';
  reason: string;
}

/**
 * DataAggregator class
 * Handles metric aggregation, time-series analysis, and anomaly detection
 */
export class DataAggregator {
  private systemMetrics: SystemMetrics[] = [];
  private appMetrics: ApplicationMetrics[] = [];

  /**
   * Add system metrics to the aggregator
   */
  public addSystemMetrics(metrics: SystemMetrics): void {
    this.systemMetrics.push(metrics);
    // Keep only last 10,000 data points to prevent memory issues
    if (this.systemMetrics.length > 10000) {
      this.systemMetrics = this.systemMetrics.slice(-5000);
    }
  }

  /**
   * Add application metrics to the aggregator
   */
  public addApplicationMetrics(metrics: ApplicationMetrics): void {
    this.appMetrics.push(metrics);
    if (this.appMetrics.length > 10000) {
      this.appMetrics = this.appMetrics.slice(-5000);
    }
  }

  /**
   * Aggregate metrics over a time window
   */
  public aggregateMetrics(
    startTime: number,
    endTime: number,
    timeWindow: string = 'custom'
  ): AggregatedMetrics | null {
    const systemData = this.systemMetrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );
    const appData = this.appMetrics.filter(
      m => m.timestamp >= startTime && m.timestamp <= endTime
    );

    if (systemData.length === 0 && appData.length === 0) {
      return null;
    }

    return {
      timeWindow,
      startTime,
      endTime,
      dataPoints: systemData.length,
      cpu: this.aggregateCpuMetrics(systemData),
      memory: this.aggregateMemoryMetrics(systemData),
      application: this.aggregateApplicationMetrics(appData),
    };
  }

  /**
   * Aggregate CPU metrics
   */
  private aggregateCpuMetrics(metrics: SystemMetrics[]): AggregatedCpuMetrics {
    if (metrics.length === 0) {
      return {
        avgUsage: 0,
        minUsage: 0,
        maxUsage: 0,
        avgLoadAverage: [0, 0, 0],
      };
    }

    const cpuUsages = metrics.map(m => m.cpu.usage);
    const loadAverages = [0, 0, 0];

    metrics.forEach(m => {
      m.cpu.loadAverage.forEach((load, idx) => {
        loadAverages[idx] += load;
      });
    });

    return {
      avgUsage: this.average(cpuUsages),
      minUsage: Math.min(...cpuUsages),
      maxUsage: Math.max(...cpuUsages),
      avgLoadAverage: loadAverages.map(sum => sum / metrics.length),
    };
  }

  /**
   * Aggregate memory metrics
   */
  private aggregateMemoryMetrics(metrics: SystemMetrics[]): AggregatedMemoryMetrics {
    if (metrics.length === 0) {
      return {
        avgUsagePercent: 0,
        minUsagePercent: 0,
        maxUsagePercent: 0,
        avgUsedBytes: 0,
      };
    }

    const usagePercents = metrics.map(m => m.memory.usagePercent);
    const usedBytes = metrics.map(m => m.memory.used);

    return {
      avgUsagePercent: this.average(usagePercents),
      minUsagePercent: Math.min(...usagePercents),
      maxUsagePercent: Math.max(...usagePercents),
      avgUsedBytes: this.average(usedBytes),
    };
  }

  /**
   * Aggregate application metrics
   */
  private aggregateApplicationMetrics(
    metrics: ApplicationMetrics[]
  ): AggregatedApplicationMetrics {
    if (metrics.length === 0) {
      return {
        totalRequests: 0,
        avgRequestRate: 0,
        totalErrors: 0,
        avgErrorRate: 0,
        errorRatio: 0,
        avgLatency: 0,
        p95Latency: 0,
        p99Latency: 0,
      };
    }

    const totalRequests = metrics.reduce((sum, m) => sum + m.requests.total, 0);
    const totalErrors = metrics.reduce((sum, m) => sum + m.errors.total, 0);
    const avgRequestRate = this.average(metrics.map(m => m.requests.rate));
    const avgErrorRate = this.average(metrics.map(m => m.errors.rate));
    const avgLatency = this.average(metrics.map(m => m.latency.average));
    const p95Latencies = metrics.map(m => m.latency.p95).filter(l => l > 0);
    const p99Latencies = metrics.map(m => m.latency.p99).filter(l => l > 0);

    return {
      totalRequests,
      avgRequestRate,
      totalErrors,
      avgErrorRate,
      errorRatio: totalRequests > 0 ? totalErrors / totalRequests : 0,
      avgLatency,
      p95Latency: p95Latencies.length > 0 ? this.average(p95Latencies) : 0,
      p99Latency: p99Latencies.length > 0 ? this.average(p99Latencies) : 0,
    };
  }

  /**
   * Get time series data for a specific metric
   */
  public getTimeSeries(
    metricPath: string,
    startTime?: number,
    endTime?: number
  ): TimeSeriesPoint[] {
    const now = Date.now();
    const start = startTime || now - 3600000; // Default: last hour
    const end = endTime || now;

    const filteredMetrics = this.systemMetrics.filter(
      m => m.timestamp >= start && m.timestamp <= end
    );

    return filteredMetrics.map(m => ({
      timestamp: m.timestamp,
      value: this.getMetricValue(m, metricPath),
    }));
  }

  /**
   * Get application time series data
   */
  public getApplicationTimeSeries(
    metricPath: string,
    startTime?: number,
    endTime?: number
  ): TimeSeriesPoint[] {
    const now = Date.now();
    const start = startTime || now - 3600000;
    const end = endTime || now;

    const filteredMetrics = this.appMetrics.filter(
      m => m.timestamp >= start && m.timestamp <= end
    );

    return filteredMetrics.map(m => ({
      timestamp: m.timestamp,
      value: this.getAppMetricValue(m, metricPath),
    }));
  }

  /**
   * Calculate moving average
   */
  public calculateMovingAverage(
    data: TimeSeriesPoint[],
    windowSize: number
  ): MovingAverageResult[] {
    if (data.length < windowSize) {
      return data.map(d => ({
        timestamp: d.timestamp,
        actual: d.value,
        ma: d.value,
        deviation: 0,
      }));
    }

    const results: MovingAverageResult[] = [];

    for (let i = 0; i < data.length; i++) {
      const start = Math.max(0, i - windowSize + 1);
      const window = data.slice(start, i + 1);
      const ma = this.average(window.map(p => p.value));
      const deviation = data[i].value - ma;

      results.push({
        timestamp: data[i].timestamp,
        actual: data[i].value,
        ma,
        deviation,
      });
    }

    return results;
  }

  /**
   * Detect anomalies using statistical methods
   */
  public detectAnomalies(
    data: TimeSeriesPoint[],
    threshold: number = 2.5
  ): AnomalyDetectionResult[] {
    if (data.length < 10) {
      return data.map(d => ({
        timestamp: d.timestamp,
        value: d.value,
        isAnomaly: false,
        severity: 'low' as const,
        reason: 'Insufficient data',
      }));
    }

    const values = data.map(d => d.value);
    const mean = this.average(values);
    const stdDev = this.standardDeviation(values);

    return data.map(d => {
      const zScore = Math.abs((d.value - mean) / stdDev);
      const isAnomaly = zScore > threshold;

      let severity: 'low' | 'medium' | 'high' = 'low';
      if (zScore > threshold * 1.5) {
        severity = 'high';
      } else if (zScore > threshold) {
        severity = 'medium';
      }

      return {
        timestamp: d.timestamp,
        value: d.value,
        isAnomaly,
        severity,
        reason: isAnomaly
          ? `Value deviates ${zScore.toFixed(2)} standard deviations from mean`
          : 'Normal',
      };
    });
  }

  /**
   * Calculate percentiles for a dataset
   */
  public calculatePercentiles(
    values: number[],
    percentiles: number[]
  ): Record<string, number> {
    if (values.length === 0) {
      return {};
    }

    const sorted = [...values].sort((a, b) => a - b);
    const result: Record<string, number> = {};

    percentiles.forEach(p => {
      const index = Math.ceil(sorted.length * (p / 100)) - 1;
      result[`p${p}`] = sorted[Math.max(0, index)];
    });

    return result;
  }

  /**
   * Get summary statistics for recent metrics
   */
  public getSummaryStatistics(minutes: number = 5): {
    system: AggregatedMetrics | null;
    anomalies: {
      cpu: AnomalyDetectionResult[];
      memory: AnomalyDetectionResult[];
      latency: AnomalyDetectionResult[];
    };
  } {
    const now = Date.now();
    const startTime = now - minutes * 60 * 1000;

    const aggregated = this.aggregateMetrics(startTime, now, `${minutes}m`);

    // Detect anomalies in recent data
    const cpuData = this.getTimeSeries('cpu.usage', startTime, now);
    const memoryData = this.getTimeSeries('memory.usagePercent', startTime, now);
    const latencyData = this.getApplicationTimeSeries('latency.average', startTime, now);

    return {
      system: aggregated,
      anomalies: {
        cpu: this.detectAnomalies(cpuData),
        memory: this.detectAnomalies(memoryData),
        latency: this.detectAnomalies(latencyData),
      },
    };
  }

  /**
   * Get metric value from nested path (e.g., "cpu.usage")
   */
  private getMetricValue(metrics: SystemMetrics, path: string): number {
    const parts = path.split('.');
    let value: any = metrics;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) {
        return 0;
      }
    }

    return typeof value === 'number' ? value : 0;
  }

  /**
   * Get application metric value from nested path
   */
  private getAppMetricValue(metrics: ApplicationMetrics, path: string): number {
    const parts = path.split('.');
    let value: any = metrics;

    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) {
        return 0;
      }
    }

    return typeof value === 'number' ? value : 0;
  }

  /**
   * Calculate average of an array
   */
  private average(values: number[]): number {
    if (values.length === 0) return 0;
    return values.reduce((sum, val) => sum + val, 0) / values.length;
  }

  /**
   * Calculate standard deviation
   */
  private standardDeviation(values: number[]): number {
    if (values.length === 0) return 0;
    const avg = this.average(values);
    const squareDiffs = values.map(value => Math.pow(value - avg, 2));
    const avgSquareDiff = this.average(squareDiffs);
    return Math.sqrt(avgSquareDiff);
  }

  /**
   * Clear old data
   */
  public clearOldData(olderThan: number): void {
    this.systemMetrics = this.systemMetrics.filter(m => m.timestamp > olderThan);
    this.appMetrics = this.appMetrics.filter(m => m.timestamp > olderThan);
  }

  /**
   * Get data summary
   */
  public getDataSummary(): {
    systemMetricsCount: number;
    appMetricsCount: number;
    oldestTimestamp: number | null;
    newestTimestamp: number | null;
  } {
    const allTimestamps = [
      ...this.systemMetrics.map(m => m.timestamp),
      ...this.appMetrics.map(m => m.timestamp),
    ];

    return {
      systemMetricsCount: this.systemMetrics.length,
      appMetricsCount: this.appMetrics.length,
      oldestTimestamp: allTimestamps.length > 0 ? Math.min(...allTimestamps) : null,
      newestTimestamp: allTimestamps.length > 0 ? Math.max(...allTimestamps) : null,
    };
  }
}

/**
 * Create a singleton instance
 */
export const dataAggregator = new DataAggregator();
