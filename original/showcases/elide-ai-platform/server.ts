/**
 * Elide AI/ML Platform - Main API Server
 *
 * Complete AI/ML platform showcasing Elide's polyglot capabilities:
 * - TypeScript for API orchestration and business logic
 * - Python for ML training (PyTorch, TensorFlow, scikit-learn)
 * - Direct imports with <1ms overhead (NO HTTP calls!)
 * - Production-ready ML infrastructure
 *
 * Run with: elide run server.ts
 */

import { createServer } from "http";

// 🔥 REAL POLYGLOT: Direct Python ML imports!
// These are NOT HTTP calls - they're direct function calls in the same process
import { modelRegistry } from "./model-registry";
import { trainingOrchestrator } from "./training-orchestrator";
import { inferenceEngine } from "./inference-engine";
import { featureStore } from "./feature-store";
import { vectorDB } from "./vector-db";
import { mlops } from "./mlops";

// =============================================================================
// Type Definitions
// =============================================================================

interface ModelCreateRequest {
  name: string;
  framework: "pytorch" | "tensorflow" | "sklearn";
  type: "classification" | "regression" | "nlp" | "vision";
  config?: Record<string, any>;
}

interface TrainingRequest {
  modelName: string;
  dataset: string;
  epochs?: number;
  batchSize?: number;
  learningRate?: number;
  distributed?: boolean;
}

interface InferenceRequest {
  modelName: string;
  input: any;
  version?: string;
}

interface BatchInferenceRequest {
  modelName: string;
  inputs: any[];
  version?: string;
}

interface FeatureRequest {
  featureGroup: string;
  entityId: string;
  timestamp?: number;
}

interface VectorSearchRequest {
  embedding?: number[];
  text?: string;
  topK?: number;
  filter?: Record<string, any>;
}

// =============================================================================
// Metrics and Monitoring
// =============================================================================

class PlatformMetrics {
  private requests: Map<string, number> = new Map();
  private latencies: Map<string, number[]> = new Map();
  private errors: Map<string, number> = new Map();
  private startTime: number = Date.now();

  recordRequest(endpoint: string, latencyMs: number, error?: boolean): void {
    this.requests.set(endpoint, (this.requests.get(endpoint) || 0) + 1);

    if (!this.latencies.has(endpoint)) {
      this.latencies.set(endpoint, []);
    }
    this.latencies.get(endpoint)!.push(latencyMs);

    if (error) {
      this.errors.set(endpoint, (this.errors.get(endpoint) || 0) + 1);
    }
  }

  getMetrics() {
    const uptimeSeconds = Math.floor((Date.now() - this.startTime) / 1000);
    const endpoints: Record<string, any> = {};

    for (const [endpoint, count] of this.requests.entries()) {
      const latencies = this.latencies.get(endpoint) || [];
      const avgLatency = latencies.length > 0
        ? latencies.reduce((a, b) => a + b, 0) / latencies.length
        : 0;
      const p95Latency = latencies.length > 0
        ? latencies.sort((a, b) => a - b)[Math.floor(latencies.length * 0.95)]
        : 0;

      endpoints[endpoint] = {
        requests: count,
        errors: this.errors.get(endpoint) || 0,
        avg_latency_ms: avgLatency.toFixed(2),
        p95_latency_ms: p95Latency.toFixed(2),
        error_rate: ((this.errors.get(endpoint) || 0) / count * 100).toFixed(2) + "%"
      };
    }

    return {
      uptime_seconds: uptimeSeconds,
      total_requests: Array.from(this.requests.values()).reduce((a, b) => a + b, 0),
      total_errors: Array.from(this.errors.values()).reduce((a, b) => a + b, 0),
      endpoints
    };
  }
}

const metrics = new PlatformMetrics();

// =============================================================================
// API Request Handlers
// =============================================================================

// Model Registry Handlers
async function handleListModels(): Promise<any> {
  return modelRegistry.list_models();
}

async function handleGetModel(modelName: string): Promise<any> {
  return modelRegistry.get_model(modelName);
}

async function handleCreateModel(data: ModelCreateRequest): Promise<any> {
  return modelRegistry.create_model(
    data.name,
    data.framework,
    data.type,
    data.config || {}
  );
}

async function handleDeployModel(modelName: string, version: string, strategy: string): Promise<any> {
  return modelRegistry.deploy_model(modelName, version, strategy);
}

