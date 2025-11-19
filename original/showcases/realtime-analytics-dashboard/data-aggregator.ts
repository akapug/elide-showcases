/**
 * Real-Time Data Aggregator
 *
 * High-performance data aggregation engine for analytics events.
 * Supports time-series aggregation, windowing, and real-time metrics.
 */

export interface AnalyticsEvent {
  id?: string;
  type: string;
  userId?: string;
  sessionId?: string;
  timestamp: number;
  properties: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface AggregationWindow {
  start: number;
  end: number;
  interval: number;
  metrics: Map<string, AggregatedMetric>;
}

export interface AggregatedMetric {
  name: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  percentiles?: {
    p50: number;
    p75: number;
    p95: number;
    p99: number;
  };
  uniqueValues?: Set<any>;
}

export interface TimeSeriesPoint {
  timestamp: number;
  value: number;
  metadata?: Record<string, any>;
}

export class DataAggregator {
  private events: AnalyticsEvent[] = [];
  private windows = new Map<string, AggregationWindow>();
  private timeSeries = new Map<string, TimeSeriesPoint[]>();
  private eventCounts = new Map<string, number>();
  private userSessions = new Map<string, Set<string>>();

  private maxEventsInMemory = 100000;
  private windowSize = 60000; // 1 minute
  private maxRetention = 24 * 60 * 60 * 1000; // 24 hours

  private stats = {
    eventsProcessed: 0,
    eventsPerSecond: 0,
    aggregationsComputed: 0,
    memoryUsage: 0
  };

  constructor() {
    this.startAggregationLoop();
    this.startCleanupLoop();
    this.startStatsUpdater();
  }

  // Ingest single event
  ingest(event: AnalyticsEvent): void {
    // Add timestamp if not present
    if (!event.timestamp) {
      event.timestamp = Date.now();
    }

    // Generate ID if not present
    if (!event.id) {
      event.id = this.generateEventId();
    }

    // Store event
    this.events.push(event);
    this.stats.eventsProcessed++;

    // Update event counts
    const count = this.eventCounts.get(event.type) || 0;
    this.eventCounts.set(event.type, count + 1);

    // Track user sessions
    if (event.userId && event.sessionId) {
      if (!this.userSessions.has(event.userId)) {
        this.userSessions.set(event.userId, new Set());
      }
      this.userSessions.get(event.userId)!.add(event.sessionId);
    }

    // Trim events if exceeding limit
    if (this.events.length > this.maxEventsInMemory) {
      this.events = this.events.slice(-this.maxEventsInMemory);
    }
  }

  // Batch ingest
  batchIngest(events: AnalyticsEvent[]): void {
    for (const event of events) {
      this.ingest(event);
    }
  }

  // Aggregate events by time window
  aggregate(
    eventType: string,
    metric: string,
    startTime: number,
    endTime: number,
    interval: number = this.windowSize
  ): TimeSeriesPoint[] {
    const filteredEvents = this.events.filter(
      e => e.type === eventType && e.timestamp >= startTime && e.timestamp <= endTime
    );

    const buckets = new Map<number, number[]>();

    // Create time buckets
    for (let ts = startTime; ts < endTime; ts += interval) {
      buckets.set(ts, []);
    }

    // Fill buckets
    for (const event of filteredEvents) {
      const bucketTime = Math.floor((event.timestamp - startTime) / interval) * interval + startTime;

      if (buckets.has(bucketTime)) {
        const value = this.extractMetricValue(event, metric);
        if (value !== null && value !== undefined) {
          buckets.get(bucketTime)!.push(value);
        }
      }
    }

    // Aggregate each bucket
    const points: TimeSeriesPoint[] = [];
    for (const [timestamp, values] of buckets.entries()) {
      if (values.length > 0) {
        points.push({
          timestamp,
          value: this.calculateAggregation(values, 'avg'),
          metadata: {
            count: values.length,
            sum: values.reduce((a, b) => a + b, 0),
            min: Math.min(...values),
            max: Math.max(...values)
          }
        });
      } else {
        points.push({ timestamp, value: 0 });
      }
    }

    this.stats.aggregationsComputed++;
    return points;
  }

  // Count events by type
  countEvents(
    eventType: string,
    startTime: number,
    endTime: number,
    groupBy?: string
  ): Record<string, number> {
    const filteredEvents = this.events.filter(
      e => e.type === eventType && e.timestamp >= startTime && e.timestamp <= endTime
    );

    if (!groupBy) {
      return { total: filteredEvents.length };
    }

    const counts: Record<string, number> = {};
    for (const event of filteredEvents) {
      const key = this.extractPropertyValue(event, groupBy) || 'unknown';
      counts[key] = (counts[key] || 0) + 1;
    }

    return counts;
  }

  // Calculate unique users
  uniqueUsers(startTime: number, endTime: number): number {
    const users = new Set<string>();

    for (const event of this.events) {
      if (event.timestamp >= startTime && event.timestamp <= endTime && event.userId) {
        users.add(event.userId);
      }
    }

    return users.size;
  }

  // Calculate unique sessions
  uniqueSessions(startTime: number, endTime: number): number {
    const sessions = new Set<string>();

    for (const event of this.events) {
      if (event.timestamp >= startTime && event.timestamp <= endTime && event.sessionId) {
        sessions.add(event.sessionId);
      }
    }

    return sessions.size;
  }

