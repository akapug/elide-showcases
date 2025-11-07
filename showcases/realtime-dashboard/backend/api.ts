/**
 * REST API
 *
 * Provides HTTP endpoints for accessing metrics data.
 * Supports historical data queries, aggregations, and time-series data.
 */

import { metricsCollector } from './metrics-collector.ts';
import { dataAggregator } from './data-aggregator.ts';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: number;
}

export interface ApiRequest {
  method: string;
  path: string;
  query: Record<string, string>;
  body?: any;
}

/**
 * API Handler class
 * Routes requests to appropriate handlers and formats responses
 */
export class ApiHandler {
  /**
   * Handle incoming API requests
   */
  public async handleRequest(request: ApiRequest): Promise<ApiResponse> {
    try {
      const { method, path, query } = request;

      // Route to appropriate handler
      if (method === 'GET') {
        if (path === '/api/metrics/current') {
          return this.getCurrentMetrics();
        } else if (path === '/api/metrics/system/history') {
          return this.getSystemMetricsHistory(query);
        } else if (path === '/api/metrics/application/history') {
          return this.getApplicationMetricsHistory(query);
        } else if (path === '/api/metrics/timeseries') {
          return this.getTimeSeries(query);
        } else if (path === '/api/metrics/aggregate') {
          return this.getAggregatedMetrics(query);
        } else if (path === '/api/metrics/anomalies') {
          return this.getAnomalies(query);
        } else if (path === '/api/metrics/summary') {
          return this.getSummary(query);
        } else if (path === '/api/health') {
          return this.getHealth();
        } else if (path === '/api/stats') {
          return this.getStats();
        }
      } else if (method === 'POST') {
        if (path === '/api/metrics/simulate') {
          return this.simulateTraffic();
        }
      }

      return this.errorResponse('Not found', 404);
    } catch (error) {
      return this.errorResponse(
        error instanceof Error ? error.message : 'Internal server error',
        500
      );
    }
  }

  /**
   * Get current metrics (real-time snapshot)
   */
  private async getCurrentMetrics(): Promise<ApiResponse> {
    const systemMetrics = await metricsCollector.collectSystemMetrics();
    const appMetrics = metricsCollector.collectApplicationMetrics();

    return this.successResponse({
      system: systemMetrics,
      application: appMetrics,
    });
  }

  /**
   * Get system metrics history
   */
  private getSystemMetricsHistory(query: Record<string, string>): ApiResponse {
    const limit = query.limit ? parseInt(query.limit, 10) : 100;
    const history = metricsCollector.getSystemMetricsHistory(limit);

    return this.successResponse({
      metrics: history,
      count: history.length,
    });
  }

  /**
   * Get application metrics history
   */
  private getApplicationMetricsHistory(query: Record<string, string>): ApiResponse {
    const limit = query.limit ? parseInt(query.limit, 10) : 100;
    const history = metricsCollector.getApplicationMetricsHistory(limit);

    return this.successResponse({
      metrics: history,
      count: history.length,
    });
  }

  /**
   * Get time series data
   */
  private getTimeSeries(query: Record<string, string>): ApiResponse {
    const metricPath = query.metric || 'cpu.usage';
    const startTime = query.startTime ? parseInt(query.startTime, 10) : undefined;
    const endTime = query.endTime ? parseInt(query.endTime, 10) : undefined;
    const type = query.type || 'system'; // 'system' or 'application'

    let data;
    if (type === 'application') {
      data = dataAggregator.getApplicationTimeSeries(metricPath, startTime, endTime);
    } else {
      data = dataAggregator.getTimeSeries(metricPath, startTime, endTime);
    }

    // Calculate moving average if requested
    let movingAverage;
    if (query.ma) {
      const windowSize = parseInt(query.ma, 10);
      movingAverage = dataAggregator.calculateMovingAverage(data, windowSize);
    }

    return this.successResponse({
      metric: metricPath,
      type,
      data,
      movingAverage,
      count: data.length,
    });
  }

  /**
   * Get aggregated metrics
   */
  private getAggregatedMetrics(query: Record<string, string>): ApiResponse {
    const now = Date.now();
    const minutes = query.minutes ? parseInt(query.minutes, 10) : 5;
    const startTime = query.startTime
      ? parseInt(query.startTime, 10)
      : now - minutes * 60 * 1000;
    const endTime = query.endTime ? parseInt(query.endTime, 10) : now;

    const aggregated = dataAggregator.aggregateMetrics(
      startTime,
      endTime,
      query.window || `${minutes}m`
    );

    if (!aggregated) {
      return this.errorResponse('No data available for the specified time range', 404);
    }

    return this.successResponse(aggregated);
  }

