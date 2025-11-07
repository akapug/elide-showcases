/**
 * Real-Time Stream Processor
 *
 * A high-performance stream processing server built with Elide.
 * Demonstrates event ingestion, windowing operations, aggregations,
 * filtering, and multi-sink output capabilities.
 *
 * Performance highlights:
 * - Zero-cold-start: Native compilation ensures instant processing
 * - Memory efficient: Minimal overhead for high-throughput streaming
 * - Fast windowing: Native performance for time-based aggregations
 * - Low latency: Sub-millisecond event processing
 */

import { serve } from "@std/http/server";

// ==================== Types ====================

interface StreamEvent {
  id: string;
  type: string;
  source: string;
  timestamp: number;
  data: Record<string, any>;
  metadata?: Record<string, any>;
}

interface Window {
  start: number;
  end: number;
  events: StreamEvent[];
}

interface AggregationResult {
  window: { start: number; end: number };
  count: number;
  sum: number;
  avg: number;
  min: number;
  max: number;
  distinctSources: number;
  eventsByType: Record<string, number>;
}

interface ProcessingStats {
  totalProcessed: number;
  totalFiltered: number;
  avgProcessingTime: number;
  throughput: number;
  lastProcessedAt: number;
}

// ==================== Stream Processor Core ====================

class StreamProcessor {
  private windows: Map<string, Window> = new Map();
  private windowSize = 60000; // 60 seconds
  private slideInterval = 10000; // 10 seconds
  private filters: Array<(event: StreamEvent) => boolean> = [];
  private transformers: Array<(event: StreamEvent) => StreamEvent> = [];
  private sinks: Array<(event: StreamEvent) => Promise<void>> = [];
  private stats: ProcessingStats = {
    totalProcessed: 0,
    totalFiltered: 0,
    avgProcessingTime: 0,
    throughput: 0,
    lastProcessedAt: Date.now()
  };

  constructor(windowSize?: number, slideInterval?: number) {
    if (windowSize) this.windowSize = windowSize;
    if (slideInterval) this.slideInterval = slideInterval;
    this.startWindowCleaner();
  }

  // Add filter predicate
  addFilter(filter: (event: StreamEvent) => boolean): void {
    this.filters.push(filter);
  }

  // Add transformation function
  addTransformer(transformer: (event: StreamEvent) => StreamEvent): void {
    this.transformers.push(transformer);
  }

  // Add output sink
  addSink(sink: (event: StreamEvent) => Promise<void>): void {
    this.sinks.push(sink);
  }

  // Process incoming event
  async processEvent(event: StreamEvent): Promise<boolean> {
    const startTime = performance.now();

    try {
      // Apply filters
      for (const filter of this.filters) {
        if (!filter(event)) {
          this.stats.totalFiltered++;
          return false;
        }
      }

      // Apply transformations
      let transformedEvent = event;
      for (const transformer of this.transformers) {
        transformedEvent = transformer(transformedEvent);
      }

      // Add to windows
      this.addToWindows(transformedEvent);

      // Send to sinks
      await Promise.all(
        this.sinks.map(sink => sink(transformedEvent).catch(err =>
          console.error('Sink error:', err)
        ))
      );

      // Update stats
      this.stats.totalProcessed++;
      const processingTime = performance.now() - startTime;
      this.stats.avgProcessingTime =
        (this.stats.avgProcessingTime * (this.stats.totalProcessed - 1) + processingTime)
        / this.stats.totalProcessed;
      this.stats.lastProcessedAt = Date.now();

      return true;
    } catch (error) {
      console.error('Event processing error:', error);
      return false;
    }
  }

  // Add event to time-based windows
  private addToWindows(event: StreamEvent): void {
    const now = event.timestamp;
    const windowKey = Math.floor(now / this.slideInterval) * this.slideInterval;

    // Add to all relevant windows
    for (let start = windowKey - this.windowSize + this.slideInterval; start <= windowKey; start += this.slideInterval) {
      if (start < 0) continue;

      const end = start + this.windowSize;
      if (now >= start && now < end) {
        const key = `${start}-${end}`;

        if (!this.windows.has(key)) {
          this.windows.set(key, { start, end, events: [] });
        }

        this.windows.get(key)!.events.push(event);
      }
    }
  }

  // Get aggregations for current windows
  getWindowAggregations(): AggregationResult[] {
    const results: AggregationResult[] = [];

    for (const [key, window] of this.windows.entries()) {
      if (window.events.length === 0) continue;

      const numericValues = window.events
        .map(e => e.data.value)
        .filter(v => typeof v === 'number');

      const eventsByType: Record<string, number> = {};
      const sources = new Set<string>();

      for (const event of window.events) {
        eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
        sources.add(event.source);
      }

      results.push({
        window: { start: window.start, end: window.end },
        count: window.events.length,
        sum: numericValues.reduce((a, b) => a + b, 0),
        avg: numericValues.length > 0
          ? numericValues.reduce((a, b) => a + b, 0) / numericValues.length
          : 0,
        min: numericValues.length > 0 ? Math.min(...numericValues) : 0,
        max: numericValues.length > 0 ? Math.max(...numericValues) : 0,
        distinctSources: sources.size,
        eventsByType
      });
    }

    return results.sort((a, b) => b.window.start - a.window.start);
  }

