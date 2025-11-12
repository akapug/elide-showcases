/**
 * ETL Pipeline Examples
 *
 * Comprehensive examples demonstrating all production features:
 * - Multiple data sources
 * - Data validation and quality checks
 * - Complex transformations
 * - Pipeline scheduling
 * - Data lineage tracking
 * - Parallel processing
 * - Error handling and retry
 */

import { PostgreSQLSource, RESTAPISource, FileSource, IncrementalSource } from "./data-sources.ts";
import { SchemaValidator, BatchValidator, CommonValidationRules } from "./validators.ts";
import { FieldTransformer, AggregationTransformer, WindowTransformer } from "./transformers.ts";
import { DataQualityChecker, CommonQualityRules } from "./quality-checker.ts";
import { PipelineScheduler, ScheduleBuilder } from "./scheduler.ts";
import { LineageTracker } from "./lineage-tracker.ts";
import { ParallelProcessor, PerformanceMonitor } from "./parallel-processor.ts";

// ==================== Example 1: Basic ETL Pipeline ====================

async function example1_basicPipeline() {
  console.log("\n=== Example 1: Basic ETL Pipeline ===\n");

  // 1. Extract from file
  const fileSource = new FileSource("/tmp/data.json", "json");
  const data = await fileSource.read();
  console.log(`Extracted ${data.length} records`);

  // 2. Transform - select and rename fields
  const transformer = new FieldTransformer();
  const transformed = transformer.transform(data, {
    name: "rename_fields",
    type: "rename",
    params: {
      mapping: {
        customer_id: "id",
        customer_name: "name",
        order_total: "amount"
      }
    }
  });
  console.log(`Transformed ${transformed.data.length} records`);

  // 3. Load (simulated)
  console.log("Loading to target...");
  console.log("Pipeline completed!\n");
}

// ==================== Example 2: Data Quality Checks ====================

async function example2_dataQuality() {
  console.log("\n=== Example 2: Data Quality Checks ===\n");

  const sampleData = [
    { id: 1, email: "user@example.com", age: 25, status: "active" },
    { id: 2, email: "invalid-email", age: -5, status: "active" },
    { id: 3, email: "user3@test.com", age: 150, status: "inactive" },
    { id: 4, email: null, age: 30, status: "active" }
  ];

  // Define quality rules
  const qualityChecker = new DataQualityChecker([
    CommonQualityRules.notNull("email"),
    CommonQualityRules.email("email"),
    CommonQualityRules.inRange("age", 0, 120),
    CommonQualityRules.unique("id")
  ]);

  // Run quality checks
  const report = qualityChecker.check(sampleData);
  qualityChecker.printReport(report);

  console.log(`Overall Quality Score: ${(report.overallScore * 100).toFixed(2)}%`);
  console.log(`Failed Checks: ${report.failedChecks}/${report.checks.length}\n`);
}

// ==================== Example 3: Complex Transformations ====================

async function example3_complexTransformations() {
  console.log("\n=== Example 3: Complex Transformations ===\n");

  const salesData = [
    { id: 1, region: "North", product: "Widget", amount: 100, quantity: 5, date: "2024-01-01" },
    { id: 2, region: "North", product: "Widget", amount: 200, quantity: 10, date: "2024-01-02" },
    { id: 3, region: "South", product: "Gadget", amount: 150, quantity: 3, date: "2024-01-01" },
    { id: 4, region: "South", product: "Widget", amount: 175, quantity: 7, date: "2024-01-03" },
    { id: 5, region: "North", product: "Gadget", amount: 225, quantity: 9, date: "2024-01-02" }
  ];

  // Aggregation: Sum by region and product
  const aggTransformer = new AggregationTransformer();
  const aggregated = aggTransformer.transform(salesData, {
    name: "aggregate_sales",
    type: "aggregate",
    params: {
      groupBy: ["region", "product"],
      aggregations: {
        amount: "sum",
        quantity: "sum"
      }
    }
  });

  console.log("Aggregated Results:");
  console.table(aggregated.data);

  // Window function: Calculate running total
  const windowTransformer = new WindowTransformer();
  const withRunningTotal = windowTransformer.transform(salesData, {
    name: "running_total",
    type: "window",
    params: {
      windowFunction: "cumsum",
      field: "amount",
      outputField: "running_total",
      orderBy: [{ field: "date", direction: "asc" }]
    }
  });

  console.log("\nWith Running Total:");
  console.table(withRunningTotal.data.slice(0, 5));
}

// ==================== Example 4: Pipeline Scheduling ====================

