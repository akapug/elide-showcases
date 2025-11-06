# ETL Data Pipeline

A comprehensive Extract-Transform-Load (ETL) data pipeline built with TypeScript and Python, featuring polyglot data processing, scheduling, and quality validation.

## Overview

This showcase demonstrates a production-ready ETL pipeline with:

- **Multi-source Extraction**: API, CSV, JSON, and database sources
- **Polyglot Transformation**: TypeScript validation + Python data processing
- **Flexible Loading**: Database, file, and streaming outputs
- **Cron-based Scheduling**: Automated pipeline execution
- **Data Quality**: Validation, normalization, and enrichment
- **Error Handling**: Retry logic, error recovery, and monitoring
- **Pipeline Monitoring**: Metrics, events, and reporting

## Architecture

```
data-pipeline/
├── orchestrator/          # Pipeline orchestration
│   ├── pipeline.ts        # Main ETL orchestrator
│   ├── scheduler.ts       # Cron-based scheduler
│   └── monitor.ts         # Metrics and monitoring
├── extractors/            # Data extraction
│   ├── api-extractor.ts   # REST API extraction
│   ├── csv-extractor.ts   # CSV file extraction
│   └── json-extractor.ts  # JSON file extraction
├── transformers/          # Data transformation
│   ├── validator.ts       # Schema validation
│   ├── normalizer.py      # Python data normalization
│   └── enricher.ts        # Data enrichment
├── loaders/               # Data loading
│   ├── db-loader.ts       # Database loader
│   └── file-loader.ts     # File output loader
├── tests/                 # Test suite
├── docs/                  # Documentation
└── example.ts             # Usage examples
```

## Features

### 1. Extract Phase

Extract data from multiple sources:

```typescript
const config: PipelineConfig = {
  extractors: [
    {
      type: 'api',
      config: {
        url: 'https://api.example.com/data',
        pagination: { type: 'offset', pageSize: 100 }
      }
    },
    {
      type: 'csv',
      config: { filePath: './data/input.csv' }
    },
    {
      type: 'json',
      config: { filePath: './data/input.json' }
    }
  ]
};
```

**Supported Sources:**
- REST APIs with pagination (offset, cursor, page-based)
- CSV files with configurable delimiters
- JSON and JSON Lines files
- Directory scanning for multiple files

### 2. Transform Phase

Transform and validate data:

```typescript
const config: PipelineConfig = {
  transformers: [
    {
      type: 'validator',
      config: {
        schema: {
          email: [{ type: 'email' }],
          age: [{ type: 'min', value: 0 }]
        }
      }
    },
    {
      type: 'enricher',
      config: {
        computedFields: {
          fullName: { type: 'concat', expression: '{firstName} {lastName}' }
        }
      }
    }
  ]
};
```

**Transformations:**
- Schema validation with custom rules
- Python-based data normalization
- Field enrichment and computed values
- Data aggregation and grouping
- Lookup tables for reference data

### 3. Load Phase

Load data to destinations:

```typescript
const config: PipelineConfig = {
  loaders: [
    {
      type: 'database',
      config: {
        type: 'postgres',
        table: 'users',
        mode: 'upsert'
      }
    },
    {
      type: 'file',
      config: {
        outputPath: './output.json',
        format: 'json'
      }
    }
  ]
};
```

**Supported Destinations:**
- Databases (SQLite, PostgreSQL, MySQL, MongoDB)
- File formats (JSON, JSONL, CSV, TSV)
- Partitioned outputs
- Streaming for large datasets

### 4. Scheduling

Schedule pipelines with cron expressions:

```typescript
const scheduler = new PipelineScheduler();

scheduler.addJob({
  name: 'daily-report',
  cron: '0 0 * * *',  // Daily at midnight
  pipeline: pipelineConfig
});

scheduler.start();
```

### 5. Monitoring

Track pipeline execution:

```typescript
pipeline.on('stage:complete', (stage, result) => {
  console.log(`${stage}: ${result.metrics.recordsProcessed} records`);
});

const metrics = monitor.getAggregatedMetrics();
console.log(`Success rate: ${metrics.successRate * 100}%`);
```

## Usage Examples

### Example 1: CSV to JSON

```typescript
import { ETLPipeline } from './orchestrator/pipeline';

const pipeline = new ETLPipeline({
  name: 'csv-to-json',
  extractors: [{ type: 'csv', config: { filePath: 'input.csv' } }],
  transformers: [{ type: 'validator', config: { schema } }],
  loaders: [{ type: 'file', config: { outputPath: 'output.json', format: 'json' } }],
  options: { continueOnError: true }
});

const result = await pipeline.execute();
```

### Example 2: API to Database

