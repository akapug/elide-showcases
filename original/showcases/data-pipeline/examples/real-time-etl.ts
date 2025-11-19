/**
 * Real-Time ETL Example
 *
 * Demonstrates end-to-end real-time ETL pipeline with:
 * - Stream ingestion from multiple sources
 * - Real-time transformations
 * - Data enrichment
 * - Quality validation
 * - Multi-sink output
 * - Error handling and DLQ
 */

import { EventEmitter } from 'events';
import * as crypto from 'crypto';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface ETLConfig {
  sources: SourceConfig[];
  transformers: TransformerConfig[];
  sinks: SinkConfig[];
  errorHandling: ErrorHandlingConfig;
  metrics: MetricsConfig;
}

export interface SourceConfig {
  name: string;
  type: 'kafka' | 'kinesis' | 'webhook' | 'database';
  connection: any;
  pollInterval?: number;
}

export interface TransformerConfig {
  name: string;
  type: 'map' | 'filter' | 'enrich' | 'aggregate' | 'validate';
  config: any;
}

export interface SinkConfig {
  name: string;
  type: 'database' | 'warehouse' | 's3' | 'elasticsearch' | 'kafka';
  connection: any;
  batchSize?: number;
  flushInterval?: number;
}

export interface ErrorHandlingConfig {
  retryAttempts: number;
  retryDelay: number;
  dlqEnabled: boolean;
  dlqSink?: SinkConfig;
}

export interface MetricsConfig {
  enabled: boolean;
  interval: number;
  exporters: string[];
}

export interface DataRecord {
  id: string;
  timestamp: number;
  source: string;
  data: any;
  metadata: Record<string, any>;
}

// ============================================================================
// Data Sources
// ============================================================================

abstract class DataSource extends EventEmitter {
  protected config: SourceConfig;
  protected running: boolean = false;

  constructor(config: SourceConfig) {
    super();
    this.config = config;
  }

  abstract start(): Promise<void>;
  abstract stop(): Promise<void>;

  protected emit(event: string, data: any): boolean {
    return super.emit(event, data);
  }
}

class KafkaSource extends DataSource {
  private pollTimer?: NodeJS.Timeout;

  async start(): Promise<void> {
    console.log(`Starting Kafka source: ${this.config.name}`);
    this.running = true;

    this.pollTimer = setInterval(() => {
      this.poll();
    }, this.config.pollInterval || 100);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  private poll(): void {
    if (!this.running) return;

    // Simulate polling Kafka
    const record: DataRecord = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      source: this.config.name,
      data: {
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        action: ['click', 'view', 'purchase'][Math.floor(Math.random() * 3)],
        value: Math.random() * 100,
        category: ['electronics', 'clothing', 'food'][Math.floor(Math.random() * 3)]
      },
      metadata: {
        partition: Math.floor(Math.random() * 3),
        offset: Date.now()
      }
    };

    this.emit('data', record);
  }
}

class DatabaseSource extends DataSource {
  private lastPollTime: number = 0;
  private pollTimer?: NodeJS.Timeout;

  async start(): Promise<void> {
    console.log(`Starting Database source: ${this.config.name}`);
    this.running = true;
    this.lastPollTime = Date.now();

    this.pollTimer = setInterval(() => {
      this.poll();
    }, this.config.pollInterval || 5000);
  }

  async stop(): Promise<void> {
    this.running = false;
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
    }
  }

  private poll(): void {
    if (!this.running) return;

    // Simulate CDC (Change Data Capture)
    const changes = Math.floor(Math.random() * 5);

    for (let i = 0; i < changes; i++) {
      const record: DataRecord = {
        id: crypto.randomUUID(),
        timestamp: Date.now(),
        source: this.config.name,
        data: {
          table: 'users',
          operation: ['INSERT', 'UPDATE', 'DELETE'][Math.floor(Math.random() * 3)],
          recordId: Math.floor(Math.random() * 10000),
          fields: {
            name: `User ${Math.floor(Math.random() * 1000)}`,
            email: `user${Math.floor(Math.random() * 1000)}@example.com`,
            status: ['active', 'inactive'][Math.floor(Math.random() * 2)]
          }
        },
        metadata: {
          lsn: Date.now()
        }
      };

      this.emit('data', record);
    }
  }
}

// ============================================================================
// Transformers
// ============================================================================

abstract class Transformer {
  protected config: TransformerConfig;

  constructor(config: TransformerConfig) {
    this.config = config;
  }

  abstract transform(record: DataRecord): Promise<DataRecord | null>;
}

