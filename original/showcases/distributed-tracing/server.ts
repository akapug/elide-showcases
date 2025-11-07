/**
 * Distributed Tracing System with Elide
 *
 * Demonstrates distributed tracing patterns including:
 * - Trace collection and storage
 * - Span tracking across services
 * - Correlation IDs for request tracking
 * - Visualization and query API
 * - Performance analysis and metrics
 */

interface Span {
  spanId: string;
  traceId: string;
  parentSpanId?: string;
  serviceName: string;
  operationName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  tags: Record<string, string | number | boolean>;
  logs: LogEntry[];
  status: 'pending' | 'success' | 'error';
  error?: string;
}

interface LogEntry {
  timestamp: number;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  fields?: Record<string, any>;
}

interface Trace {
  traceId: string;
  rootSpan: Span;
  spans: Span[];
  startTime: number;
  endTime?: number;
  duration?: number;
  serviceCalls: number;
  status: 'active' | 'completed' | 'failed';
}

interface TracingStats {
  totalTraces: number;
  activeTraces: number;
  completedTraces: number;
  failedTraces: number;
  avgDuration: number;
  slowestTraces: Array<{ traceId: string; duration: number }>;
  serviceStats: Map<string, { count: number; avgDuration: number }>;
}

class SpanBuilder {
  private span: Span;

  constructor(
    serviceName: string,
    operationName: string,
    traceId: string,
    parentSpanId?: string
  ) {
    this.span = {
      spanId: crypto.randomUUID(),
      traceId,
      parentSpanId,
      serviceName,
      operationName,
      startTime: Date.now(),
      tags: {},
      logs: [],
      status: 'pending'
    };
  }

  setTag(key: string, value: string | number | boolean): SpanBuilder {
    this.span.tags[key] = value;
    return this;
  }

  setTags(tags: Record<string, string | number | boolean>): SpanBuilder {
    Object.assign(this.span.tags, tags);
    return this;
  }

  log(level: LogEntry['level'], message: string, fields?: Record<string, any>): SpanBuilder {
    this.span.logs.push({
      timestamp: Date.now(),
      level,
      message,
      fields
    });
    return this;
  }

  finish(status: 'success' | 'error' = 'success', error?: string): Span {
    this.span.endTime = Date.now();
    this.span.duration = this.span.endTime - this.span.startTime;
    this.span.status = status;
    if (error) {
      this.span.error = error;
    }
    return this.span;
  }

  build(): Span {
    return this.span;
  }
}

class TraceCollector {
  private traces: Map<string, Trace> = new Map();
  private spans: Map<string, Span> = new Map();
  private readonly maxTraces: number = 10000;
  private readonly traceRetentionMs: number = 3600000; // 1 hour

  createTrace(serviceName: string, operationName: string): { traceId: string; rootSpan: Span } {
    const traceId = crypto.randomUUID();
    const rootSpan = new SpanBuilder(serviceName, operationName, traceId).build();

    const trace: Trace = {
      traceId,
      rootSpan,
      spans: [rootSpan],
      startTime: Date.now(),
      serviceCalls: 1,
      status: 'active'
    };

    this.traces.set(traceId, trace);
    this.spans.set(rootSpan.spanId, rootSpan);

    console.log(`Trace created: ${traceId} (${serviceName}:${operationName})`);
    return { traceId, rootSpan };
  }

  addSpan(span: Span): void {
    const trace = this.traces.get(span.traceId);
    if (!trace) {
      console.warn(`Trace not found for span: ${span.traceId}`);
      return;
    }

    trace.spans.push(span);
    trace.serviceCalls++;
    this.spans.set(span.spanId, span);

    // Update trace status
    if (span.status === 'error') {
      trace.status = 'failed';
    }

    console.log(`Span added: ${span.operationName} to trace ${span.traceId}`);
  }

  finishSpan(spanId: string, status: 'success' | 'error' = 'success', error?: string): void {
    const span = this.spans.get(spanId);
    if (!span) {
      console.warn(`Span not found: ${spanId}`);
      return;
    }

    span.endTime = Date.now();
    span.duration = span.endTime - span.startTime;
    span.status = status;
    if (error) {
      span.error = error;
    }

    // Check if trace is complete
    const trace = this.traces.get(span.traceId);
    if (trace && trace.rootSpan.spanId === spanId) {
      this.completeTrace(span.traceId);
    }
  }

  private completeTrace(traceId: string): void {
    const trace = this.traces.get(traceId);
    if (!trace) return;

    const allSpansComplete = trace.spans.every(s => s.endTime !== undefined);
    if (allSpansComplete) {
      trace.endTime = Date.now();
      trace.duration = trace.endTime - trace.startTime;
      trace.status = trace.spans.some(s => s.status === 'error') ? 'failed' : 'completed';
      console.log(`Trace completed: ${traceId} (${trace.duration}ms)`);
    }
  }

  getTrace(traceId: string): Trace | null {
    return this.traces.get(traceId) || null;
  }

  getSpan(spanId: string): Span | null {
    return this.spans.get(spanId) || null;
  }

