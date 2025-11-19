/**
 * Data Export Engine
 *
 * Exports analytics data in multiple formats: CSV, JSON, Parquet.
 * Supports streaming exports for large datasets.
 */

import type { AnalyticsEvent, DataAggregator } from './data-aggregator.ts';

export interface ExportConfig {
  format: 'csv' | 'json' | 'parquet' | 'xlsx';
  filter?: {
    type?: string;
    startTime?: number;
    endTime?: number;
    properties?: Record<string, any>;
  };
  fields?: string[];
  limit?: number;
  compression?: boolean;
}

export interface ExportResult {
  format: string;
  size: number;
  recordCount: number;
  duration: number;
  data?: string | Uint8Array;
}

export class ExportEngine {
  private aggregator: DataAggregator;

  constructor(aggregator: DataAggregator) {
    this.aggregator = aggregator;
  }

  // Export data
  async export(config: ExportConfig): Promise<ExportResult> {
    const startTime = performance.now();

    // Get filtered data
    const events = this.aggregator.query(config.filter || {});
    const limitedEvents = config.limit ? events.slice(0, config.limit) : events;

    let data: string | Uint8Array;
    let size: number;

    // Export based on format
    switch (config.format) {
      case 'csv':
        data = this.exportCSV(limitedEvents, config.fields);
        size = new TextEncoder().encode(data).length;
        break;

      case 'json':
        data = this.exportJSON(limitedEvents, config.fields);
        size = new TextEncoder().encode(data).length;
        break;

      case 'parquet':
        data = await this.exportParquet(limitedEvents, config.fields);
        size = data.length;
        break;

      case 'xlsx':
        data = this.exportXLSX(limitedEvents, config.fields);
        size = new TextEncoder().encode(data).length;
        break;

      default:
        throw new Error(`Unsupported format: ${config.format}`);
    }

    const duration = performance.now() - startTime;

    return {
      format: config.format,
      size,
      recordCount: limitedEvents.length,
      duration,
      data
    };
  }

  // Export as CSV
  private exportCSV(events: AnalyticsEvent[], fields?: string[]): string {
    if (events.length === 0) {
      return '';
    }

    // Determine columns
    const columns = fields || this.inferColumns(events);

    // Build CSV
    const rows: string[] = [];

    // Header row
    rows.push(columns.join(','));

    // Data rows
    for (const event of events) {
      const row = columns.map(col => {
        const value = this.getFieldValue(event, col);
        return this.escapeCSV(value);
      });
      rows.push(row.join(','));
    }

    return rows.join('\n');
  }

  // Export as JSON
  private exportJSON(events: AnalyticsEvent[], fields?: string[]): string {
    if (fields) {
      // Export only specified fields
      const filtered = events.map(event => {
        const obj: any = {};
        for (const field of fields) {
          obj[field] = this.getFieldValue(event, field);
        }
        return obj;
      });
      return JSON.stringify(filtered, null, 2);
    }

    return JSON.stringify(events, null, 2);
  }

  // Export as Parquet (simplified binary format)
  private async exportParquet(events: AnalyticsEvent[], fields?: string[]): Promise<Uint8Array> {
    // This is a simplified Parquet-like format
    // In production, you'd use a proper Parquet library

    const columns = fields || this.inferColumns(events);

    // Create schema
    const schema = {
      columns: columns.map(col => ({
        name: col,
        type: this.inferColumnType(events, col)
      }))
    };

    // Serialize data
    const data = {
      schema,
      rows: events.map(event => {
        const row: any = {};
        for (const col of columns) {
          row[col] = this.getFieldValue(event, col);
        }
        return row;
      })
    };

    const json = JSON.stringify(data);
    return new TextEncoder().encode(json);
  }

  // Export as XLSX (CSV-like format)
  private exportXLSX(events: AnalyticsEvent[], fields?: string[]): string {
    // Simplified XLSX export (using CSV-like format)
    // In production, you'd use a proper XLSX library
    return this.exportCSV(events, fields);
  }

  // Get field value from event
  private getFieldValue(event: AnalyticsEvent, field: string): any {
    // Handle nested properties
    if (field.startsWith('properties.')) {
      const prop = field.substring(11);
      return event.properties[prop];
    }

    if (field.startsWith('metadata.')) {
      const prop = field.substring(9);
      return event.metadata?.[prop];
    }

    // Top-level fields
    switch (field) {
      case 'id': return event.id;
      case 'type': return event.type;
      case 'userId': return event.userId;
      case 'sessionId': return event.sessionId;
      case 'timestamp': return event.timestamp;
      default: return event.properties[field];
    }
  }

