/**
 * Data Science Pipeline - Usage Examples
 */

import { processor, timeseries, quick_aggregate, quick_stats } from "./analytics.py";

export async function runExamples() {
  console.log("Data Science Pipeline - Polyglot Examples\n");

  // Example 1: Data aggregation
  const salesData = [
    { region: "North", product: "A", revenue: 1000 },
    { region: "North", product: "B", revenue: 1500 },
    { region: "South", product: "A", revenue: 2000 },
    { region: "South", product: "B", revenue: 2500 },
  ];

  const aggregated = processor.aggregate_data(salesData, "region", "revenue", "sum");
  console.log("Aggregation Result:", aggregated);

  // Example 2: Statistics
  const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const stats = processor.compute_statistics(values);
  console.log("\nStatistics:", stats);

  // Example 3: Time series
  const timestamps = Array.from({ length: 24 }, (_, i) =>
    new Date(Date.now() + i * 3600000).toISOString()
  );
  const tsValues = Array.from({ length: 24 }, () => Math.random() * 100);
  const resampled = timeseries.resample_data(timestamps, tsValues, "1d");
  console.log("\nResampled Data:", resampled);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  runExamples().catch(console.error);
}