async function example4_scheduling() {
  console.log("\n=== Example 4: Pipeline Scheduling ===\n");

  const scheduler = new PipelineScheduler();

  // Daily ETL job at 2 AM
  const dailySchedule = ScheduleBuilder
    .create("daily_etl", "Daily Customer Sync")
    .cron("0 2 * * *")
    .retry(3, 5000, 2)
    .timeout(300000) // 5 minutes
    .build();

  scheduler.registerSchedule(dailySchedule, async (execution) => {
    console.log(`Running daily ETL job: ${execution.id}`);

    // Simulate ETL work
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { recordsProcessed: 1000 };
  });

  // Hourly incremental sync
  const hourlySchedule = ScheduleBuilder
    .create("hourly_sync", "Hourly Incremental Sync")
    .cron("0 * * * *")
    .retry(2, 3000)
    .build();

  scheduler.registerSchedule(hourlySchedule, async (execution) => {
    console.log(`Running hourly sync: ${execution.id}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { recordsProcessed: 50 };
  });

  scheduler.printScheduleSummary();

  console.log("Schedules registered successfully!\n");
}

// ==================== Example 5: Data Lineage Tracking ====================

async function example5_lineageTracking() {
  console.log("\n=== Example 5: Data Lineage Tracking ===\n");

  const lineageTracker = new LineageTracker();

  // Track source
  lineageTracker.trackSource({
    id: "source_customers",
    type: "database",
    name: "Customer Database",
    location: "postgresql://localhost:5432/crm",
    schema: "public",
    table: "customers",
    timestamp: Date.now()
  });

  // Track transformation
  lineageTracker.trackTransformation({
    id: "transform_clean",
    name: "Clean Customer Data",
    type: "transformation",
    operation: "clean",
    inputs: ["source_customers"],
    outputs: ["cleaned_customers"],
    params: { rules: ["trim", "lowercase", "remove_nulls"] },
    timestamp: Date.now(),
    duration: 1500
  });

  lineageTracker.trackTransformation({
    id: "transform_aggregate",
    name: "Aggregate by Region",
    type: "transformation",
    operation: "aggregate",
    inputs: ["cleaned_customers"],
    outputs: ["aggregated_customers"],
    params: { groupBy: ["region"], agg: "count" },
    timestamp: Date.now(),
    duration: 800
  });

  // Track target
  lineageTracker.trackTarget({
    id: "target_warehouse",
    name: "Data Warehouse",
    type: "database",
    location: "bigquery://project/dataset",
    sourceId: "aggregated_customers"
  });

  // Print lineage summary
  lineageTracker.printSummary();

  // Print specific lineage
  lineageTracker.printLineage("transform_clean");

  // Export to Mermaid diagram
  const mermaid = lineageTracker.exportToMermaid();
  console.log("\nMermaid Diagram:");
  console.log(mermaid);
}

// ==================== Example 6: Parallel Processing ====================

async function example6_parallelProcessing() {
  console.log("\n=== Example 6: Parallel Processing ===\n");

  // Generate test data
  const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
    id: i,
    value: Math.random() * 1000,
    category: `cat_${i % 10}`
  }));

  const processor = new ParallelProcessor({
    maxWorkers: 4,
    batchSize: 100,
    queueSize: 1000,
    timeout: 5000
  });

  console.log(`Processing ${largeDataset.length} records with 4 workers...`);

  const startTime = Date.now();

  const results = await processor.processBatch(
    largeDataset,
    async (record) => {
      // Simulate processing
      return {
        ...record,
        processed: true,
        squared: record.value * record.value
      };
    }
  );

  const duration = Date.now() - startTime;
  const metrics = processor.getMetrics();

  console.log(`\nProcessing completed in ${duration}ms`);
  console.log(`Throughput: ${metrics.throughput.toFixed(2)} records/second`);
  console.log(`Average processing time: ${metrics.avgProcessingTime.toFixed(2)}ms`);
  console.log(`Successful: ${metrics.completedTasks}`);
  console.log(`Failed: ${metrics.failedTasks}\n`);
}

// ==================== Example 7: Incremental Loading ====================

async function example7_incrementalLoading() {
  console.log("\n=== Example 7: Incremental Loading ===\n");

  const dbSource = new PostgreSQLSource({
    host: "localhost",
    port: 5432,
    database: "analytics",
    username: "etl_user",
    password: "secret"
  });

  const incrementalSource = new IncrementalSource(dbSource, "updated_at");

  // Load watermark from previous run
  await incrementalSource.loadWatermark("/tmp/watermark_customers.json");

  // Build incremental query
  const baseQuery = "SELECT * FROM customers";
  const incrementalQuery = incrementalSource.buildIncrementalQuery(baseQuery);

  console.log("Incremental Query:");
  console.log(incrementalQuery);

  // Connect and execute (simulated)
  await dbSource.connect();
  const newRecords = await dbSource.query(incrementalQuery);

  console.log(`\nExtracted ${newRecords.length} new/updated records`);

  // Extract max watermark from results
  const maxWatermark = incrementalSource.extractMaxWatermark(newRecords);

  // Save watermark for next run
  await incrementalSource.saveWatermark("/tmp/watermark_customers.json", maxWatermark);

  await dbSource.disconnect();

  console.log("Incremental load completed!\n");
}

// ==================== Example 8: Validation and Cleaning ====================

async function example8_validationAndCleaning() {
  console.log("\n=== Example 8: Validation and Cleaning ===\n");

  const dirtyData = [
    { id: 1, name: "  JOHN DOE  ", email: "john@example.com", age: 30 },
    { id: 2, name: "jane smith", email: "JANE@TEST.COM", age: null },
    { id: 3, name: "Bob", email: "invalid-email", age: "25" },
    { id: 4, name: null, email: "alice@example.com", age: 28 }
  ];

  console.log("Original Data:");
  console.table(dirtyData);

  // Validation rules
  const validator = new BatchValidator([
    CommonValidationRules.notNull("name"),
    CommonValidationRules.notNull("email"),
    CommonValidationRules.email("email"),
    CommonValidationRules.positiveNumber("age")
  ]);

  const result = validator.validateBatch(dirtyData);

  console.log("\nValidation Results:");
  console.log(`Valid: ${result.valid.length}`);
  console.log(`Invalid: ${result.invalid.length}`);

  if (result.invalid.length > 0) {
    console.log("\nInvalid Records:");
    for (const [index, errors] of result.errors) {
      console.log(`Record ${index}:`);
      errors.forEach(error => console.log(`  - ${error.message}`));
    }
  }

  console.log("\nData Profile:");
  const profile = result.profile;
  console.log(`Total Records: ${profile.totalRecords}`);
  console.log(`Valid: ${profile.validRecords} (${((profile.validRecords / profile.totalRecords) * 100).toFixed(2)}%)`);
  console.log(`Invalid: ${profile.invalidRecords} (${((profile.invalidRecords / profile.totalRecords) * 100).toFixed(2)}%)\n`);
}

// ==================== Example 9: REST API Source with Pagination ====================

async function example9_apiWithPagination() {
  console.log("\n=== Example 9: REST API with Pagination ===\n");

  const apiSource = new RESTAPISource(
    "https://api.example.com",
    {
      "Authorization": "Bearer YOUR_TOKEN",
      "Accept": "application/json"
    },
    {
      type: "offset",
      pageSize: 100,
      maxPages: 5
    }
  );

  console.log("Fetching paginated data from API...");

  let totalRecords = 0;

  for await (const page of apiSource.fetchPaginated("/users")) {
    totalRecords += page.length;
    console.log(`Fetched page with ${page.length} records (total: ${totalRecords})`);
  }

  const metrics = apiSource.getMetrics();
  console.log("\nAPI Metrics:");
  console.log(`Total Records: ${metrics.recordsRead}`);
  console.log(`Bytes Read: ${(metrics.bytesRead / 1024).toFixed(2)} KB`);
  console.log(`Read Time: ${metrics.readTime}ms`);
  console.log(`Errors: ${metrics.errors}\n`);
}

// ==================== Example 10: Performance Monitoring ====================

async function example10_performanceMonitoring() {
  console.log("\n=== Example 10: Performance Monitoring ===\n");

  const perfMonitor = new PerformanceMonitor();

  // Simulate multiple operations
  for (let i = 0; i < 10; i++) {
    perfMonitor.start("extraction");
    await new Promise(resolve => setTimeout(resolve, Math.random() * 100));
    perfMonitor.end("extraction");

    perfMonitor.start("transformation");
    await new Promise(resolve => setTimeout(resolve, Math.random() * 50));
    perfMonitor.end("transformation");

    perfMonitor.start("loading");
    await new Promise(resolve => setTimeout(resolve, Math.random() * 150));
    perfMonitor.end("loading");
  }

  perfMonitor.printStats();
}

// ==================== Run All Examples ====================

async function runAllExamples() {
  console.log("╔════════════════════════════════════════════════════════╗");
  console.log("║     ETL PIPELINE - PRODUCTION FEATURES SHOWCASE       ║");
  console.log("╚════════════════════════════════════════════════════════╝");

  try {
    await example1_basicPipeline();
    await example2_dataQuality();
    await example3_complexTransformations();
    await example4_scheduling();
    await example5_lineageTracking();
    await example6_parallelProcessing();
    await example7_incrementalLoading();
    await example8_validationAndCleaning();
    await example9_apiWithPagination();
    await example10_performanceMonitoring();

    console.log("╔════════════════════════════════════════════════════════╗");
    console.log("║            ALL EXAMPLES COMPLETED!                     ║");
    console.log("╚════════════════════════════════════════════════════════╝\n");
  } catch (error) {
    console.error("Error running examples:", error);
  }
}

// Run if executed directly
if (import.meta.main) {
  runAllExamples();
}
