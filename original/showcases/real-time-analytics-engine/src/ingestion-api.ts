/**
 * High-performance event ingestion API using Fastify.
 * Handles 50K+ events/sec with minimal latency.
 */

import Fastify, { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import cors from '@fastify/cors';
import { Event } from '../bridge/dataframe-bridge';
import { EventBuffer } from './event-buffer';

export interface IngestionConfig {
  port: number;
  host: string;
  bufferSize: number;
  flushInterval: number;
}

export interface BatchIngestionRequest {
  events: Event[];
}

export interface IngestionResponse {
  accepted: number;
  buffered: number;
  timestamp: number;
}

export class IngestionAPI {
  private server: FastifyInstance;
  private buffer: EventBuffer;
  private config: IngestionConfig;
  private metricsCollector: MetricsCollector;

  constructor(buffer: EventBuffer, config: Partial<IngestionConfig> = {}) {
    this.buffer = buffer;
    this.config = {
      port: config.port || 3000,
      host: config.host || '0.0.0.0',
      bufferSize: config.bufferSize || 10000,
      flushInterval: config.flushInterval || 1000
    };

    this.server = Fastify({
      logger: true,
      requestIdLogLabel: 'reqId',
      disableRequestLogging: false,
      bodyLimit: 10485760 // 10MB
    });

    this.metricsCollector = new MetricsCollector();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // Enable CORS
    this.server.register(cors, {
      origin: true
    });

    // Health check
    this.server.get('/health', async (request, reply) => {
      return {
        status: 'healthy',
        timestamp: Date.now(),
        buffered: this.buffer.size(),
        uptime: process.uptime()
      };
    });

    // Single event ingestion
    this.server.post<{ Body: Event }>(
      '/ingest',
      {
        schema: {
          body: {
            type: 'object',
            required: ['timestamp', 'event_type', 'user_id', 'value'],
            properties: {
              timestamp: { type: 'number' },
              event_type: { type: 'string' },
              user_id: { type: 'string' },
              value: { type: 'number' },
              metadata: { type: 'object' }
            }
          }
        }
      },
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const event = request.body;
          await this.buffer.add(event);

          this.metricsCollector.recordIngestion(1, Date.now() - startTime);

          return {
            accepted: 1,
            buffered: this.buffer.size(),
            timestamp: Date.now()
          };
        } catch (error) {
          this.metricsCollector.recordError();
          reply.code(500).send({ error: 'Failed to ingest event' });
        }
      }
    );

    // Batch event ingestion (high throughput)
    this.server.post<{ Body: BatchIngestionRequest }>(
      '/ingest/batch',
      {
        schema: {
          body: {
            type: 'object',
            required: ['events'],
            properties: {
              events: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['timestamp', 'event_type', 'user_id', 'value'],
                  properties: {
                    timestamp: { type: 'number' },
                    event_type: { type: 'string' },
                    user_id: { type: 'string' },
                    value: { type: 'number' },
                    metadata: { type: 'object' }
                  }
                }
              }
            }
          }
        }
      },
      async (request, reply) => {
        const startTime = Date.now();

        try {
          const { events } = request.body;

          if (!events || events.length === 0) {
            return reply.code(400).send({ error: 'No events provided' });
          }

          if (events.length > 10000) {
            return reply.code(400).send({ error: 'Batch size too large (max 10000)' });
          }

          await this.buffer.addBatch(events);

          const latency = Date.now() - startTime;
          this.metricsCollector.recordIngestion(events.length, latency);

          return {
            accepted: events.length,
            buffered: this.buffer.size(),
            timestamp: Date.now(),
            latency
          };
        } catch (error) {
          this.metricsCollector.recordError();
          reply.code(500).send({ error: 'Failed to ingest batch' });
        }
      }
    );

    // Get ingestion metrics
    this.server.get('/metrics/ingestion', async (request, reply) => {
      return this.metricsCollector.getMetrics();
    });

    // Get buffer status
    this.server.get('/status/buffer', async (request, reply) => {
      return {
        size: this.buffer.size(),
        capacity: this.config.bufferSize,
        utilization: (this.buffer.size() / this.config.bufferSize) * 100
      };
    });

    // Graceful shutdown hook
    this.server.addHook('onClose', async () => {
      console.log('Flushing buffer before shutdown...');
      await this.buffer.flush();
    });
  }

  async start(): Promise<void> {
    try {
      await this.server.listen({
        port: this.config.port,
        host: this.config.host
      });
      console.log(`Ingestion API listening on ${this.config.host}:${this.config.port}`);
    } catch (error) {
      console.error('Failed to start ingestion API:', error);
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

/**
 * Metrics collector for tracking ingestion performance.
 */
class MetricsCollector {
  private totalEvents = 0;
  private totalLatency = 0;
  private errorCount = 0;
  private startTime = Date.now();
  private latencies: number[] = [];
  private maxLatencyHistorySize = 1000;

  recordIngestion(count: number, latency: number): void {
    this.totalEvents += count;
    this.totalLatency += latency;
    this.latencies.push(latency);

    // Keep only recent latencies
    if (this.latencies.length > this.maxLatencyHistorySize) {
      this.latencies.shift();
    }
  }

  recordError(): void {
    this.errorCount++;
  }

  getMetrics() {
    const uptime = (Date.now() - this.startTime) / 1000;
    const avgLatency = this.totalEvents > 0 ? this.totalLatency / this.totalEvents : 0;
    const throughput = uptime > 0 ? this.totalEvents / uptime : 0;

    // Calculate percentiles
    const sortedLatencies = [...this.latencies].sort((a, b) => a - b);
    const p50 = this.percentile(sortedLatencies, 0.5);
    const p95 = this.percentile(sortedLatencies, 0.95);
    const p99 = this.percentile(sortedLatencies, 0.99);

    return {
      total_events: this.totalEvents,
      error_count: this.errorCount,
      uptime_seconds: uptime,
      throughput_per_second: Math.round(throughput),
      latency: {
        average_ms: Math.round(avgLatency * 100) / 100,
        p50_ms: p50,
        p95_ms: p95,
        p99_ms: p99
      }
    };
  }

  private percentile(sortedArray: number[], p: number): number {
    if (sortedArray.length === 0) return 0;
    const index = Math.ceil(sortedArray.length * p) - 1;
    return Math.round(sortedArray[index] * 100) / 100;
  }
}