  queryTraces(filters: {
    serviceName?: string;
    operationName?: string;
    status?: Trace['status'];
    minDuration?: number;
    maxDuration?: number;
    limit?: number;
  }): Trace[] {
    let traces = Array.from(this.traces.values());

    if (filters.serviceName) {
      traces = traces.filter(t =>
        t.spans.some(s => s.serviceName === filters.serviceName)
      );
    }

    if (filters.operationName) {
      traces = traces.filter(t =>
        t.spans.some(s => s.operationName === filters.operationName)
      );
    }

    if (filters.status) {
      traces = traces.filter(t => t.status === filters.status);
    }

    if (filters.minDuration) {
      traces = traces.filter(t => (t.duration || 0) >= filters.minDuration!);
    }

    if (filters.maxDuration) {
      traces = traces.filter(t => (t.duration || 0) <= filters.maxDuration!);
    }

    // Sort by start time (most recent first)
    traces.sort((a, b) => b.startTime - a.startTime);

    return traces.slice(0, filters.limit || 100);
  }

  getStats(): TracingStats {
    const traces = Array.from(this.traces.values());
    const completedTraces = traces.filter(t => t.status === 'completed');
    const failedTraces = traces.filter(t => t.status === 'failed');
    const activeTraces = traces.filter(t => t.status === 'active');

    const totalDuration = completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0);
    const avgDuration = completedTraces.length > 0 ? totalDuration / completedTraces.length : 0;

    // Get slowest traces
    const slowestTraces = [...completedTraces]
      .sort((a, b) => (b.duration || 0) - (a.duration || 0))
      .slice(0, 10)
      .map(t => ({ traceId: t.traceId, duration: t.duration || 0 }));

    // Calculate service stats
    const serviceStats = new Map<string, { count: number; totalDuration: number; avgDuration: number }>();
    for (const trace of completedTraces) {
      for (const span of trace.spans) {
        const stats = serviceStats.get(span.serviceName) || { count: 0, totalDuration: 0, avgDuration: 0 };
        stats.count++;
        stats.totalDuration += span.duration || 0;
        stats.avgDuration = stats.totalDuration / stats.count;
        serviceStats.set(span.serviceName, stats);
      }
    }

    return {
      totalTraces: traces.length,
      activeTraces: activeTraces.length,
      completedTraces: completedTraces.length,
      failedTraces: failedTraces.length,
      avgDuration: Math.round(avgDuration),
      slowestTraces,
      serviceStats
    };
  }

  cleanup(): void {
    const now = Date.now();
    const tracesToDelete: string[] = [];

    for (const [traceId, trace] of this.traces.entries()) {
      const age = now - trace.startTime;
      if (age > this.traceRetentionMs) {
        tracesToDelete.push(traceId);
        // Delete associated spans
        for (const span of trace.spans) {
          this.spans.delete(span.spanId);
        }
      }
    }

    for (const traceId of tracesToDelete) {
      this.traces.delete(traceId);
    }

    if (tracesToDelete.length > 0) {
      console.log(`Cleaned up ${tracesToDelete.length} old traces`);
    }

    // Enforce max traces limit
    if (this.traces.size > this.maxTraces) {
      const sortedTraces = Array.from(this.traces.entries())
        .sort((a, b) => a[1].startTime - b[1].startTime);

      const toDelete = sortedTraces.slice(0, sortedTraces.length - this.maxTraces);
      for (const [traceId, trace] of toDelete) {
        this.traces.delete(traceId);
        for (const span of trace.spans) {
          this.spans.delete(span.spanId);
        }
      }
    }
  }

  generateVisualization(traceId: string): any {
    const trace = this.getTrace(traceId);
    if (!trace) return null;

    // Build tree structure
    const spanMap = new Map<string, Span>();
    for (const span of trace.spans) {
      spanMap.set(span.spanId, span);
    }

    const buildTree = (span: Span): any => {
      const children = trace.spans
        .filter(s => s.parentSpanId === span.spanId)
        .map(buildTree);

      return {
        spanId: span.spanId,
        serviceName: span.serviceName,
        operationName: span.operationName,
        startTime: span.startTime,
        duration: span.duration || 0,
        status: span.status,
        tags: span.tags,
        children
      };
    };

    return {
      traceId: trace.traceId,
      duration: trace.duration,
      status: trace.status,
      serviceCalls: trace.serviceCalls,
      tree: buildTree(trace.rootSpan)
    };
  }
}

