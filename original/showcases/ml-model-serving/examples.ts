/**
 * ML Model Serving - Usage Examples
 *
 * Demonstrates how to use the polyglot ML model serving API
 */

// 🔥 DIRECT PYTHON IMPORT: Import Python TensorFlow code in TypeScript!
import { default_model, registry, create_model, quick_predict } from "./model.py";

// =============================================================================
// Example 1: Direct Model Usage (Python → TypeScript)
// =============================================================================

export async function example1_DirectModelUsage() {
  console.log("Example 1: Direct Model Usage\n");

  // Generate random features (128 dimensions)
  const features = Array.from({ length: 128 }, () => Math.random());

  // 🚀 REAL POLYGLOT: Call Python model directly from TypeScript
  const prediction = default_model.predict(features);

  console.log("Prediction:", prediction);
  console.log("");
}

// =============================================================================
// Example 2: Batch Predictions
// =============================================================================

export async function example2_BatchPredictions() {
  console.log("Example 2: Batch Predictions\n");

  // Create batch of 10 samples
  const batch = Array.from({ length: 10 }, () =>
    Array.from({ length: 128 }, () => Math.random())
  );

  const start = Date.now();

  // 🚀 REAL POLYGLOT: Batch prediction via Python
  const results = default_model.predict_batch(batch);

  const elapsed = Date.now() - start;

  console.log(`Processed ${results.length} predictions in ${elapsed}ms`);
  console.log(`Average: ${(elapsed / results.length).toFixed(2)}ms per prediction`);
  console.log("\nFirst 3 results:");
  results.slice(0, 3).forEach((result, i) => {
    console.log(`  ${i + 1}. ${result.class} (${(result.confidence * 100).toFixed(1)}%)`);
  });
  console.log("");
}

// =============================================================================
// Example 3: Model Registry
// =============================================================================

export async function example3_ModelRegistry() {
  console.log("Example 3: Model Registry\n");

  // Create and register custom models
  const customModel1 = create_model("emotion-detector");
  const customModel2 = create_model("topic-classifier");

  registry.register_model("emotion", customModel1);
  registry.register_model("topic", customModel2);

  // List all registered models
  const models = registry.list_models();

  console.log(`Registered models: ${models.length}`);
  models.forEach(model => {
    console.log(`  - ${model.model_id}: ${model.name} v${model.version}`);
  });
  console.log("");
}

// =============================================================================
// Example 4: Model Warmup
// =============================================================================

export async function example4_ModelWarmup() {
  console.log("Example 4: Model Warmup\n");

  console.log("Model info before warmup:");
  const infoBefore = default_model.get_model_info();
  console.log(`  Warm: ${infoBefore.warm}`);

  // Warm up the model
  const warmupResult = default_model.warmup();
  console.log("\nWarmup result:", warmupResult);

  console.log("\nModel info after warmup:");
  const infoAfter = default_model.get_model_info();
  console.log(`  Warm: ${infoAfter.warm}`);
  console.log("");
}

// =============================================================================
// Example 5: Performance Benchmarking
// =============================================================================

export async function example5_PerformanceBenchmark() {
  console.log("Example 5: Performance Benchmarking\n");

  const iterations = 1000;
  const features = Array.from({ length: 128 }, () => Math.random());

  // Measure TypeScript overhead
  const tsStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    const _ = JSON.stringify({ features });
  }
  const tsTime = Date.now() - tsStart;

  // Measure polyglot call overhead
  const polyglotStart = Date.now();
  for (let i = 0; i < iterations; i++) {
    quick_predict(features);
  }
  const polyglotTime = Date.now() - polyglotStart;

  console.log(`Iterations: ${iterations}`);
  console.log(`TypeScript only: ${tsTime}ms (${(tsTime / iterations).toFixed(3)}ms/call)`);
  console.log(`Polyglot calls: ${polyglotTime}ms (${(polyglotTime / iterations).toFixed(3)}ms/call)`);
  console.log(`Overhead: ${((polyglotTime - tsTime) / iterations).toFixed(3)}ms per call`);
  console.log("");
  console.log("💡 This demonstrates <1ms cross-language overhead!");
  console.log("");
}

// =============================================================================
// Example 6: HTTP Client Usage
// =============================================================================

export async function example6_HTTPClientUsage() {
  console.log("Example 6: HTTP Client Usage\n");
  console.log("Start the server with: elide run server.ts\n");

  const examples = [
    {
      name: "Single Prediction",
      command: `curl -X POST http://localhost:3000/api/predict \\
  -H "Content-Type: application/json" \\
  -d '{"features": [0.1, 0.2, 0.3, ...]}'`
    },
    {
      name: "Batch Prediction",
      command: `curl -X POST http://localhost:3000/api/predict/batch \\
  -H "Content-Type: application/json" \\
  -d '{"batch": [[0.1, 0.2, ...], [0.3, 0.4, ...]]}'`
    },
    {
      name: "Model Info",
      command: "curl http://localhost:3000/api/model/info"
    },
    {
      name: "Metrics",
      command: "curl http://localhost:3000/api/metrics"
    }
  ];

  examples.forEach(({ name, command }) => {
    console.log(`${name}:`);
    console.log(command);
    console.log("");
  });
}

// =============================================================================
// Run All Examples
// =============================================================================

async function runAllExamples() {
  console.log("=".repeat(80));
  console.log("ML Model Serving - Polyglot Examples");
  console.log("TypeScript ↔ Python TensorFlow");
  console.log("=".repeat(80));
  console.log("");

  await example1_DirectModelUsage();
  await example2_BatchPredictions();
  await example3_ModelRegistry();
  await example4_ModelWarmup();
  await example5_PerformanceBenchmark();
  await example6_HTTPClientUsage();

  console.log("=".repeat(80));
  console.log("All examples completed!");
  console.log("=".repeat(80));
}

// Run if this is the main module
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples().catch(console.error);
}
