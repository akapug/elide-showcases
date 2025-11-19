/**
 * Stream Aggregation Example
 *
 * Demonstrates real-time stream aggregations with:
 * - Multiple aggregation functions
 * - Windowed aggregations
 * - Multi-dimensional aggregations
 * - Late data handling
 * - Materialized views
 * - Incremental updates
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface AggregationConfig {
  windowType: 'tumbling' | 'sliding' | 'session';
  windowSize: number;
  slideInterval?: number;
  sessionGap?: number;
  groupBy: string[];
  aggregations: AggregationFunction[];
  allowedLateness?: number;
}

export interface AggregationFunction {
  name: string;
  type: 'sum' | 'count' | 'avg' | 'min' | 'max' | 'stddev' | 'percentile' | 'distinct' | 'custom';
  field?: string;
  percentile?: number;
  customFn?: (values: any[]) => any;
}

export interface StreamEvent {
  timestamp: number;
  data: Record<string, any>;
}

export interface AggregateResult {
  window: {
    start: number;
    end: number;
  };
  groupKey: string;
  aggregates: Record<string, any>;
  eventCount: number;
  metadata: {
    firstEventTime: number;
    lastEventTime: number;
    watermark: number;
  };
}

// ============================================================================
// Aggregation Engine
// ============================================================================

class AggregationState {
  public values: Map<string, any[]> = new Map();
  public eventCount: number = 0;
  public firstEventTime: number = 0;
  public lastEventTime: number = 0;
  public distinctValues: Map<string, Set<any>> = new Map();

  public addValue(field: string, value: any, timestamp: number): void {
    if (!this.values.has(field)) {
      this.values.set(field, []);
    }

    this.values.get(field)!.push(value);
    this.eventCount++;

    if (this.firstEventTime === 0 || timestamp < this.firstEventTime) {
      this.firstEventTime = timestamp;
    }

    if (timestamp > this.lastEventTime) {
      this.lastEventTime = timestamp;
    }
  }

  public addDistinct(field: string, value: any): void {
    if (!this.distinctValues.has(field)) {
      this.distinctValues.set(field, new Set());
    }
    this.distinctValues.get(field)!.add(value);
  }

  public getValues(field: string): any[] {
    return this.values.get(field) || [];
  }

  public getDistinctCount(field: string): number {
    return this.distinctValues.get(field)?.size || 0;
  }
}

export class StreamAggregator extends EventEmitter {
  private config: AggregationConfig;
  private aggregationStates: Map<string, AggregationState> = new Map();
  private windowStates: Map<string, Map<string, AggregationState>> = new Map();
  private currentWatermark: number = 0;

  constructor(config: AggregationConfig) {
    super();
    this.config = config;
  }

  // ==========================================================================
  // Event Processing
  // ==========================================================================

  public process(event: StreamEvent): void {
    const groupKey = this.getGroupKey(event.data);
    const windowKey = this.getWindowKey(event.timestamp);
    const stateKey = `${windowKey}:${groupKey}`;

    // Get or create aggregation state
    let state = this.aggregationStates.get(stateKey);
    if (!state) {
      state = new AggregationState();
      this.aggregationStates.set(stateKey, state);

      // Track window states
      if (!this.windowStates.has(windowKey)) {
        this.windowStates.set(windowKey, new Map());
      }
      this.windowStates.get(windowKey)!.set(groupKey, state);
    }

    // Add values for each aggregation
    for (const aggFn of this.config.aggregations) {
      if (aggFn.field) {
        const value = event.data[aggFn.field];
        if (value !== undefined && value !== null) {
          state.addValue(aggFn.field, value, event.timestamp);

          if (aggFn.type === 'distinct') {
            state.addDistinct(aggFn.field, value);
          }
        }
      }
    }

    // Update watermark
    this.updateWatermark(event.timestamp);

    // Check for completed windows
    this.checkCompletedWindows();
  }

  public processBatch(events: StreamEvent[]): void {
    for (const event of events) {
      this.process(event);
    }
  }

  // ==========================================================================
  // Window Management
  // ==========================================================================

  private getWindowKey(timestamp: number): string {
    const windowStart = this.getWindowStart(timestamp);
    const windowEnd = windowStart + this.config.windowSize;
    return `${windowStart}-${windowEnd}`;
  }

  private getWindowStart(timestamp: number): number {
    switch (this.config.windowType) {
      case 'tumbling':
        return Math.floor(timestamp / this.config.windowSize) * this.config.windowSize;

      case 'sliding':
        const slide = this.config.slideInterval || this.config.windowSize;
        return Math.floor(timestamp / slide) * slide;

      case 'session':
        // Sessions are dynamically created, return timestamp
        return timestamp;

      default:
        return timestamp;
    }
  }

  private parseWindowKey(windowKey: string): { start: number; end: number } {
    const [start, end] = windowKey.split('-').map(Number);
    return { start, end };
  }

  // ==========================================================================
  // Grouping
  // ==========================================================================

  private getGroupKey(data: Record<string, any>): string {
    if (this.config.groupBy.length === 0) {
      return 'all';
    }

    const keyParts = this.config.groupBy.map(field => {
      const value = data[field];
      return `${field}=${value}`;
    });

    return keyParts.join(',');
  }

  // ==========================================================================
  // Aggregation Computation
  // ==========================================================================

  private computeAggregations(state: AggregationState): Record<string, any> {
    const results: Record<string, any> = {};

    for (const aggFn of this.config.aggregations) {
      const resultKey = aggFn.name || `${aggFn.type}_${aggFn.field || 'count'}`;

      switch (aggFn.type) {
        case 'count':
          results[resultKey] = state.eventCount;
          break;

        case 'sum':
          if (aggFn.field) {
            const values = state.getValues(aggFn.field);
            results[resultKey] = values.reduce((sum, val) => sum + (Number(val) || 0), 0);
          }
          break;

        case 'avg':
          if (aggFn.field) {
            const values = state.getValues(aggFn.field);
            const sum = values.reduce((s, val) => s + (Number(val) || 0), 0);
            results[resultKey] = values.length > 0 ? sum / values.length : 0;
          }
          break;

        case 'min':
          if (aggFn.field) {
            const values = state.getValues(aggFn.field);
            results[resultKey] = values.length > 0 ? Math.min(...values.map(Number)) : null;
          }
          break;

        case 'max':
          if (aggFn.field) {
            const values = state.getValues(aggFn.field);
            results[resultKey] = values.length > 0 ? Math.max(...values.map(Number)) : null;
          }
          break;

        case 'stddev':
          if (aggFn.field) {
            const values = state.getValues(aggFn.field).map(Number);
            results[resultKey] = this.calculateStdDev(values);
          }
          break;

        case 'percentile':
          if (aggFn.field && aggFn.percentile) {
            const values = state.getValues(aggFn.field).map(Number);
            results[resultKey] = this.calculatePercentile(values, aggFn.percentile);
          }
          break;

        case 'distinct':
          if (aggFn.field) {
            results[resultKey] = state.getDistinctCount(aggFn.field);
          }
          break;

        case 'custom':
          if (aggFn.field && aggFn.customFn) {
            const values = state.getValues(aggFn.field);
            results[resultKey] = aggFn.customFn(values);
          }
          break;
      }
    }

    return results;
  }

  private calculateStdDev(values: number[]): number {
    if (values.length === 0) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  private calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;

    return sorted[Math.max(0, index)];
  }

  // ==========================================================================
  // Watermark and Window Completion
  // ==========================================================================

  private updateWatermark(timestamp: number): void {
    if (timestamp > this.currentWatermark) {
      this.currentWatermark = timestamp;
      this.emit('watermark:updated', timestamp);
    }
  }

  private checkCompletedWindows(): void {
    const allowedLateness = this.config.allowedLateness || 0;
    const completedWindows: string[] = [];

    for (const [windowKey, groupStates] of this.windowStates.entries()) {
      const { end } = this.parseWindowKey(windowKey);

      // Check if window is complete (watermark has passed)
      if (this.currentWatermark >= end + allowedLateness) {
        completedWindows.push(windowKey);

        // Emit results for each group in this window
        for (const [groupKey, state] of groupStates.entries()) {
          const result = this.createAggregateResult(windowKey, groupKey, state);
          this.emit('aggregate:result', result);
        }
      }
    }

    // Remove completed windows
    for (const windowKey of completedWindows) {
      this.windowStates.delete(windowKey);

      // Remove from aggregation states
      for (const stateKey of this.aggregationStates.keys()) {
        if (stateKey.startsWith(windowKey)) {
          this.aggregationStates.delete(stateKey);
        }
      }

      this.emit('window:completed', windowKey);
    }
  }

  private createAggregateResult(
    windowKey: string,
    groupKey: string,
    state: AggregationState
  ): AggregateResult {
    const window = this.parseWindowKey(windowKey);
    const aggregates = this.computeAggregations(state);

    return {
      window,
      groupKey,
      aggregates,
      eventCount: state.eventCount,
      metadata: {
        firstEventTime: state.firstEventTime,
        lastEventTime: state.lastEventTime,
        watermark: this.currentWatermark
      }
    };
  }

  // ==========================================================================
  // Query Interface
  // ==========================================================================

  public getCurrentAggregates(): AggregateResult[] {
    const results: AggregateResult[] = [];

    for (const [stateKey, state] of this.aggregationStates.entries()) {
      const [windowKey, groupKey] = stateKey.split(':');
      const result = this.createAggregateResult(windowKey, groupKey, state);
      results.push(result);
    }

    return results;
  }

  public getAggregateForGroup(groupKey: string): AggregateResult | null {
    for (const [stateKey, state] of this.aggregationStates.entries()) {
      const [windowKey, stateGroupKey] = stateKey.split(':');

      if (stateGroupKey === groupKey) {
        return this.createAggregateResult(windowKey, groupKey, state);
      }
    }

    return null;
  }
}

// ============================================================================
// Materialized View
// ============================================================================

export class MaterializedAggregateView extends EventEmitter {
  private views: Map<string, AggregateResult> = new Map();
  private updateInterval: number;
  private updateTimer?: NodeJS.Timeout;

  constructor(aggregator: StreamAggregator, updateInterval: number = 1000) {
    super();
    this.updateInterval = updateInterval;

    // Listen to aggregation results
    aggregator.on('aggregate:result', (result: AggregateResult) => {
      this.updateView(result);
    });

    this.startPeriodicUpdate();
  }

  private updateView(result: AggregateResult): void {
    const viewKey = `${result.window.start}-${result.groupKey}`;
    this.views.set(viewKey, result);
    this.emit('view:updated', result);
  }

  public query(groupKey?: string): AggregateResult[] {
    const results = Array.from(this.views.values());

    if (groupKey) {
      return results.filter(r => r.groupKey === groupKey);
    }

    return results;
  }

  public getLatestForGroup(groupKey: string): AggregateResult | null {
    const results = this.query(groupKey);

    if (results.length === 0) {
      return null;
    }

    // Return most recent window
    return results.reduce((latest, current) =>
      current.window.end > latest.window.end ? current : latest
    );
  }

  private startPeriodicUpdate(): void {
    this.updateTimer = setInterval(() => {
      this.emit('view:refresh', this.views.size);
    }, this.updateInterval);
  }

  public stop(): void {
    if (this.updateTimer) {
      clearInterval(this.updateTimer);
    }
  }
}

// ============================================================================
// Example Usage
// ============================================================================

export async function runAggregationExample(): Promise<void> {
  console.log('Starting Stream Aggregation Example\n');

  // Configure aggregation
  const config: AggregationConfig = {
    windowType: 'tumbling',
    windowSize: 10000, // 10 second windows
    groupBy: ['category', 'region'],
    aggregations: [
      { name: 'total_count', type: 'count' },
      { name: 'total_sales', type: 'sum', field: 'amount' },
      { name: 'avg_sales', type: 'avg', field: 'amount' },
      { name: 'min_sales', type: 'min', field: 'amount' },
      { name: 'max_sales', type: 'max', field: 'amount' },
      { name: 'p95_sales', type: 'percentile', field: 'amount', percentile: 95 },
      { name: 'unique_users', type: 'distinct', field: 'userId' }
    ],
    allowedLateness: 5000
  };

  // Create aggregator
  const aggregator = new StreamAggregator(config);

  // Create materialized view
  const view = new MaterializedAggregateView(aggregator);

  // Listen to results
  aggregator.on('aggregate:result', (result: AggregateResult) => {
    console.log('\n=== Aggregate Result ===');
    console.log(`Window: ${new Date(result.window.start).toISOString()} - ${new Date(result.window.end).toISOString()}`);
    console.log(`Group: ${result.groupKey}`);
    console.log(`Event Count: ${result.eventCount}`);
    console.log('Aggregates:', JSON.stringify(result.aggregates, null, 2));
  });

  // Generate sample events
  const categories = ['electronics', 'clothing', 'food'];
  const regions = ['US', 'EU', 'APAC'];

  console.log('Generating sample events...\n');

  for (let i = 0; i < 1000; i++) {
    const event: StreamEvent = {
      timestamp: Date.now() + (i * 100), // Space events 100ms apart
      data: {
        userId: `user_${Math.floor(Math.random() * 100)}`,
        category: categories[Math.floor(Math.random() * categories.length)],
        region: regions[Math.floor(Math.random() * regions.length)],
        amount: Math.random() * 1000
      }
    };

    aggregator.process(event);

    // Small delay to simulate real-time
    await sleep(10);

    // Query view periodically
    if (i % 100 === 0 && i > 0) {
      console.log(`\nProcessed ${i} events...`);

      const viewResults = view.query();
      console.log(`Active aggregates: ${viewResults.length}`);
    }
  }

  console.log('\n=== Final View Query ===');
  const finalResults = view.query();

  for (const result of finalResults) {
    console.log(`\nGroup: ${result.groupKey}`);
    console.log(`Total Sales: $${result.aggregates.total_sales?.toFixed(2) || 0}`);
    console.log(`Average Sales: $${result.aggregates.avg_sales?.toFixed(2) || 0}`);
    console.log(`Unique Users: ${result.aggregates.unique_users || 0}`);
  }

  view.stop();
  console.log('\nExample completed!');
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Run if this is the main module
if (require.main === module) {
  runAggregationExample().catch(console.error);
}
