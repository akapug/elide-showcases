# ETL Pipeline - Quick Start Guide

Get up and running with the production-grade ETL pipeline in minutes!

## 1. Prerequisites

- Elide installed ([installation guide](https://elide.dev))
- Python 3.8+ (for polyglot features)

## 2. Start the Server

```bash
# Navigate to the ETL pipeline directory
cd original/showcases/etl-pipeline

# Start the server (default port 8001)
elide serve server.ts
```

The server will start and display:
```
ETL Pipeline starting on port 8001...
```

## 3. Run Your First ETL Job

### Option A: Using the REST API

```bash
# Create a simple ETL job
curl -X POST http://localhost:8001/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "My First ETL Job",
    "source": {
      "type": "file",
      "config": {
        "path": "sample-data.json",
        "format": "json"
      }
    },
    "transforms": [
      {
        "operation": "filter",
        "config": {
          "field": "status",
          "operator": "eq",
          "value": "active"
        }
      }
    ],
    "target": {
      "type": "file",
      "config": {
        "path": "/tmp/filtered-data.json",
        "format": "json"
      }
    }
  }'
```

### Option B: Run Examples

```bash
# Run all comprehensive examples
elide run examples.ts
```

This will demonstrate:
- Basic ETL pipeline
- Data quality checks
- Complex transformations
- Pipeline scheduling
- Data lineage tracking
- Parallel processing
- And more!

## 4. Explore Features

### Check Job Status

```bash
# List all jobs
curl http://localhost:8001/jobs

# Get specific job details
curl http://localhost:8001/jobs/job_1234567890
```

### Monitor Data Quality

```bash
# Run a job with quality checks
curl -X POST http://localhost:8001/jobs \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Quality Check Demo",
    "source": {
      "type": "file",
      "config": { "path": "sample-data.json", "format": "json" },
      "schema": {
        "fields": [
          { "name": "id", "type": "number", "nullable": false },
          { "name": "email", "type": "string", "nullable": false }
        ],
        "required": ["id", "email"],
        "strictMode": false
      }
    },
    "transforms": [],
    "target": {
      "type": "file",
      "config": { "path": "/tmp/validated.json", "format": "json" }
    }
  }'
```

### Use Python for Data Processing

```bash
# Clean data with Python
cat sample-data.json | python3 data_processor.py clean

# Calculate statistics
cat sample-data.json | python3 data_processor.py statistics order_total

# Detect outliers
cat sample-data.json | python3 data_processor.py outliers order_total 2.0

# Aggregate by group
cat sample-data.json | python3 data_processor.py aggregate region order_total sum
```

### Schedule a Pipeline

```bash
# Create a daily scheduled pipeline
curl -X POST http://localhost:8001/schedules \
  -H "Content-Type: application/json" \
  -d '{
    "id": "daily_etl",
    "name": "Daily Customer Sync",
    "cron": "0 2 * * *",
    "enabled": true,
    "retryPolicy": {
      "maxRetries": 3,
      "retryDelay": 5000
    }
  }'

# List all schedules
curl http://localhost:8001/schedules
```

### View Data Lineage

```bash
# Get lineage for an entity (after running jobs)
curl http://localhost:8001/lineage/source_customers
```

### Check Dead Letter Queue

```bash
# View failed records
curl http://localhost:8001/dlq

# Retry failed records for a job
curl -X POST http://localhost:8001/dlq/retry/job_1234567890
```

### Performance Monitoring

```bash
# Get performance statistics
curl http://localhost:8001/performance

# Health check
curl http://localhost:8001/health
```

## 5. Advanced Features

### Parallel Processing

Create a job that uses parallel processing for large datasets:

```typescript
import { ParallelProcessor } from "./parallel-processor.ts";

const processor = new ParallelProcessor({
  maxWorkers: 4,
  batchSize: 1000,
  queueSize: 5000
});

const results = await processor.processBatch(
  largeDataset,
  async (record) => {
    // Transform logic
    return transformedRecord;
  }
);
```

### Custom Transformations

Add custom transformation logic:

```typescript
import { FieldTransformer } from "./transformers.ts";

const transformer = new FieldTransformer();
const result = transformer.transform(data, {
  name: "custom_transform",
  type: "add",
  params: {
    field: "computed_field",
    value: (record) => record.price * record.quantity
  }
});
```

### Data Quality Rules

Define custom quality rules:

```typescript
import { DataQualityChecker, CommonQualityRules } from "./quality-checker.ts";

const checker = new DataQualityChecker([
  CommonQualityRules.notNull("email"),
  CommonQualityRules.unique("id"),
  CommonQualityRules.inRange("age", 0, 120),
  {
    name: "custom_rule",
    type: "custom",
    condition: (record) => record.total >= 0,
    severity: "critical"
  }
]);

const report = checker.check(data);
checker.printReport(report);
```

## 6. Common Patterns

### Incremental Loading

```typescript
import { PostgreSQLSource, IncrementalSource } from "./data-sources.ts";

const dbSource = new PostgreSQLSource({ /* config */ });
const incrementalSource = new IncrementalSource(dbSource, "updated_at");

await incrementalSource.loadWatermark("/tmp/watermark.json");
const query = incrementalSource.buildIncrementalQuery("SELECT * FROM customers");
const newRecords = await dbSource.query(query);

const maxWatermark = incrementalSource.extractMaxWatermark(newRecords);
await incrementalSource.saveWatermark("/tmp/watermark.json", maxWatermark);
```

### Aggregation Pipeline

```typescript
import { AggregationTransformer } from "./transformers.ts";

const aggTransformer = new AggregationTransformer();
const aggregated = aggTransformer.transform(salesData, {
  name: "sales_by_region",
  type: "aggregate",
  params: {
    groupBy: ["region", "product"],
    aggregations: {
      revenue: "sum",
      quantity: "sum",
      orders: "count"
    }
  }
});
```

### Window Functions

```typescript
import { WindowTransformer } from "./transformers.ts";

const windowTransformer = new WindowTransformer();
const withRunningTotal = windowTransformer.transform(data, {
  name: "running_total",
  type: "window",
  params: {
    windowFunction: "cumsum",
    field: "amount",
    outputField: "running_total",
    orderBy: [{ field: "date", direction: "asc" }]
  }
});
```

## 7. Testing

### Test Individual Components

```bash
# Test validators
elide run -c "
import { BatchValidator, CommonValidationRules } from './validators.ts';
const validator = new BatchValidator([
  CommonValidationRules.email('email')
]);
const result = validator.validateBatch([
  { email: 'valid@test.com' },
  { email: 'invalid' }
]);
console.log(result);
"

# Test transformers
elide run -c "
import { AggregationTransformer } from './transformers.ts';
const transformer = new AggregationTransformer();
// ... test code
"
```

### Integration Testing

Create test ETL jobs and verify outputs:

```bash
# Run test job
curl -X POST http://localhost:8001/jobs -d @test-job.json

# Verify output file
cat /tmp/output.json | jq '.'
```

## 8. Next Steps

- Read the full [README.md](./README.md) for detailed documentation
- Explore [examples.ts](./examples.ts) for comprehensive examples
- Review individual module files for advanced features:
  - `data-sources.ts` - Multiple data source types
  - `validators.ts` - Validation and cleaning
  - `transformers.ts` - Advanced transformations
  - `quality-checker.ts` - Data quality monitoring
  - `scheduler.ts` - Pipeline scheduling
  - `lineage-tracker.ts` - Data lineage tracking
  - `parallel-processor.ts` - Performance optimization

## 9. Troubleshooting

### Server won't start
- Check if port 8001 is already in use: `lsof -i :8001`
- Try a different port: `PORT=8002 elide serve server.ts`

### Import errors
- Ensure you're in the correct directory
- Check that all TypeScript files are present
- Verify Elide installation: `elide --version`

### Python integration not working
- Check Python version: `python3 --version` (needs 3.8+)
- Ensure `data_processor.py` is executable: `chmod +x data_processor.py`

### Performance issues
- Increase worker count for parallel processing
- Reduce batch size if memory usage is high
- Use streaming for large files
- Check system resources: `top` or `htop`

## 10. Support

- Documentation: See [README.md](./README.md)
- Examples: Run `elide run examples.ts`
- Issues: Check console logs for error messages
- Community: Visit [Elide discussions](https://github.com/elide-dev/elide/discussions)

---

Happy ETL processing! 🚀
