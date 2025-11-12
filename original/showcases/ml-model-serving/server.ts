/**
 * ML Model Serving - TypeScript API Server
 *
 * Demonstrates REAL polyglot integration between TypeScript and Python TensorFlow.
 * This is NOT an HTTP call to Python - it's a DIRECT import and function call
 * in the same process with <1ms overhead.
 *
 * Run with: elide run server.ts
 */

import { createServer } from "http";

// 🔥 REAL POLYGLOT: Direct Python import!
// This imports Python TensorFlow code directly into TypeScript
// Zero serialization, zero HTTP calls, same process, <1ms overhead
import {
  default_model,
  registry,
  create_model,
  quick_predict
} from "./model.py";

// =============================================================================
// Type Definitions
// =============================================================================

interface PredictionRequest {
  features: number[];
  model_id?: string;
}

interface BatchPredictionRequest {
  batch: number[][];
  model_id?: string;
}

interface PredictionResponse {
  class: string;
  confidence: number;
  probabilities: Record<string, number>;
  model: string;
  version: string;
  inference_time_ms: number;
}

interface ModelInfo {
  name: string;
  version: string;
  input_shape: number[];
  output_classes: string[];
  framework: string;
  warm: boolean;
}

// =============================================================================
// Metrics Tracking
// =============================================================================

class PerformanceMetrics {
  private predictions: number = 0;
  private batchPredictions: number = 0;
  private totalInferenceTime: number = 0;
  private polyglotCalls: number = 0;

  recordPrediction(inferenceTimeMs: number): void {
    this.predictions++;
    this.totalInferenceTime += inferenceTimeMs;
    this.polyglotCalls++;
  }

  recordBatchPrediction(batchSize: number, inferenceTimeMs: number): void {
    this.batchPredictions++;
    this.predictions += batchSize;
    this.totalInferenceTime += inferenceTimeMs;
    this.polyglotCalls++;
  }

  getMetrics() {
    return {
      total_predictions: this.predictions,
      batch_predictions: this.batchPredictions,
      polyglot_calls: this.polyglotCalls,
      avg_inference_ms: this.predictions > 0
        ? (this.totalInferenceTime / this.predictions).toFixed(2)
        : 0,
      total_inference_ms: this.totalInferenceTime.toFixed(2)
    };
  }
}

const metrics = new PerformanceMetrics();

// =============================================================================
// API Handlers
// =============================================================================

async function handlePredict(
  requestData: PredictionRequest
): Promise<PredictionResponse> {
  const start = Date.now();

  // 🚀 REAL POLYGLOT CALL: TypeScript → Python TensorFlow
  // This calls the Python model.predict() method directly!
  const result = default_model.predict(requestData.features);

  const inferenceTime = Date.now() - start;
  metrics.recordPrediction(inferenceTime);

  return {
    ...result,
    inference_time_ms: inferenceTime
  };
}

async function handleBatchPredict(
  requestData: BatchPredictionRequest
): Promise<{ predictions: PredictionResponse[]; batch_size: number }> {
  const start = Date.now();

  // 🚀 REAL POLYGLOT CALL: Batch prediction via Python
  const results = default_model.predict_batch(requestData.batch);

  const inferenceTime = Date.now() - start;
  metrics.recordBatchPrediction(requestData.batch.length, inferenceTime);

  return {
    predictions: results.map(r => ({
      ...r,
      inference_time_ms: inferenceTime / requestData.batch.length
    })),
    batch_size: requestData.batch.length
  };
}

async function handleModelInfo(): Promise<ModelInfo> {
  // 🚀 REAL POLYGLOT CALL: Get Python model metadata
  return default_model.get_model_info();
}

async function handleListModels() {
  // 🚀 REAL POLYGLOT CALL: Access Python registry
  return registry.list_models();
}

async function handleWarmup() {
  // 🚀 REAL POLYGLOT CALL: Warm up Python model
  return default_model.warmup();
}

// =============================================================================
// HTTP Server
// =============================================================================

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  try {
    // Health check
    if (path === "/health" || path === "/") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "healthy",
        service: "ML Model Serving (TensorFlow + TypeScript)",
        runtime: "Elide Polyglot",
        polyglot: {
          languages: ["typescript", "python"],
          framework: "tensorflow",
          overhead_ms: "<1",
          direct_imports: true
        }
      }));
      return;
    }

    // Predict endpoint
    if (path === "/api/predict" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as PredictionRequest;

          if (!data.features || !Array.isArray(data.features)) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing or invalid features array" }));
            return;
          }

          const result = await handlePredict(data);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : "Prediction failed"
          }));
        }
      });
      return;
    }

    // Batch predict endpoint
    if (path === "/api/predict/batch" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as BatchPredictionRequest;

          if (!data.batch || !Array.isArray(data.batch)) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing or invalid batch array" }));
            return;
          }

          const result = await handleBatchPredict(data);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({
            error: error instanceof Error ? error.message : "Batch prediction failed"
          }));
        }
      });
      return;
    }

    // Model info endpoint
    if (path === "/api/model/info" && req.method === "GET") {
      const info = await handleModelInfo();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(info));
      return;
    }

    // List models endpoint
    if (path === "/api/models" && req.method === "GET") {
      const models = await handleListModels();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ models }));
      return;
    }

    // Warmup endpoint
    if (path === "/api/warmup" && req.method === "POST") {
      const result = await handleWarmup();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    // Metrics endpoint
    if (path === "/api/metrics" && req.method === "GET") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(metrics.getMetrics()));
      return;
    }

    // Not found
    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));

  } catch (error) {
    console.error("Server error:", error);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error"
    }));
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log("🤖 ML Model Serving (TensorFlow + TypeScript Polyglot)");
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("");
  console.log("📍 Endpoints:");
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   POST http://localhost:${PORT}/api/predict`);
  console.log(`   POST http://localhost:${PORT}/api/predict/batch`);
  console.log(`   GET  http://localhost:${PORT}/api/model/info`);
  console.log(`   GET  http://localhost:${PORT}/api/models`);
  console.log(`   POST http://localhost:${PORT}/api/warmup`);
  console.log(`   GET  http://localhost:${PORT}/api/metrics`);
  console.log("");
  console.log("🌟 Polyglot Features:");
  console.log("   ✅ Direct Python TensorFlow imports in TypeScript");
  console.log("   ✅ <1ms cross-language call overhead");
  console.log("   ✅ Zero serialization (shared memory)");
  console.log("   ✅ Single process execution");
  console.log("");
  console.log("🧪 Test it:");
  console.log(`   curl -X POST http://localhost:${PORT}/api/predict \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"features": [0.1, 0.2, 0.3]}'`);
});