  // Get top N by property
  topN(
    eventType: string,
    property: string,
    n: number,
    startTime: number,
    endTime: number
  ): Array<{ value: any; count: number }> {
    const filteredEvents = this.events.filter(
      e => e.type === eventType && e.timestamp >= startTime && e.timestamp <= endTime
    );

    const counts = new Map<any, number>();
    for (const event of filteredEvents) {
      const value = this.extractPropertyValue(event, property);
      if (value !== null && value !== undefined) {
        counts.set(value, (counts.get(value) || 0) + 1);
      }
    }

    return Array.from(counts.entries())
      .map(([value, count]) => ({ value, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, n);
  }

  // Calculate percentiles
  percentiles(
    eventType: string,
    metric: string,
    startTime: number,
    endTime: number,
    percentiles: number[] = [0.5, 0.75, 0.95, 0.99]
  ): Record<string, number> {
    const filteredEvents = this.events.filter(
      e => e.type === eventType && e.timestamp >= startTime && e.timestamp <= endTime
    );

    const values: number[] = [];
    for (const event of filteredEvents) {
      const value = this.extractMetricValue(event, metric);
      if (value !== null && value !== undefined) {
        values.push(value);
      }
    }

    if (values.length === 0) {
      return {};
    }

    values.sort((a, b) => a - b);
    const result: Record<string, number> = {};

    for (const p of percentiles) {
      const index = Math.ceil(values.length * p) - 1;
      result[`p${Math.round(p * 100)}`] = values[Math.max(0, index)];
    }

    return result;
  }

  // Get events by filter
  query(filter: {
    type?: string;
    userId?: string;
    sessionId?: string;
    startTime?: number;
    endTime?: number;
    properties?: Record<string, any>;
    limit?: number;
  }): AnalyticsEvent[] {
    let results = [...this.events];

    if (filter.type) {
      results = results.filter(e => e.type === filter.type);
    }

    if (filter.userId) {
      results = results.filter(e => e.userId === filter.userId);
    }

    if (filter.sessionId) {
      results = results.filter(e => e.sessionId === filter.sessionId);
    }

    if (filter.startTime) {
      results = results.filter(e => e.timestamp >= filter.startTime!);
    }

    if (filter.endTime) {
      results = results.filter(e => e.timestamp <= filter.endTime!);
    }

    if (filter.properties) {
      for (const [key, value] of Object.entries(filter.properties)) {
        results = results.filter(e => e.properties[key] === value);
      }
    }

    if (filter.limit) {
      results = results.slice(-filter.limit);
    }

    return results;
  }

  // Extract metric value from event
  private extractMetricValue(event: AnalyticsEvent, metric: string): number | null {
    // Try properties first
    if (metric in event.properties && typeof event.properties[metric] === 'number') {
      return event.properties[metric];
    }

    // Try metadata
    if (event.metadata && metric in event.metadata && typeof event.metadata[metric] === 'number') {
      return event.metadata[metric];
    }

    // Special case: duration
    if (metric === 'duration' && event.properties.startTime && event.properties.endTime) {
      return event.properties.endTime - event.properties.startTime;
    }

    return null;
  }

  // Extract property value
  private extractPropertyValue(event: AnalyticsEvent, property: string): any {
    if (property in event.properties) {
      return event.properties[property];
    }

    if (event.metadata && property in event.metadata) {
      return event.metadata[property];
    }

    return null;
  }

  // Calculate aggregation
  private calculateAggregation(values: number[], type: string): number {
    if (values.length === 0) return 0;

    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'count':
        return values.length;
      default:
        return 0;
    }
  }

  // Generate event ID
  private generateEventId(): string {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Aggregation loop
  private startAggregationLoop(): void {
    setInterval(() => {
      // Perform periodic aggregations
      const now = Date.now();
      const windowStart = now - this.windowSize;

      // Clean up old windows
      for (const [key, window] of this.windows.entries()) {
        if (window.end < windowStart) {
          this.windows.delete(key);
        }
      }
    }, 10000); // Every 10 seconds
  }

  // Cleanup old events
  private startCleanupLoop(): void {
    setInterval(() => {
      const cutoff = Date.now() - this.maxRetention;
      this.events = this.events.filter(e => e.timestamp > cutoff);
    }, 60000); // Every minute
  }

  // Update stats
  private startStatsUpdater(): void {
    let lastCount = 0;

    setInterval(() => {
      const currentCount = this.stats.eventsProcessed;
      this.stats.eventsPerSecond = currentCount - lastCount;
      lastCount = currentCount;

      // Rough memory estimate
      this.stats.memoryUsage = this.events.length * 500; // ~500 bytes per event
    }, 1000); // Every second
  }

  // Get statistics
  getStats() {
    return {
      ...this.stats,
      eventsInMemory: this.events.length,
      uniqueEventTypes: this.eventCounts.size,
      totalUsers: this.userSessions.size
    };
  }

  // Get event counts
  getEventCounts(): Record<string, number> {
    return Object.fromEntries(this.eventCounts);
  }

  // Clear all data
  clear(): void {
    this.events = [];
    this.windows.clear();
    this.timeSeries.clear();
    this.eventCounts.clear();
    this.userSessions.clear();
  }
}