class MapTransformer extends Transformer {
  async transform(record: DataRecord): Promise<DataRecord | null> {
    // Apply field mappings
    const mappings = this.config.config.mappings || {};

    const transformed = { ...record };
    transformed.data = { ...record.data };

    for (const [oldKey, newKey] of Object.entries(mappings)) {
      if (oldKey in transformed.data) {
        transformed.data[newKey] = transformed.data[oldKey];
        delete transformed.data[oldKey];
      }
    }

    // Add computed fields
    transformed.data._processed_at = new Date().toISOString();
    transformed.data._etl_version = '1.0.0';

    return transformed;
  }
}

class FilterTransformer extends Transformer {
  async transform(record: DataRecord): Promise<DataRecord | null> {
    const conditions = this.config.config.conditions || [];

    for (const condition of conditions) {
      const { field, operator, value } = condition;
      const fieldValue = this.getNestedField(record.data, field);

      let passes = false;

      switch (operator) {
        case 'equals':
          passes = fieldValue === value;
          break;
        case 'not_equals':
          passes = fieldValue !== value;
          break;
        case 'greater_than':
          passes = fieldValue > value;
          break;
        case 'less_than':
          passes = fieldValue < value;
          break;
        case 'contains':
          passes = String(fieldValue).includes(value);
          break;
        case 'in':
          passes = Array.isArray(value) && value.includes(fieldValue);
          break;
      }

      if (!passes) {
        return null; // Filter out
      }
    }

    return record;
  }

  private getNestedField(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }
}

class EnrichmentTransformer extends Transformer {
  private cache: Map<string, any> = new Map();

  async transform(record: DataRecord): Promise<DataRecord | null> {
    const enriched = { ...record };
    enriched.data = { ...record.data };

    // Lookup enrichment
    if (this.config.config.lookupEnabled) {
      const lookupKey = record.data[this.config.config.lookupField];

      if (lookupKey) {
        const enrichmentData = await this.lookup(lookupKey);
        if (enrichmentData) {
          enriched.data = { ...enriched.data, ...enrichmentData };
        }
      }
    }

    // Add statistical enrichment
    enriched.data._enriched_at = new Date().toISOString();
    enriched.data._data_quality_score = this.calculateQualityScore(record.data);

    return enriched;
  }

  private async lookup(key: string): Promise<any | null> {
    // Check cache
    if (this.cache.has(key)) {
      return this.cache.get(key);
    }

    // Simulate external lookup
    await this.sleep(10);

    const data = {
      category_name: `Category ${key}`,
      category_description: 'Category description',
      popularity_score: Math.random()
    };

    this.cache.set(key, data);
    return data;
  }

