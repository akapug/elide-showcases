/**
 * Analytics query API providing access to real-time insights.
 * Leverages direct DataFrame access for <100ms query latency.
 */

import Fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { EventBuffer } from './event-buffer';

export interface AnalyticsConfig {
  port: number;
  host: string;
}

export interface AggregationQuery {
  groupBy: string[];
  metrics: string[];
}

export interface WindowQuery {
  windowSize: string;
  groupBy: string;
  metric: string;
  aggFunc?: 'sum' | 'mean' | 'count' | 'min' | 'max';
}

export interface TopNQuery {
  groupBy: string;
  metric: string;
  n?: number;
}

export class AnalyticsAPI {
  private server: FastifyInstance;
  private buffer: EventBuffer;
  private config: AnalyticsConfig;

  constructor(buffer: EventBuffer, config: Partial<AnalyticsConfig> = {}) {
    this.buffer = buffer;
    this.config = {
      port: config.port || 3001,
      host: config.host || '0.0.0.0'
    };

    this.server = Fastify({
      logger: true,
      requestIdLogLabel: 'reqId'
    });

    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Enable CORS
    this.server.register(cors, {
      origin: true
    });

    // Health check
    this.server.get('/health', async () => {
      return {
        status: 'healthy',
        timestamp: Date.now()
      };
    });

    // Get real-time aggregations
    this.server.post<{ Body: AggregationQuery }>(
      '/query/aggregate',
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const { groupBy, metrics } = request.body;

          if (!groupBy || !metrics) {
            return reply.code(400).send({ error: 'Missing groupBy or metrics' });
          }

          const analytics = this.buffer.getAnalytics();
          const results = await analytics.computeAggregations(groupBy, metrics);

          const queryTime = Date.now() - startTime;

          return {
            results,
            query_time_ms: queryTime,
            timestamp: Date.now()
          };
        } catch (error: any) {
          return reply.code(500).send({ error: error.message });
        }
      }
    );

    // Get time-windowed aggregations
    this.server.post<{ Body: WindowQuery }>(
      '/query/window',
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const config = request.body;

          if (!config.windowSize || !config.groupBy || !config.metric) {
            return reply.code(400).send({ error: 'Missing required parameters' });
          }

          const analytics = this.buffer.getAnalytics();
          const results = await analytics.windowedAggregation(config);

          const queryTime = Date.now() - startTime;

          return {
            results,
            query_time_ms: queryTime,
            timestamp: Date.now()
          };
        } catch (error: any) {
          return reply.code(500).send({ error: error.message });
        }
      }
    );

    // Get percentiles (for latency analysis)
    this.server.get<{ Querystring: { column: string; percentiles?: string } }>(
      '/query/percentiles',
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const { column, percentiles } = request.query;

          if (!column) {
            return reply.code(400).send({ error: 'Missing column parameter' });
          }

          const percentileArray = percentiles
            ? percentiles.split(',').map(p => parseFloat(p))
            : [0.5, 0.95, 0.99];

          const analytics = this.buffer.getAnalytics();
          const results = await analytics.calculatePercentiles(column, percentileArray);

          const queryTime = Date.now() - startTime;

          return {
            column,
            percentiles: results,
            query_time_ms: queryTime,
            timestamp: Date.now()
          };
        } catch (error: any) {
          return reply.code(500).send({ error: error.message });
        }
      }
    );

    // Detect anomalies
    this.server.get<{ Querystring: { column: string; threshold?: string } }>(
      '/query/anomalies',
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const { column, threshold } = request.query;

          if (!column) {
            return reply.code(400).send({ error: 'Missing column parameter' });
          }

          const thresholdValue = threshold ? parseFloat(threshold) : 3.0;

          const analytics = this.buffer.getAnalytics();
          const anomalies = await analytics.detectAnomalies(column, thresholdValue);

          const queryTime = Date.now() - startTime;

          return {
            anomalies,
            count: anomalies.length,
            query_time_ms: queryTime,
            timestamp: Date.now()
          };
        } catch (error: any) {
          return reply.code(500).send({ error: error.message });
        }
      }
    );

    // Get top N by metric
    this.server.post<{ Body: TopNQuery }>(
      '/query/top-n',
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const { groupBy, metric, n = 10 } = request.body;

          if (!groupBy || !metric) {
            return reply.code(400).send({ error: 'Missing groupBy or metric' });
          }

          const analytics = this.buffer.getAnalytics();
          const results = await analytics.topNByMetric(groupBy, metric, n);

          const queryTime = Date.now() - startTime;

          return {
            results,
            query_time_ms: queryTime,
            timestamp: Date.now()
          };
        } catch (error: any) {
          return reply.code(500).send({ error: error.message });
        }
      }
    );

    // Get conversion funnel
    this.server.post<{ Body: { eventSequence: string[]; userCol?: string } }>(
      '/query/funnel',
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const { eventSequence, userCol = 'user_id' } = request.body;

          if (!eventSequence || eventSequence.length === 0) {
            return reply.code(400).send({ error: 'Missing eventSequence' });
          }

          const analytics = this.buffer.getAnalytics();
          const funnel = await analytics.conversionFunnel(eventSequence, userCol);

          const queryTime = Date.now() - startTime;

          return {
            funnel,
            query_time_ms: queryTime,
            timestamp: Date.now()
          };
        } catch (error: any) {
          return reply.code(500).send({ error: error.message });
        }
      }
    );

    // Get summary statistics
    this.server.get<{ Querystring: { columns?: string } }>(
      '/query/summary',
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const { columns } = request.query;
          const columnArray = columns ? columns.split(',') : undefined;

          const analytics = this.buffer.getAnalytics();
          const stats = await analytics.getSummaryStats(columnArray);

          const queryTime = Date.now() - startTime;

          return {
            stats,
            query_time_ms: queryTime,
            timestamp: Date.now()
          };
        } catch (error: any) {
          return reply.code(500).send({ error: error.message });
        }
      }
    );

    // Real-time dashboard metrics (combined query)
    this.server.get('/dashboard/metrics', async (request, reply) => {
      const startTime = Date.now();

      try {
        const analytics = this.buffer.getAnalytics();

        // Execute multiple queries in parallel
        const [summary, topUsers, topEvents] = await Promise.all([
          analytics.getSummaryStats(['value']),
          analytics.topNByMetric('user_id', 'value', 5),
          analytics.topNByMetric('event_type', 'value', 5)
        ]);

        const queryTime = Date.now() - startTime;

        return {
          summary,
          top_users: topUsers,
          top_events: topEvents,
          query_time_ms: queryTime,
          timestamp: Date.now()
        };
      } catch (error: any) {
        return reply.code(500).send({ error: error.message });
      }
    });
  }

  async start(): Promise<void> {
    try {
      await this.server.listen({
        port: this.config.port,
        host: this.config.host
      });
      console.log(`Analytics API listening on ${this.config.host}:${this.config.port}`);
    } catch (error) {
      console.error('Failed to start analytics API:', error);
      throw error;
    }
  }

  async stop(): Promise<void> {
    await this.server.close();
  }

  getServer(): FastifyInstance {
    return this.server;
  }
}