```typescript
const pipeline = new ETLPipeline({
  name: 'api-to-db',
  extractors: [{
    type: 'api',
    config: {
      url: 'https://api.example.com/users',
      pagination: { type: 'offset', pageSize: 100 }
    }
  }],
  transformers: [{
    type: 'enricher',
    config: { computedFields: { processedAt: { type: 'date', expression: 'now' } } }
  }],
  loaders: [{
    type: 'database',
    config: { table: 'users', mode: 'upsert', conflictKeys: ['id'] }
  }],
  options: {
    retryConfig: { maxAttempts: 3, backoffMs: 1000 }
  }
});

await pipeline.execute();
```

### Example 3: Data Quality Pipeline

```typescript
const pipeline = new ETLPipeline({
  name: 'data-quality',
  extractors: [{ type: 'csv', config: { filePath: 'customers.csv' } }],
  transformers: [
    {
      type: 'enricher',
      config: {
        usePythonNormalizer: true,
        pythonConfig: {
          remove_duplicates: true,
          remove_empty_strings: true
        }
      }
    },
    {
      type: 'validator',
      config: {
        schema: CommonSchemas.user,
        addValidationField: true
      }
    }
  ],
  loaders: [{ type: 'file', config: { outputPath: 'clean.json', format: 'json' } }],
  options: { archiveData: true }
});

await pipeline.execute();
```

## Polyglot Integration

### Using TypeScript Validator

```typescript
import { DataValidator, ValidationSchema } from './transformers/validator';

const schema: ValidationSchema = {
  email: [{ type: 'required' }, { type: 'email' }],
  age: [{ type: 'min', value: 0 }, { type: 'max', value: 150 }]
};

const validator = new DataValidator();
const result = await validator.transform(data, { schema }, context);
```

### Using Python Normalizer

```python
from transformers.normalizer import DataNormalizer

normalizer = DataNormalizer({
    'remove_duplicates': True,
    'remove_empty_strings': True
})

result = normalizer.transform(data)
```

### Integration with Elide Examples

This pipeline uses:
- **validator**: Schema validation and data quality checks
- **entities**: Data modeling and type definitions
- **diff**: Change detection and comparison
- **cron-parser**: Schedule parsing (in scheduler.ts)

## Testing

Run the test suite:

```bash
# Run pipeline tests
ts-node tests/pipeline.test.ts

# Run transformer tests
ts-node tests/transformers.test.ts

# Run all tests
npm test
```

## Configuration

### Pipeline Options

```typescript
interface PipelineOptions {
  parallel?: boolean;              // Run stages in parallel
  maxConcurrency?: number;         // Max concurrent operations
  continueOnError?: boolean;       // Continue on errors
  retryConfig?: RetryConfig;       // Retry configuration
  timeout?: number;                // Operation timeout
  validateSchema?: boolean;        // Enable schema validation
  archiveData?: boolean;          // Archive processed data
  archivePath?: string;           // Archive directory
}
```

### Retry Configuration

```typescript
interface RetryConfig {
  maxAttempts: number;           // Max retry attempts
  backoffMs: number;             // Initial backoff
  backoffMultiplier?: number;    // Backoff multiplier
  maxBackoffMs?: number;         // Max backoff time
}
```

## Metrics and Monitoring

Access pipeline metrics:

```typescript
const monitor = new PipelineMonitor();

// Get metrics for a run
const metrics = monitor.getMetrics(runId);

// Get aggregated metrics
const stats = monitor.getAggregatedMetrics();
console.log(`Total runs: ${stats.totalRuns}`);
console.log(`Success rate: ${stats.successRate * 100}%`);
console.log(`Avg duration: ${stats.averageDurationMs}ms`);

// Generate report
const report = monitor.generateReport();
console.log(report);
```

## Error Handling

### Retry Logic

```typescript
options: {
  retryConfig: {
    maxAttempts: 3,
    backoffMs: 1000,
    backoffMultiplier: 2,
    maxBackoffMs: 30000
  }
}
```

### Error Recovery

```typescript
options: {
  continueOnError: true,  // Continue processing on errors
  onError: 'continue'     // Error handling strategy
}
```

### Validation Errors

```typescript
transformers: [{
  type: 'validator',
  config: {
    strict: false,           // Don't throw on validation errors
    removeInvalid: true,     // Remove invalid records
    addValidationField: true // Add validation info to records
  }
}]
```

## Performance

- **Batch Processing**: Process data in configurable batch sizes
- **Parallel Execution**: Run extractors and loaders in parallel
- **Streaming**: Stream large datasets to avoid memory issues
- **Connection Pooling**: Reuse database connections

## API Reference

See [API Documentation](./docs/API.md) for detailed API reference.

## Examples

See [example.ts](./example.ts) for complete working examples.

## License

Part of the Elide Showcases project.

## Contributing

This is a showcase project demonstrating ETL pipeline patterns and polyglot data processing.