  /**
   * Get anomalies
   */
  private getAnomalies(query: Record<string, string>): ApiResponse {
    const metricPath = query.metric || 'cpu.usage';
    const threshold = query.threshold ? parseFloat(query.threshold) : 2.5;
    const minutes = query.minutes ? parseInt(query.minutes, 10) : 30;
    const type = query.type || 'system';

    const now = Date.now();
    const startTime = now - minutes * 60 * 1000;

    let data;
    if (type === 'application') {
      data = dataAggregator.getApplicationTimeSeries(metricPath, startTime, now);
    } else {
      data = dataAggregator.getTimeSeries(metricPath, startTime, now);
    }

    const anomalies = dataAggregator.detectAnomalies(data, threshold);
    const detectedAnomalies = anomalies.filter(a => a.isAnomaly);

    return this.successResponse({
      metric: metricPath,
      type,
      threshold,
      timeRange: { startTime, endTime: now },
      totalDataPoints: anomalies.length,
      anomaliesDetected: detectedAnomalies.length,
      anomalies: detectedAnomalies,
    });
  }

  /**
   * Get summary statistics
   */
  private getSummary(query: Record<string, string>): ApiResponse {
    const minutes = query.minutes ? parseInt(query.minutes, 10) : 5;
    const summary = dataAggregator.getSummaryStatistics(minutes);

    // Count total anomalies
    const totalAnomalies =
      summary.anomalies.cpu.filter(a => a.isAnomaly).length +
      summary.anomalies.memory.filter(a => a.isAnomaly).length +
      summary.anomalies.latency.filter(a => a.isAnomaly).length;

    // Get high severity anomalies
    const highSeverityAnomalies = [
      ...summary.anomalies.cpu.filter(a => a.severity === 'high'),
      ...summary.anomalies.memory.filter(a => a.severity === 'high'),
      ...summary.anomalies.latency.filter(a => a.severity === 'high'),
    ];

    return this.successResponse({
      timeWindow: `${minutes} minutes`,
      aggregated: summary.system,
      anomalyCount: {
        total: totalAnomalies,
        high: highSeverityAnomalies.length,
        medium: totalAnomalies - highSeverityAnomalies.length,
      },
      highSeverityAnomalies: highSeverityAnomalies.slice(0, 10), // Top 10
      dataStats: dataAggregator.getDataSummary(),
    });
  }

  /**
   * Get health status
   */
  private getHealth(): ApiResponse {
    const stats = dataAggregator.getDataSummary();

    return this.successResponse({
      status: 'healthy',
      uptime: process.uptime ? process.uptime() : 0,
      dataStats: stats,
    });
  }

  /**
   * Get statistics
   */
  private getStats(): ApiResponse {
    const dataStats = dataAggregator.getDataSummary();

    return this.successResponse({
      collector: {
        systemMetricsCount: dataStats.systemMetricsCount,
        appMetricsCount: dataStats.appMetricsCount,
      },
      timeRange: {
        oldest: dataStats.oldestTimestamp,
        newest: dataStats.newestTimestamp,
        spanMs: dataStats.newestTimestamp && dataStats.oldestTimestamp
          ? dataStats.newestTimestamp - dataStats.oldestTimestamp
          : 0,
      },
    });
  }

  /**
   * Simulate traffic (for demo purposes)
   */
  private simulateTraffic(): ApiResponse {
    metricsCollector.simulateTraffic();
    return this.successResponse({ message: 'Traffic simulation triggered' });
  }

  /**
   * Create success response
   */
  private successResponse(data: any): ApiResponse {
    return {
      success: true,
      data,
      timestamp: Date.now(),
    };
  }

  /**
   * Create error response
   */
  private errorResponse(message: string, code: number = 500): ApiResponse {
    return {
      success: false,
      error: message,
      timestamp: Date.now(),
    };
  }
}

/**
 * Create a singleton instance
 */
export const apiHandler = new ApiHandler();

/**
 * Simple request parser for testing
 */
export function parseRequest(
  method: string,
  url: string,
  body?: any
): ApiRequest {
  const urlParts = url.split('?');
  const path = urlParts[0];
  const queryString = urlParts[1] || '';

  const query: Record<string, string> = {};
  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=');
      if (key && value) {
        query[decodeURIComponent(key)] = decodeURIComponent(value);
      }
    });
  }

  return {
    method,
    path,
    query,
    body,
  };
}