// Training Handlers
async function handleStartTraining(data: TrainingRequest): Promise<any> {
  return trainingOrchestrator.start_training(
    data.modelName,
    data.dataset,
    {
      epochs: data.epochs || 10,
      batch_size: data.batchSize || 32,
      learning_rate: data.learningRate || 0.001,
      distributed: data.distributed || false
    }
  );
}

async function handleGetTrainingJob(jobId: string): Promise<any> {
  return trainingOrchestrator.get_job_status(jobId);
}

async function handleListTrainingJobs(): Promise<any> {
  return trainingOrchestrator.list_jobs();
}

async function handleStopTraining(jobId: string): Promise<any> {
  return trainingOrchestrator.stop_job(jobId);
}

// Inference Handlers
async function handleInference(data: InferenceRequest): Promise<any> {
  const start = Date.now();
  const result = await inferenceEngine.predict(
    data.modelName,
    data.input,
    data.version
  );
  result.latency_ms = Date.now() - start;
  return result;
}

async function handleBatchInference(data: BatchInferenceRequest): Promise<any> {
  const start = Date.now();
  const result = await inferenceEngine.batch_predict(
    data.modelName,
    data.inputs,
    data.version
  );
  result.total_latency_ms = Date.now() - start;
  result.avg_latency_ms = (Date.now() - start) / data.inputs.length;
  return result;
}

async function handleStreamInference(modelName: string, version?: string): Promise<any> {
  return inferenceEngine.start_stream(modelName, version);
}

// Feature Store Handlers
async function handleGetFeatures(data: FeatureRequest): Promise<any> {
  return featureStore.get_features(
    data.featureGroup,
    data.entityId,
    data.timestamp
  );
}

async function handleComputeFeatures(featureGroup: string, entityId: string, rawData: any): Promise<any> {
  return featureStore.compute_features(featureGroup, entityId, rawData);
}

async function handleListFeatureGroups(): Promise<any> {
  return featureStore.list_feature_groups();
}

// Vector DB Handlers
async function handleVectorSearch(data: VectorSearchRequest): Promise<any> {
  if (data.text) {
    return vectorDB.search_by_text(data.text, data.topK || 10, data.filter);
  } else if (data.embedding) {
    return vectorDB.search_by_embedding(data.embedding, data.topK || 10, data.filter);
  } else {
    throw new Error("Either text or embedding must be provided");
  }
}

async function handleStoreEmbedding(id: string, embedding: number[], metadata: any): Promise<any> {
  return vectorDB.store_embedding(id, embedding, metadata);
}

async function handleGetVectorStats(): Promise<any> {
  return vectorDB.get_stats();
}

// MLOps Handlers
async function handleGetExperiments(): Promise<any> {
  return mlops.list_experiments();
}

async function handleLogMetric(experimentId: string, metric: string, value: number, step?: number): Promise<any> {
  return mlops.log_metric(experimentId, metric, value, step);
}

async function handleGetModelMetrics(modelName: string, timeRange?: string): Promise<any> {
  return mlops.get_model_metrics(modelName, timeRange || "24h");
}

async function handleDetectDrift(modelName: string, referenceData: any[], currentData: any[]): Promise<any> {
  return mlops.detect_drift(modelName, referenceData, currentData);
}

