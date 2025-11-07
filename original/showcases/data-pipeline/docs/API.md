# ETL Data Pipeline API Reference

Complete API documentation for the ETL Data Pipeline.

## Table of Contents

- [Pipeline Orchestration](#pipeline-orchestration)
- [Extractors](#extractors)
- [Transformers](#transformers)
- [Loaders](#loaders)
- [Scheduling](#scheduling)
- [Monitoring](#monitoring)

## Pipeline Orchestration

### ETLPipeline

Main orchestration class for ETL pipelines.

#### Constructor

```typescript
new ETLPipeline(config: PipelineConfig)
```

#### Methods

##### execute()

Execute the pipeline.

```typescript
async execute(): Promise<PipelineResult>
```

**Returns:** `PipelineResult` with execution details.

##### registerExtractor()

Register an extractor component.

```typescript
registerExtractor(type: string, extractor: any): void
```

##### registerTransformer()

Register a transformer component.

```typescript
registerTransformer(type: string, transformer: any): void
```

##### registerLoader()

Register a loader component.

```typescript
registerLoader(type: string, loader: any): void
```

##### getStatus()

Get current pipeline status.

```typescript
getStatus(): { isRunning: boolean; currentContext?: PipelineContext; metrics: PipelineMetrics | null }
```

##### stop()

Stop the pipeline gracefully.

```typescript
async stop(): Promise<void>
```

#### Events

- `pipeline:start` - Pipeline execution started
- `pipeline:complete` - Pipeline execution completed
- `pipeline:error` - Pipeline error occurred
- `stage:start` - Stage started
- `stage:complete` - Stage completed
- `stage:error` - Stage error occurred

#### Example

```typescript
const pipeline = new ETLPipeline({
  name: 'my-pipeline',
  extractors: [...],
  transformers: [...],
  loaders: [...],
  options: {
    parallel: true,
    continueOnError: true
  }
});

pipeline.on('pipeline:complete', (result) => {
  console.log(`Processed ${result.totalRecords} records`);
});

const result = await pipeline.execute();
```

## Extractors

### ApiExtractor

Extract data from REST APIs.

#### extract()

```typescript
async extract(config: ApiExtractorConfig, context: PipelineContext): Promise<any[]>
```

**Configuration:**

```typescript
interface ApiExtractorConfig {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  auth?: {
    type: 'bearer' | 'basic' | 'apikey';
    token?: string;
    username?: string;
    password?: string;
  };
  params?: Record<string, any>;
  pagination?: {
    type: 'offset' | 'cursor' | 'page';
    pageSize?: number;
    maxPages?: number;
  };
  dataPath?: string;
  rateLimit?: { requestsPerSecond: number };
}
```

**Example:**

```typescript
const extractor = new ApiExtractor();
const data = await extractor.extract({
  url: 'https://api.example.com/users',
  pagination: {
    type: 'offset',
    pageSize: 100,
    maxPages: 10
  },
  dataPath: 'data.users'
}, context);
```

### CsvExtractor

Extract data from CSV files.

#### extract()

```typescript
async extract(config: CsvExtractorConfig, context: PipelineContext): Promise<any[]>
```

**Configuration:**

```typescript
interface CsvExtractorConfig {
  filePath: string;
  delimiter?: string;
  quote?: string;
  encoding?: BufferEncoding;
  hasHeader?: boolean;
  columns?: string[];
  skipRows?: number;
  maxRows?: number;
  trimFields?: boolean;
}
```

**Example:**

```typescript
const extractor = new CsvExtractor();
const data = await extractor.extract({
  filePath: './data/users.csv',
  delimiter: ',',
  hasHeader: true,
  encoding: 'utf8'
}, context);
```

### JsonExtractor

Extract data from JSON files.

#### extract()

```typescript
async extract(config: JsonExtractorConfig, context: PipelineContext): Promise<any[]>
```

**Configuration:**

```typescript
interface JsonExtractorConfig {
  filePath: string;
  encoding?: BufferEncoding;
  format?: 'json' | 'jsonl' | 'ndjson';
  dataPath?: string;
  maxRecords?: number;
  filter?: (record: any) => boolean;
}
```

**Example:**

```typescript
const extractor = new JsonExtractor();
const data = await extractor.extract({
  filePath: './data/users.json',
  dataPath: 'data.users',
  filter: (record) => record.active === true
}, context);
```

## Transformers

### DataValidator

Validate data against schema.

#### transform()

```typescript
async transform(data: any[], config: ValidatorConfig, context: PipelineContext): Promise<any[]>
```

**Configuration:**

```typescript
interface ValidatorConfig {
  schema: ValidationSchema;
  strict?: boolean;
  removeInvalid?: boolean;
  addValidationField?: boolean;
}

interface ValidationSchema {
  [field: string]: ValidationRule[];
}

type ValidationRule =
  | { type: 'required' }
  | { type: 'type'; dataType: string }
  | { type: 'min'; value: number }
  | { type: 'max'; value: number }
  | { type: 'pattern'; pattern: string | RegExp }
  | { type: 'email' }
  | { type: 'url' }
  | { type: 'enum'; values: any[] }
  | { type: 'custom'; validator: (value: any) => boolean };
```

**Example:**

```typescript
const validator = new DataValidator();
const cleaned = await validator.transform(data, {
  schema: {
    email: [{ type: 'required' }, { type: 'email' }],
    age: [{ type: 'min', value: 0 }, { type: 'max', value: 150 }]
  },
  removeInvalid: true
}, context);
```

### DataEnricher

Enrich data with computed fields and lookups.

#### transform()

```typescript
async transform(data: any[], config: EnricherConfig, context: PipelineContext): Promise<any[]>
```

**Configuration:**

```typescript
interface EnricherConfig {
  usePythonNormalizer?: boolean;
  pythonConfig?: Record<string, any>;
  computedFields?: Record<string, ComputedField>;
  lookups?: LookupConfig[];
  aggregations?: AggregationConfig[];
}
```

**Example:**

```typescript
const enricher = new DataEnricher();
const enriched = await enricher.transform(data, {
  computedFields: {
    fullName: {
      type: 'concat',
      expression: '{firstName} {lastName}'
    },
    total: {
      type: 'arithmetic',
      expression: 'price * quantity',
      fields: ['price', 'quantity']
    }
  },
  lookups: [{
    targetField: 'categoryName',
    lookupField: 'categoryId',
    lookupTable: { '1': 'Electronics', '2': 'Books' }
  }]
}, context);
```

## Loaders

### DatabaseLoader

Load data into databases.

#### load()

```typescript
async load(data: any[], config: DbLoaderConfig, context: PipelineContext): Promise<void>
```

**Configuration:**

```typescript
interface DbLoaderConfig {
  type: 'sqlite' | 'postgres' | 'mysql' | 'mongodb';
  connection: ConnectionConfig;
  table: string;
  batchSize?: number;
  mode: 'insert' | 'upsert' | 'update' | 'replace';
  conflictKeys?: string[];
  createTable?: boolean;
  schema?: TableSchema;
}
```

**Example:**

```typescript
const loader = new DatabaseLoader();
await loader.load(data, {
  type: 'postgres',
  connection: {
    host: 'localhost',
    database: 'mydb',
    username: 'user',
    password: 'pass'
  },
  table: 'users',
  mode: 'upsert',
  conflictKeys: ['id'],
  batchSize: 1000
}, context);
```

### FileLoader

Load data to files.

#### load()

```typescript
async load(data: any[], config: FileLoaderConfig, context: PipelineContext): Promise<void>
```

**Configuration:**

```typescript
interface FileLoaderConfig {
  outputPath: string;
  format: 'json' | 'jsonl' | 'csv' | 'tsv';
  encoding?: BufferEncoding;
  mode?: 'overwrite' | 'append' | 'timestamp';
  csvOptions?: CsvOptions;
  jsonOptions?: JsonOptions;
  createDirectory?: boolean;
}
```

**Example:**

```typescript
const loader = new FileLoader();
await loader.load(data, {
  outputPath: './output/users.json',
  format: 'json',
  mode: 'timestamp',
  createDirectory: true,
  jsonOptions: {
    pretty: true,
    indent: 2
  }
}, context);
```

## Scheduling

### PipelineScheduler

Schedule pipeline execution with cron.

#### Constructor

```typescript
new PipelineScheduler(checkIntervalMs?: number)
```

#### Methods

##### addJob()

Add a scheduled job.

```typescript
addJob(config: ScheduleConfig): string
```

##### removeJob()

Remove a scheduled job.

```typescript
removeJob(jobId: string): boolean
```

##### triggerJob()

Manually trigger a job.

```typescript
async triggerJob(jobId: string): Promise<PipelineResult>
```

##### start()

Start the scheduler.

```typescript
start(): void
```

##### stop()

Stop the scheduler.

```typescript
async stop(): Promise<void>
```

##### getStatus()

Get scheduler status.

```typescript
getStatus(): {
  isStarted: boolean;
  totalJobs: number;
  enabledJobs: number;
  runningJobs: number;
  nextExecution?: Date;
}
```

#### Events

- `scheduler:start` - Scheduler started
- `scheduler:stop` - Scheduler stopped
- `job:added` - Job added
- `job:removed` - Job removed
- `job:start` - Job started
- `job:complete` - Job completed
- `job:error` - Job error occurred

**Example:**

```typescript
const scheduler = new PipelineScheduler();

scheduler.addJob({
  name: 'daily-report',
  cron: '0 0 * * *',  // Daily at midnight
  pipeline: pipelineConfig
});

scheduler.on('job:complete', (job, result) => {
  console.log(`Job ${job.id}: ${result.successfulRecords} records`);
});

scheduler.start();
```

## Monitoring

### PipelineMonitor

Monitor pipeline execution and collect metrics.

#### Methods

##### getMetrics()

Get metrics for a specific run.

```typescript
getMetrics(runId: string): PipelineMetrics | null
```

##### getAggregatedMetrics()

Get aggregated metrics across all runs.

```typescript
getAggregatedMetrics(): AggregatedMetrics
```

**Returns:**

```typescript
interface AggregatedMetrics {
  totalRuns: number;
  successfulRuns: number;
  failedRuns: number;
  successRate: number;
  averageDurationMs: number;
  totalRecordsProcessed: number;
  averageThroughput: number;
  stageDurations: Record<string, number>;
}
```

##### generateReport()

Generate a metrics report.

```typescript
generateReport(): string
```

##### exportMetrics()

Export metrics to JSON.

```typescript
exportMetrics(): string
```

**Example:**

```typescript
const monitor = new PipelineMonitor();

const metrics = monitor.getAggregatedMetrics();
console.log(`Success rate: ${(metrics.successRate * 100).toFixed(2)}%`);
console.log(`Avg throughput: ${metrics.averageThroughput.toFixed(2)} records/sec`);

const report = monitor.generateReport();
console.log(report);
```

## Type Definitions

### PipelineConfig

```typescript
interface PipelineConfig {
  name: string;
  description?: string;
  extractors: ExtractorConfig[];
  transformers: TransformerConfig[];
  loaders: LoaderConfig[];
  options: PipelineOptions;
}
```

### PipelineOptions

```typescript
interface PipelineOptions {
  parallel?: boolean;
  maxConcurrency?: number;
  continueOnError?: boolean;
  retryConfig?: RetryConfig;
  timeout?: number;
  validateSchema?: boolean;
  archiveData?: boolean;
  archivePath?: string;
}
```

### PipelineResult

```typescript
interface PipelineResult {
  pipelineId: string;
  runId: string;
  success: boolean;
  startTime: Date;
  endTime: Date;
  durationMs: number;
  stages: StageResult[];
  totalRecords: number;
  successfulRecords: number;
  failedRecords: number;
  error?: Error;
}
```

### PipelineContext

```typescript
interface PipelineContext {
  pipelineId: string;
  runId: string;
  startTime: Date;
  config: PipelineConfig;
  metadata: Record<string, any>;
}
```

## Error Handling

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts: number;
  backoffMs: number;
  backoffMultiplier?: number;
  maxBackoffMs?: number;
}
```

### Error Recovery Strategies

1. **Continue on Error**: Process remaining records
2. **Rollback**: Undo changes on error
3. **Stop**: Halt pipeline execution

**Example:**

```typescript
options: {
  continueOnError: true,
  retryConfig: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
    maxBackoffMs: 30000
  }
}
```

## Best Practices

1. **Use batch processing** for large datasets
2. **Enable archiving** for audit trails
3. **Configure retries** for transient failures
4. **Monitor metrics** for performance optimization
5. **Validate data** early in the pipeline
6. **Use parallel execution** when possible
7. **Set appropriate timeouts** to prevent hangs
8. **Log errors** for debugging

## See Also

- [README](../README.md) - Overview and examples
- [Example Code](../example.ts) - Working examples