  // Infer columns from events
  private inferColumns(events: AnalyticsEvent[]): string[] {
    const columns = new Set<string>();

    // Add standard fields
    columns.add('id');
    columns.add('type');
    columns.add('userId');
    columns.add('sessionId');
    columns.add('timestamp');

    // Add property fields
    for (const event of events.slice(0, 100)) { // Sample first 100 events
      for (const key of Object.keys(event.properties)) {
        columns.add(`properties.${key}`);
      }

      if (event.metadata) {
        for (const key of Object.keys(event.metadata)) {
          columns.add(`metadata.${key}`);
        }
      }
    }

    return Array.from(columns);
  }

  // Infer column type
  private inferColumnType(events: AnalyticsEvent[], field: string): string {
    for (const event of events.slice(0, 10)) {
      const value = this.getFieldValue(event, field);

      if (value !== null && value !== undefined) {
        if (typeof value === 'number') return 'number';
        if (typeof value === 'boolean') return 'boolean';
        if (typeof value === 'string') return 'string';
        if (Array.isArray(value)) return 'array';
        if (typeof value === 'object') return 'object';
      }
    }

    return 'string';
  }

  // Escape CSV value
  private escapeCSV(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const str = String(value);

    // Escape quotes and wrap in quotes if needed
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }

    return str;
  }

  // Stream export (for large datasets)
  async *streamExport(
    config: ExportConfig,
    batchSize: number = 1000
  ): AsyncGenerator<string> {
    const events = this.aggregator.query(config.filter || {});
    const columns = config.fields || this.inferColumns(events);

    // Yield header
    if (config.format === 'csv') {
      yield columns.join(',') + '\n';
    } else if (config.format === 'json') {
      yield '[\n';
    }

    // Yield data in batches
    for (let i = 0; i < events.length; i += batchSize) {
      const batch = events.slice(i, Math.min(i + batchSize, events.length));

      if (config.format === 'csv') {
        const rows = batch.map(event => {
          const row = columns.map(col => this.escapeCSV(this.getFieldValue(event, col)));
          return row.join(',');
        });
        yield rows.join('\n') + '\n';
      } else if (config.format === 'json') {
        for (let j = 0; j < batch.length; j++) {
          const event = batch[j];
          const isLast = i + j === events.length - 1;
          yield JSON.stringify(event) + (isLast ? '\n' : ',\n');
        }
      }
    }

    // Yield footer
    if (config.format === 'json') {
      yield ']\n';
    }
  }

  // Export aggregated data
  async exportAggregated(
    eventType: string,
    metric: string,
    startTime: number,
    endTime: number,
    interval: number,
    format: 'csv' | 'json' = 'csv'
  ): Promise<ExportResult> {
    const startPerf = performance.now();

    // Get aggregated data
    const points = this.aggregator.aggregate(eventType, metric, startTime, endTime, interval);

    let data: string;

    if (format === 'csv') {
      const rows = ['timestamp,value'];
      for (const point of points) {
        rows.push(`${point.timestamp},${point.value}`);
      }
      data = rows.join('\n');
    } else {
      data = JSON.stringify(points, null, 2);
    }

    const duration = performance.now() - startPerf;
    const size = new TextEncoder().encode(data).length;

    return {
      format,
      size,
      recordCount: points.length,
      duration,
      data
    };
  }

  // Generate export summary
  getExportSummary(events: AnalyticsEvent[]): {
    totalRecords: number;
    timeRange: { start: number; end: number };
    eventTypes: Record<string, number>;
    estimatedSizes: Record<string, number>;
  } {
    const eventTypes: Record<string, number> = {};

    let minTime = Infinity;
    let maxTime = -Infinity;

    for (const event of events) {
      // Count event types
      eventTypes[event.type] = (eventTypes[event.type] || 0) + 1;

      // Track time range
      if (event.timestamp < minTime) minTime = event.timestamp;
      if (event.timestamp > maxTime) maxTime = event.timestamp;
    }

    // Estimate sizes for different formats
    const csvSize = this.exportCSV(events.slice(0, 100)).length * (events.length / 100);
    const jsonSize = JSON.stringify(events.slice(0, 100)).length * (events.length / 100);

    return {
      totalRecords: events.length,
      timeRange: { start: minTime, end: maxTime },
      eventTypes,
      estimatedSizes: {
        csv: Math.round(csvSize),
        json: Math.round(jsonSize),
        parquet: Math.round(jsonSize * 0.3) // Parquet is typically ~30% of JSON size
      }
    };
  }
}