class PerformanceAnalyzer {
  analyzeTrace(trace: Trace): any {
    const bottlenecks: Array<{ span: string; duration: number; percentage: number }> = [];
    const totalDuration = trace.duration || 0;

    for (const span of trace.spans) {
      const duration = span.duration || 0;
      const percentage = totalDuration > 0 ? (duration / totalDuration) * 100 : 0;

      if (percentage > 10) { // Spans taking more than 10% of total time
        bottlenecks.push({
          span: `${span.serviceName}:${span.operationName}`,
          duration,
          percentage: Math.round(percentage * 100) / 100
        });
      }
    }

    bottlenecks.sort((a, b) => b.duration - a.duration);

    const serviceBreakdown = new Map<string, number>();
    for (const span of trace.spans) {
      const current = serviceBreakdown.get(span.serviceName) || 0;
      serviceBreakdown.set(span.serviceName, current + (span.duration || 0));
    }

    return {
      traceId: trace.traceId,
      totalDuration: trace.duration,
      serviceCalls: trace.serviceCalls,
      bottlenecks,
      serviceBreakdown: Object.fromEntries(serviceBreakdown),
      criticalPath: this.findCriticalPath(trace)
    };
  }

  private findCriticalPath(trace: Trace): string[] {
    // Find the longest path through the span tree
    const path: string[] = [];
    let currentSpan = trace.rootSpan;

    while (currentSpan) {
      path.push(`${currentSpan.serviceName}:${currentSpan.operationName}`);

      // Find child with longest duration
      const children = trace.spans
        .filter(s => s.parentSpanId === currentSpan.spanId)
        .sort((a, b) => (b.duration || 0) - (a.duration || 0));

      currentSpan = children[0];
    }

    return path;
  }
}

// Initialize tracing system
const traceCollector = new TraceCollector();
const performanceAnalyzer = new PerformanceAnalyzer();

// Start cleanup job
setInterval(() => traceCollector.cleanup(), 300000); // Every 5 minutes

// Elide server
Elide.serve({
  port: 3000,

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // Create new trace
    if (url.pathname === '/traces/start' && request.method === 'POST') {
      try {
        const { serviceName, operationName } = await request.json();
        const { traceId, rootSpan } = traceCollector.createTrace(serviceName, operationName);

        return new Response(JSON.stringify({
          traceId,
          spanId: rootSpan.spanId
        }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Add span to trace
    if (url.pathname === '/traces/span' && request.method === 'POST') {
      try {
        const spanData = await request.json();
        const span: Span = {
          spanId: crypto.randomUUID(),
          traceId: spanData.traceId,
          parentSpanId: spanData.parentSpanId,
          serviceName: spanData.serviceName,
          operationName: spanData.operationName,
          startTime: Date.now(),
          tags: spanData.tags || {},
          logs: [],
          status: 'pending'
        };

        traceCollector.addSpan(span);

        // Simulate work and finish span
        if (spanData.duration) {
          setTimeout(() => {
            traceCollector.finishSpan(span.spanId, spanData.status || 'success');
          }, spanData.duration);
        }

        return new Response(JSON.stringify({ spanId: span.spanId }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Finish span
    if (url.pathname === '/traces/span/finish' && request.method === 'POST') {
      try {
        const { spanId, status, error } = await request.json();
        traceCollector.finishSpan(spanId, status || 'success', error);

        return new Response(JSON.stringify({ success: true }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Get trace
    if (url.pathname.startsWith('/traces/') && request.method === 'GET') {
      const parts = url.pathname.split('/');
      const traceId = parts[2];

      if (!traceId || traceId === 'query') {
        return new Response(JSON.stringify({ error: 'Trace ID required' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const trace = traceCollector.getTrace(traceId);
      if (!trace) {
        return new Response(JSON.stringify({ error: 'Trace not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(trace, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Query traces
    if (url.pathname === '/traces/query') {
      const serviceName = url.searchParams.get('serviceName') || undefined;
      const operationName = url.searchParams.get('operationName') || undefined;
      const status = url.searchParams.get('status') as Trace['status'] | undefined;
      const minDuration = url.searchParams.get('minDuration')
        ? parseInt(url.searchParams.get('minDuration')!)
        : undefined;
      const limit = url.searchParams.get('limit')
        ? parseInt(url.searchParams.get('limit')!)
        : undefined;

      const traces = traceCollector.queryTraces({
        serviceName,
        operationName,
        status,
        minDuration,
        limit
      });

      return new Response(JSON.stringify(traces, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Visualize trace
    if (url.pathname.startsWith('/traces/') && url.pathname.endsWith('/visualize')) {
      const traceId = url.pathname.split('/')[2];
      const visualization = traceCollector.generateVisualization(traceId);

      if (!visualization) {
        return new Response(JSON.stringify({ error: 'Trace not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      return new Response(JSON.stringify(visualization, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Analyze trace performance
    if (url.pathname.startsWith('/traces/') && url.pathname.endsWith('/analyze')) {
      const traceId = url.pathname.split('/')[2];
      const trace = traceCollector.getTrace(traceId);

      if (!trace) {
        return new Response(JSON.stringify({ error: 'Trace not found' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const analysis = performanceAnalyzer.analyzeTrace(trace);
      return new Response(JSON.stringify(analysis, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Get statistics
    if (url.pathname === '/stats') {
      const stats = traceCollector.getStats();
      return new Response(JSON.stringify(stats, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Distributed Tracing System', { status: 200 });
  }
});

console.log('🔍 Distributed Tracing System running on http://localhost:3000');
console.log('Track requests across services with correlation IDs');