  private calculateQualityScore(data: any): number {
    let score = 1.0;

    // Check for required fields
    const requiredFields = this.config.config.requiredFields || [];
    const missingFields = requiredFields.filter((field: string) => !(field in data));
    score -= missingFields.length * 0.1;

    // Check for null values
    const nullCount = Object.values(data).filter(v => v === null || v === undefined).length;
    score -= nullCount * 0.05;

    return Math.max(0, Math.min(1, score));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class ValidationTransformer extends Transformer {
  async transform(record: DataRecord): Promise<DataRecord | null> {
    const schema = this.config.config.schema;

    if (!schema) {
      return record;
    }

    const errors = this.validate(record.data, schema);

    if (errors.length > 0) {
      // Add validation errors to metadata
      record.metadata.validation_errors = errors;

      if (this.config.config.strict) {
        return null; // Reject invalid records
      }
    }

    return record;
  }

  private validate(data: any, schema: any): string[] {
    const errors: string[] = [];

    for (const [field, rules] of Object.entries(schema)) {
      const value = data[field];
      const fieldRules = rules as any;

      if (fieldRules.required && (value === undefined || value === null)) {
        errors.push(`Field '${field}' is required`);
      }

      if (fieldRules.type && value !== undefined && value !== null) {
        const actualType = typeof value;
        if (actualType !== fieldRules.type) {
          errors.push(`Field '${field}' must be of type '${fieldRules.type}'`);
        }
      }

      if (fieldRules.min !== undefined && typeof value === 'number' && value < fieldRules.min) {
        errors.push(`Field '${field}' must be >= ${fieldRules.min}`);
      }

      if (fieldRules.max !== undefined && typeof value === 'number' && value > fieldRules.max) {
        errors.push(`Field '${field}' must be <= ${fieldRules.max}`);
      }
    }

    return errors;
  }
}

// ============================================================================
// Data Sinks
// ============================================================================

abstract class DataSink extends EventEmitter {
  protected config: SinkConfig;
  protected buffer: DataRecord[] = [];
  protected flushTimer?: NodeJS.Timeout;

  constructor(config: SinkConfig) {
    super();
    this.config = config;
    this.startFlushTimer();
  }

  abstract write(record: DataRecord): Promise<void>;
  abstract flush(): Promise<void>;
  abstract close(): Promise<void>;

  protected startFlushTimer(): void {
    const interval = this.config.flushInterval || 5000;
    this.flushTimer = setInterval(() => {
      this.flush();
    }, interval);
  }

  protected addToBuffer(record: DataRecord): void {
    this.buffer.push(record);

    if (this.buffer.length >= (this.config.batchSize || 100)) {
      this.flush();
    }
  }
}

class DatabaseSink extends DataSink {
  async write(record: DataRecord): Promise<void> {
    this.addToBuffer(record);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    console.log(`Flushing ${batch.length} records to database: ${this.config.name}`);

    // Simulate database write
    await this.sleep(50);

    this.emit('flushed', { count: batch.length, sink: this.config.name });
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

class S3Sink extends DataSink {
  private fileBuffer: string = '';

  async write(record: DataRecord): Promise<void> {
    this.fileBuffer += JSON.stringify(record) + '\n';
    this.addToBuffer(record);
  }

  async flush(): Promise<void> {
    if (this.buffer.length === 0) return;

    const batch = [...this.buffer];
    this.buffer = [];

    const filename = `etl-output-${Date.now()}.jsonl`;
    console.log(`Writing ${batch.length} records to S3: ${filename}`);

    // Simulate S3 upload
    await this.sleep(100);

    this.fileBuffer = '';
    this.emit('flushed', { count: batch.length, sink: this.config.name, filename });
  }

  async close(): Promise<void> {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
    }
    await this.flush();
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ============================================================================
// Real-Time ETL Pipeline
// ============================================================================

export class RealTimeETLPipeline extends EventEmitter {
  private config: ETLConfig;
  private sources: Map<string, DataSource> = new Map();
  private transformers: Transformer[] = [];
  private sinks: Map<string, DataSink> = new Map();
  private dlqSink?: DataSink;
  private running: boolean = false;

  private metrics = {
    recordsProcessed: 0,
    recordsFiltered: 0,
    recordsFailed: 0,
    recordsWritten: 0,
    startTime: 0
  };

  constructor(config: ETLConfig) {
    super();
    this.config = config;
  }

  async initialize(): Promise<void> {
    console.log('Initializing ETL pipeline...');

    // Initialize sources
    for (const sourceConfig of this.config.sources) {
      let source: DataSource;

      switch (sourceConfig.type) {
        case 'kafka':
          source = new KafkaSource(sourceConfig);
          break;
        case 'database':
          source = new DatabaseSource(sourceConfig);
          break;
        default:
          throw new Error(`Unknown source type: ${sourceConfig.type}`);
      }

      source.on('data', (record: DataRecord) => this.processRecord(record));
      this.sources.set(sourceConfig.name, source);
    }

    // Initialize transformers
    for (const transformerConfig of this.config.transformers) {
      let transformer: Transformer;

      switch (transformerConfig.type) {
        case 'map':
          transformer = new MapTransformer(transformerConfig);
          break;
        case 'filter':
          transformer = new FilterTransformer(transformerConfig);
          break;
        case 'enrich':
          transformer = new EnrichmentTransformer(transformerConfig);
          break;
        case 'validate':
          transformer = new ValidationTransformer(transformerConfig);
          break;
        default:
          throw new Error(`Unknown transformer type: ${transformerConfig.type}`);
      }

      this.transformers.push(transformer);
    }

    // Initialize sinks
    for (const sinkConfig of this.config.sinks) {
      let sink: DataSink;

      switch (sinkConfig.type) {
        case 'database':
          sink = new DatabaseSink(sinkConfig);
          break;
        case 's3':
          sink = new S3Sink(sinkConfig);
          break;
        default:
          throw new Error(`Unknown sink type: ${sinkConfig.type}`);
      }

      sink.on('flushed', (data: any) => this.emit('sink:flushed', data));
      this.sinks.set(sinkConfig.name, sink);
    }

    // Initialize DLQ
    if (this.config.errorHandling.dlqEnabled && this.config.errorHandling.dlqSink) {
      this.dlqSink = new DatabaseSink(this.config.errorHandling.dlqSink);
    }

    console.log('ETL pipeline initialized');
  }

  async start(): Promise<void> {
    console.log('Starting ETL pipeline...');
    this.running = true;
    this.metrics.startTime = Date.now();

    // Start all sources
    for (const source of this.sources.values()) {
      await source.start();
    }

    // Start metrics reporting
    if (this.config.metrics.enabled) {
      this.startMetricsReporting();
    }

    this.emit('started');
    console.log('ETL pipeline started');
  }

  async stop(): Promise<void> {
    console.log('Stopping ETL pipeline...');
    this.running = false;

    // Stop all sources
    for (const source of this.sources.values()) {
      await source.stop();
    }

    // Flush and close all sinks
    for (const sink of this.sinks.values()) {
      await sink.close();
    }

    if (this.dlqSink) {
      await this.dlqSink.close();
    }

    this.emit('stopped');
    console.log('ETL pipeline stopped');
  }

  private async processRecord(record: DataRecord): Promise<void> {
    this.metrics.recordsProcessed++;

    try {
      let currentRecord: DataRecord | null = record;

      // Apply transformers
      for (const transformer of this.transformers) {
        if (!currentRecord) break;

        currentRecord = await transformer.transform(currentRecord);
      }

      // Check if record was filtered
      if (!currentRecord) {
        this.metrics.recordsFiltered++;
        this.emit('record:filtered', record);
        return;
      }

      // Write to sinks
      await this.writeToSinks(currentRecord);

      this.metrics.recordsWritten++;
      this.emit('record:processed', currentRecord);

    } catch (error) {
      this.metrics.recordsFailed++;
      await this.handleError(record, error as Error);
    }
  }

  private async writeToSinks(record: DataRecord): Promise<void> {
    const writePromises = Array.from(this.sinks.values()).map(sink =>
      sink.write(record)
    );

    await Promise.all(writePromises);
  }

  private async handleError(record: DataRecord, error: Error): Promise<void> {
    console.error('Error processing record:', error);

    this.emit('record:error', { record, error });

    // Send to DLQ
    if (this.dlqSink) {
      const dlqRecord = {
        ...record,
        metadata: {
          ...record.metadata,
          error: error.message,
          error_stack: error.stack,
          failed_at: new Date().toISOString()
        }
      };

      await this.dlqSink.write(dlqRecord);
    }
  }

  private startMetricsReporting(): void {
    setInterval(() => {
      const elapsed = (Date.now() - this.metrics.startTime) / 1000;
      const throughput = this.metrics.recordsProcessed / elapsed;

      console.log('\n=== ETL Metrics ===');
      console.log(`Records Processed: ${this.metrics.recordsProcessed}`);
      console.log(`Records Filtered: ${this.metrics.recordsFiltered}`);
      console.log(`Records Failed: ${this.metrics.recordsFailed}`);
      console.log(`Records Written: ${this.metrics.recordsWritten}`);
      console.log(`Throughput: ${throughput.toFixed(2)} records/sec`);
      console.log('==================\n');

      this.emit('metrics', this.metrics);
    }, this.config.metrics.interval);
  }
}

// ============================================================================
// Example Usage
// ============================================================================

export async function runExample(): Promise<void> {
  const config: ETLConfig = {
    sources: [
      {
        name: 'user-events',
        type: 'kafka',
        connection: { brokers: ['localhost:9092'] },
        pollInterval: 500
      }
    ],
    transformers: [
      {
        name: 'field-mapper',
        type: 'map',
        config: {
          mappings: {
            userId: 'user_id',
            action: 'event_type'
          }
        }
      },
      {
        name: 'filter-inactive',
        type: 'filter',
        config: {
          conditions: [
            { field: 'value', operator: 'greater_than', value: 0 }
          ]
        }
      },
      {
        name: 'enrich-data',
        type: 'enrich',
        config: {
          lookupEnabled: true,
          lookupField: 'category',
          requiredFields: ['user_id', 'event_type']
        }
      }
    ],
    sinks: [
      {
        name: 'warehouse',
        type: 'database',
        connection: { host: 'localhost' },
        batchSize: 100,
        flushInterval: 5000
      },
      {
        name: 's3-archive',
        type: 's3',
        connection: { bucket: 'etl-archive' },
        batchSize: 1000,
        flushInterval: 10000
      }
    ],
    errorHandling: {
      retryAttempts: 3,
      retryDelay: 1000,
      dlqEnabled: true,
      dlqSink: {
        name: 'dlq',
        type: 'database',
        connection: { host: 'localhost' }
      }
    },
    metrics: {
      enabled: true,
      interval: 10000,
      exporters: ['console', 'prometheus']
    }
  };

  const pipeline = new RealTimeETLPipeline(config);

  await pipeline.initialize();
  await pipeline.start();

  // Run for 30 seconds
  await new Promise(resolve => setTimeout(resolve, 30000));

  await pipeline.stop();
}

// Run if this is the main module
if (require.main === module) {
  runExample().catch(console.error);
}