// =============================================================================
// HTTP Server
// =============================================================================

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname;
  const startTime = Date.now();

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
  };

  if (req.method === "OPTIONS") {
    res.writeHead(200, corsHeaders);
    res.end();
    return;
  }

  try {
    // =========================================================================
    // Health & Status
    // =========================================================================

    if (path === "/health" || path === "/") {
      const result = {
        status: "healthy",
        service: "Elide AI/ML Platform",
        version: "1.0.0",
        polyglot: {
          orchestration: "typescript",
          ml_runtime: "python",
          frameworks: ["pytorch", "tensorflow", "scikit-learn", "huggingface"],
          overhead: "<1ms",
          method: "direct_imports"
        },
        components: {
          model_registry: "operational",
          training_orchestrator: "operational",
          inference_engine: "operational",
          feature_store: "operational",
          vector_db: "operational",
          mlops: "operational"
        },
        capabilities: [
          "model_management",
          "distributed_training",
          "real_time_inference",
          "batch_inference",
          "feature_engineering",
          "vector_search",
          "experiment_tracking",
          "model_monitoring",
          "drift_detection"
        ]
      };

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result, null, 2));
      metrics.recordRequest("/health", Date.now() - startTime);
      return;
    }

    if (path === "/api/metrics" && req.method === "GET") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(metrics.getMetrics(), null, 2));
      return;
    }

    // =========================================================================
    // Model Registry Endpoints
    // =========================================================================

    if (path === "/api/models" && req.method === "GET") {
      const result = await handleListModels();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/models", Date.now() - startTime);
      return;
    }

    if (path === "/api/models" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as ModelCreateRequest;
          const result = await handleCreateModel(data);
          res.writeHead(201, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/models", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Failed to create model" }));
          metrics.recordRequest("/api/models", Date.now() - startTime, true);
        }
      });
      return;
    }

    if (path.match(/^\/api\/models\/[^\/]+$/) && req.method === "GET") {
      const modelName = path.split("/")[3];
      const result = await handleGetModel(modelName);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/models/:name", Date.now() - startTime);
      return;
    }

    if (path.match(/^\/api\/models\/[^\/]+\/deploy$/) && req.method === "POST") {
      const modelName = path.split("/")[3];
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          const result = await handleDeployModel(modelName, data.version, data.strategy || "rolling");
          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/models/:name/deploy", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Deployment failed" }));
          metrics.recordRequest("/api/models/:name/deploy", Date.now() - startTime, true);
        }
      });
      return;
    }

    // =========================================================================
    // Training Endpoints
    // =========================================================================

    if (path === "/api/training" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as TrainingRequest;
          const result = await handleStartTraining(data);
          res.writeHead(201, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/training", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Training failed to start" }));
          metrics.recordRequest("/api/training", Date.now() - startTime, true);
        }
      });
      return;
    }

    if (path === "/api/training/jobs" && req.method === "GET") {
      const result = await handleListTrainingJobs();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/training/jobs", Date.now() - startTime);
      return;
    }

    if (path.match(/^\/api\/training\/jobs\/[^\/]+$/) && req.method === "GET") {
      const jobId = path.split("/")[4];
      const result = await handleGetTrainingJob(jobId);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/training/jobs/:id", Date.now() - startTime);
      return;
    }

    if (path.match(/^\/api\/training\/jobs\/[^\/]+\/stop$/) && req.method === "POST") {
      const jobId = path.split("/")[4];
      const result = await handleStopTraining(jobId);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/training/jobs/:id/stop", Date.now() - startTime);
      return;
    }

    // =========================================================================
    // Inference Endpoints
    // =========================================================================

    if (path === "/api/inference/predict" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as InferenceRequest;
          const result = await handleInference(data);
          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/inference/predict", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Inference failed" }));
          metrics.recordRequest("/api/inference/predict", Date.now() - startTime, true);
        }
      });
      return;
    }

    if (path === "/api/inference/batch" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as BatchInferenceRequest;
          const result = await handleBatchInference(data);
          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/inference/batch", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Batch inference failed" }));
          metrics.recordRequest("/api/inference/batch", Date.now() - startTime, true);
        }
      });
      return;
    }

    // =========================================================================
    // Feature Store Endpoints
    // =========================================================================

    if (path === "/api/features/groups" && req.method === "GET") {
      const result = await handleListFeatureGroups();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/features/groups", Date.now() - startTime);
      return;
    }

    if (path === "/api/features" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as FeatureRequest;
          const result = await handleGetFeatures(data);
          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/features", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Feature retrieval failed" }));
          metrics.recordRequest("/api/features", Date.now() - startTime, true);
        }
      });
      return;
    }

    // =========================================================================
    // Vector DB Endpoints
    // =========================================================================

    if (path === "/api/vectors/search" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as VectorSearchRequest;
          const result = await handleVectorSearch(data);
          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/vectors/search", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Vector search failed" }));
          metrics.recordRequest("/api/vectors/search", Date.now() - startTime, true);
        }
      });
      return;
    }

    if (path === "/api/vectors/stats" && req.method === "GET") {
      const result = await handleGetVectorStats();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/vectors/stats", Date.now() - startTime);
      return;
    }

    // =========================================================================
    // MLOps Endpoints
    // =========================================================================

    if (path === "/api/experiments" && req.method === "GET") {
      const result = await handleGetExperiments();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/experiments", Date.now() - startTime);
      return;
    }

    if (path.match(/^\/api\/models\/[^\/]+\/metrics$/) && req.method === "GET") {
      const modelName = path.split("/")[3];
      const timeRange = url.searchParams.get("timeRange") || "24h";
      const result = await handleGetModelMetrics(modelName, timeRange);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      metrics.recordRequest("/api/models/:name/metrics", Date.now() - startTime);
      return;
    }

    if (path.match(/^\/api\/models\/[^\/]+\/drift$/) && req.method === "POST") {
      const modelName = path.split("/")[3];
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          const result = await handleDetectDrift(modelName, data.referenceData, data.currentData);
          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
          metrics.recordRequest("/api/models/:name/drift", Date.now() - startTime);
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: error instanceof Error ? error.message : "Drift detection failed" }));
          metrics.recordRequest("/api/models/:name/drift", Date.now() - startTime, true);
        }
      });
      return;
    }

    // Not found
    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Endpoint not found" }));

  } catch (error) {
    console.error("Server error:", error);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal server error"
    }));
    metrics.recordRequest("error", Date.now() - startTime, true);
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log("╔══════════════════════════════════════════════════════════════════════╗");
  console.log("║                   Elide AI/ML Platform v1.0.0                        ║");
  console.log("║                  Production-Ready ML Infrastructure                  ║");
  console.log("╚══════════════════════════════════════════════════════════════════════╝");
  console.log("");
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log("");
  console.log("🔥 POLYGLOT ARCHITECTURE:");
  console.log("   TypeScript   → API orchestration, business logic, routing");
  console.log("   Python       → ML training (PyTorch, TensorFlow, scikit-learn)");
  console.log("   Integration  → Direct imports, <1ms overhead, same process");
  console.log("");
  console.log("📦 PLATFORM COMPONENTS:");
  console.log("   ✅ Model Registry      - HuggingFace, versioning, A/B testing");
  console.log("   ✅ Training Orchestrator - Distributed training, hyperparameter tuning");
  console.log("   ✅ Inference Engine    - Real-time & batch inference, model caching");
  console.log("   ✅ Feature Store       - Feature engineering, online/offline serving");
  console.log("   ✅ Vector Database     - Embeddings storage, similarity search");
  console.log("   ✅ MLOps               - Experiment tracking, monitoring, drift detection");
  console.log("");
  console.log("📍 API ENDPOINTS:");
  console.log("");
  console.log("   Model Management:");
  console.log(`      GET    /api/models`);
  console.log(`      POST   /api/models`);
  console.log(`      GET    /api/models/:name`);
  console.log(`      POST   /api/models/:name/deploy`);
  console.log("");
  console.log("   Training:");
  console.log(`      POST   /api/training`);
  console.log(`      GET    /api/training/jobs`);
  console.log(`      GET    /api/training/jobs/:id`);
  console.log(`      POST   /api/training/jobs/:id/stop`);
  console.log("");
  console.log("   Inference:");
  console.log(`      POST   /api/inference/predict`);
  console.log(`      POST   /api/inference/batch`);
  console.log("");
  console.log("   Features:");
  console.log(`      GET    /api/features/groups`);
  console.log(`      POST   /api/features`);
  console.log("");
  console.log("   Vector Search:");
  console.log(`      POST   /api/vectors/search`);
  console.log(`      GET    /api/vectors/stats`);
  console.log("");
  console.log("   MLOps:");
  console.log(`      GET    /api/experiments`);
  console.log(`      GET    /api/models/:name/metrics`);
  console.log(`      POST   /api/models/:name/drift`);
  console.log("");
  console.log("🧪 QUICK START:");
  console.log(`   # Create a model`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/models \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"name": "sentiment-model", "framework": "pytorch", "type": "nlp"}'`);
  console.log("");
  console.log(`   # Start training`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/training \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"modelName": "sentiment-model", "dataset": "imdb", "epochs": 5}'`);
  console.log("");
  console.log(`   # Run inference`);
  console.log(`   curl -X POST http://localhost:${PORT}/api/inference/predict \\`);
  console.log(`     -H "Content-Type: application/json" \\`);
  console.log(`     -d '{"modelName": "sentiment-model", "input": "This movie is great!"}'`);
  console.log("");
  console.log("═══════════════════════════════════════════════════════════════════════");
});