  // Get processing statistics
  getStats(): ProcessingStats {
    const timeSinceLastEvent = Date.now() - this.stats.lastProcessedAt;
    this.stats.throughput = this.stats.totalProcessed / (timeSinceLastEvent / 1000 || 1);
    return { ...this.stats };
  }

  // Clean up old windows
  private startWindowCleaner(): void {
    setInterval(() => {
      const now = Date.now();
      const cutoff = now - this.windowSize * 2;

      for (const [key, window] of this.windows.entries()) {
        if (window.end < cutoff) {
          this.windows.delete(key);
        }
      }
    }, this.slideInterval);
  }
}

// ==================== Example Sinks ====================

class ConsoleSink {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  async write(event: StreamEvent): Promise<void> {
    console.log(`[${this.name}] ${event.type} from ${event.source}:`, event.data);
  }
}

class MetricsSink {
  private metrics: Map<string, number> = new Map();

  async write(event: StreamEvent): Promise<void> {
    const key = `${event.type}:${event.source}`;
    this.metrics.set(key, (this.metrics.get(key) || 0) + 1);
  }

  getMetrics(): Record<string, number> {
    return Object.fromEntries(this.metrics);
  }
}

class BufferedSink {
  private buffer: StreamEvent[] = [];
  private maxSize = 100;

  async write(event: StreamEvent): Promise<void> {
    this.buffer.push(event);
    if (this.buffer.length >= this.maxSize) {
      await this.flush();
    }
  }

  async flush(): Promise<void> {
    console.log(`Flushing ${this.buffer.length} events to storage...`);
    // In production: write to database, file, or external service
    this.buffer = [];
  }

  getBufferSize(): number {
    return this.buffer.length;
  }
}

// ==================== HTTP API ====================

const processor = new StreamProcessor(60000, 10000);
const metricsSink = new MetricsSink();
const bufferedSink = new BufferedSink();

// Configure pipeline
processor.addFilter((event) => {
  // Filter out events with invalid data
  return event.data !== null && event.data !== undefined;
});

processor.addFilter((event) => {
  // Filter by event type
  return ['metric', 'log', 'trace', 'alert'].includes(event.type);
});

processor.addTransformer((event) => {
  // Add processing timestamp
  return {
    ...event,
    metadata: {
      ...event.metadata,
      processedAt: Date.now(),
      processorVersion: '1.0.0'
    }
  };
});

processor.addTransformer((event) => {
  // Enrich with derived fields
  if (event.type === 'metric' && typeof event.data.value === 'number') {
    return {
      ...event,
      data: {
        ...event.data,
        category: event.data.value > 100 ? 'high' : event.data.value > 50 ? 'medium' : 'low'
      }
    };
  }
  return event;
});

// Configure sinks
processor.addSink(async (event) => await metricsSink.write(event));
processor.addSink(async (event) => await bufferedSink.write(event));

// HTTP request handler
async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const path = url.pathname;

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  };

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers });
  }

  try {
    // POST /events - Ingest event
    if (path === '/events' && req.method === 'POST') {
      const event: StreamEvent = await req.json();

      // Validate event
      if (!event.id || !event.type || !event.source || !event.timestamp) {
        return new Response(
          JSON.stringify({ error: 'Invalid event format' }),
          { status: 400, headers }
        );
      }

      const processed = await processor.processEvent(event);

      return new Response(
        JSON.stringify({
          success: processed,
          message: processed ? 'Event processed' : 'Event filtered'
        }),
        { status: processed ? 200 : 202, headers }
      );
    }

    // POST /events/batch - Batch ingest
    if (path === '/events/batch' && req.method === 'POST') {
      const events: StreamEvent[] = await req.json();

      const results = await Promise.all(
        events.map(e => processor.processEvent(e))
      );

      const processed = results.filter(r => r).length;

      return new Response(
        JSON.stringify({
          total: events.length,
          processed,
          filtered: events.length - processed
        }),
        { headers }
      );
    }

    // GET /aggregations - Get window aggregations
    if (path === '/aggregations' && req.method === 'GET') {
      const aggregations = processor.getWindowAggregations();
      return new Response(
        JSON.stringify({ aggregations, count: aggregations.length }),
        { headers }
      );
    }

    // GET /stats - Get processing stats
    if (path === '/stats' && req.method === 'GET') {
      const stats = processor.getStats();
      const metrics = metricsSink.getMetrics();
      const bufferSize = bufferedSink.getBufferSize();

      return new Response(
        JSON.stringify({ stats, metrics, bufferSize }),
        { headers }
      );
    }

    // GET /health - Health check
    if (path === '/health' && req.method === 'GET') {
      return new Response(
        JSON.stringify({
          status: 'healthy',
          uptime: process.uptime?.() || 0,
          memory: process.memoryUsage?.() || {}
        }),
        { headers }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Not found' }),
      { status: 404, headers }
    );

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers }
    );
  }
}

// Start server
const port = Number(Deno.env.get('PORT')) || 8000;
console.log(`Stream Processor starting on port ${port}...`);
console.log(`Window size: ${60}s, Slide interval: ${10}s`);

serve(handler, { port });
