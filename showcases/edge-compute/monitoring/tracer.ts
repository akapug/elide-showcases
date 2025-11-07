/**
 * Tracer Service - Distributed tracing for edge functions
 *
 * Provides request tracing and span tracking for performance analysis.
 */

import { EventEmitter } from 'events';

export interface Span {
  traceId: string;
  spanId: string;
  parentSpanId?: string;
  name: string;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'success' | 'error';
  tags?: Record<string, string>;
  logs?: Array<{
    timestamp: Date;
    message: string;
    fields?: Record<string, any>;
  }>;
  error?: {
    message: string;
    stack?: string;
  };
}

export interface Trace {
  traceId: string;
  rootSpan: Span;
  spans: Span[];
  startTime: Date;
  endTime?: Date;
  duration?: number;
  status: 'pending' | 'success' | 'error';
}

export class Tracer extends EventEmitter {
  private traces: Map<string, Trace>;
  private activeSpans: Map<string, Span>;

  constructor() {
    super();
    this.traces = new Map();
    this.activeSpans = new Map();

    this.startCleanup();
  }

  /**
   * Start a new trace
   */
  startTrace(name: string, tags?: Record<string, string>): Span {
    const traceId = this.generateTraceId();
    const spanId = this.generateSpanId();

    const span: Span = {
      traceId,
      spanId,
      name,
      startTime: new Date(),
      status: 'pending',
      tags,
      logs: [],
    };

    const trace: Trace = {
      traceId,
      rootSpan: span,
      spans: [span],
      startTime: new Date(),
      status: 'pending',
    };

    this.traces.set(traceId, trace);
    this.activeSpans.set(spanId, span);

    this.emit('trace:start', trace);

    return span;
  }

  /**
   * Start a child span
   */
  startSpan(
    name: string,
    parentSpan: Span,
    tags?: Record<string, string>
  ): Span {
    const spanId = this.generateSpanId();

    const span: Span = {
      traceId: parentSpan.traceId,
      spanId,
      parentSpanId: parentSpan.spanId,
      name,
      startTime: new Date(),
      status: 'pending',
      tags,
      logs: [],
    };

    const trace = this.traces.get(parentSpan.traceId);
    if (trace) {
      trace.spans.push(span);
    }

    this.activeSpans.set(spanId, span);

    this.emit('span:start', span);

    return span;
  }

  /**
   * Finish a span
   */
  finishSpan(span: Span, error?: Error): void {
    span.endTime = new Date();
    span.duration = span.endTime.getTime() - span.startTime.getTime();
    span.status = error ? 'error' : 'success';

    if (error) {
      span.error = {
        message: error.message,
        stack: error.stack,
      };
    }

    this.activeSpans.delete(span.spanId);

    // Check if this is the root span
    const trace = this.traces.get(span.traceId);
    if (trace && trace.rootSpan.spanId === span.spanId) {
      trace.endTime = span.endTime;
      trace.duration = span.duration;
      trace.status = span.status;

      this.emit('trace:finish', trace);
    }

    this.emit('span:finish', span);
  }

  /**
   * Add log to span
   */
  logSpan(span: Span, message: string, fields?: Record<string, any>): void {
    if (!span.logs) {
      span.logs = [];
    }

    span.logs.push({
      timestamp: new Date(),
      message,
      fields,
    });
  }

  /**
   * Add tag to span
   */
  tagSpan(span: Span, key: string, value: string): void {
    if (!span.tags) {
      span.tags = {};
    }

    span.tags[key] = value;
  }

  /**
   * Get trace by ID
   */
  getTrace(traceId: string): Trace | undefined {
    return this.traces.get(traceId);
  }

  /**
   * Get recent traces
   */
  getRecentTraces(limit: number = 100): Trace[] {
    const traces = Array.from(this.traces.values())
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);

    return traces;
  }

  /**
   * Search traces
   */
  searchTraces(query: {
    status?: 'pending' | 'success' | 'error';
    minDuration?: number;
    tags?: Record<string, string>;
    limit?: number;
  }): Trace[] {
    let traces = Array.from(this.traces.values());

    // Filter by status
    if (query.status) {
      traces = traces.filter((t) => t.status === query.status);
    }

    // Filter by duration
    if (query.minDuration !== undefined) {
      traces = traces.filter((t) => t.duration && t.duration >= query.minDuration!);
    }

    // Filter by tags
    if (query.tags) {
      traces = traces.filter((t) => {
        if (!t.rootSpan.tags) return false;

        for (const [key, value] of Object.entries(query.tags!)) {
          if (t.rootSpan.tags[key] !== value) return false;
        }

        return true;
      });
    }

    // Sort by start time (newest first)
    traces.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());

    // Apply limit
    if (query.limit) {
      traces = traces.slice(0, query.limit);
    }

    return traces;
  }

  /**
   * Get trace statistics
   */
  getStats(): {
    total: number;
    active: number;
    completed: number;
    errors: number;
    avgDuration: number;
  } {
    const traces = Array.from(this.traces.values());

    const active = traces.filter((t) => t.status === 'pending').length;
    const completed = traces.filter((t) => t.status === 'success').length;
    const errors = traces.filter((t) => t.status === 'error').length;

    const completedTraces = traces.filter((t) => t.duration !== undefined);
    const totalDuration = completedTraces.reduce((sum, t) => sum + (t.duration || 0), 0);
    const avgDuration = completedTraces.length > 0 ? totalDuration / completedTraces.length : 0;

    return {
      total: traces.length,
      active,
      completed,
      errors,
      avgDuration,
    };
  }

  /**
   * Clear old traces
   */
  clear(olderThan?: Date): void {
    if (!olderThan) {
      this.traces.clear();
      this.activeSpans.clear();
      return;
    }

    const toDelete: string[] = [];

    for (const [traceId, trace] of this.traces.entries()) {
      if (trace.startTime < olderThan && trace.status !== 'pending') {
        toDelete.push(traceId);
      }
    }

    for (const traceId of toDelete) {
      this.traces.delete(traceId);
    }

    this.emit('clear', { count: toDelete.length });
  }

  /**
   * Export trace in Jaeger format
   */
  exportJaeger(traceId: string): any {
    const trace = this.traces.get(traceId);
    if (!trace) return null;

    return {
      traceID: trace.traceId,
      spans: trace.spans.map((span) => ({
        traceID: span.traceId,
        spanID: span.spanId,
        parentSpanID: span.parentSpanId,
        operationName: span.name,
        startTime: span.startTime.getTime() * 1000, // microseconds
        duration: (span.duration || 0) * 1000, // microseconds
        tags: Object.entries(span.tags || {}).map(([key, value]) => ({
          key,
          type: 'string',
          value,
        })),
        logs: span.logs?.map((log) => ({
          timestamp: log.timestamp.getTime() * 1000,
          fields: [
            { key: 'message', type: 'string', value: log.message },
            ...(log.fields
              ? Object.entries(log.fields).map(([key, value]) => ({
                  key,
                  type: typeof value,
                  value: String(value),
                }))
              : []),
          ],
        })),
      })),
      processes: {
        p1: {
          serviceName: 'edge-compute',
          tags: [],
        },
      },
    };
  }

  // Private methods

  private generateTraceId(): string {
    return `trace-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSpanId(): string {
    return `span-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private startCleanup(): void {
    // Clean up old traces every hour
    setInterval(() => {
      const oneHourAgo = new Date(Date.now() - 3600000);
      this.clear(oneHourAgo);
    }, 3600000);
  }
}

export default Tracer;
