/**
 * Python ML Pipeline Server
 *
 * Full ML pipeline: train models in Python, serve via TypeScript API.
 * Demonstrates complete ML workflow with polyglot integration.
 *
 * Run with: elide serve server.ts
 */

import { createServer } from "http";

// 🔥 Import Python ML pipeline directly!
import { pipeline } from "./pipeline.py";

// =============================================================================
// Type Definitions
// =============================================================================

interface TrainingRequest {
  modelName: string;
  trainingData: Array<{
    text: string;
    numeric_value: number;
  }>;
}

interface PredictionRequest {
  modelName: string;
  data: {
    text: string;
    numeric_value: number;
  };
}

interface BatchPredictionRequest {
  modelName: string;
  batch: Array<{
    text: string;
    numeric_value: number;
  }>;
}

// =============================================================================
// HTTP Server
// =============================================================================

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
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
      res.end(
        JSON.stringify({
          status: "healthy",
          service: "Python ML Pipeline",
          integration: "python-typescript",
          capabilities: ["training", "inference", "batch-prediction"],
        })
      );
      return;
    }

    // List all models
    if (path === "/api/models" && req.method === "GET") {
      const models = pipeline.list_models();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ models, count: models.length }));
      return;
    }

    // Create new model
    if (path === "/api/models" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          const result = pipeline.create_model(data.modelName);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Failed to create model",
            })
          );
        }
      });
      return;
    }

    // Get model info
    if (path.startsWith("/api/models/") && req.method === "GET") {
      const modelName = path.split("/")[3];
      const info = pipeline.get_model_info(modelName);

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(info));
      return;
    }

    // Train model
    if (path === "/api/train" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as TrainingRequest;

          if (!data.modelName || !data.trainingData) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing modelName or trainingData" }));
            return;
          }

          // 🔥 Call Python training function directly!
          const result = pipeline.train_model(data.modelName, data.trainingData);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Training failed",
            })
          );
        }
      });
      return;
    }

    // Make prediction
    if (path === "/api/predict" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as PredictionRequest;

          if (!data.modelName || !data.data) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing modelName or data" }));
            return;
          }

          // 🔥 Full Python ML pipeline: preprocess + predict!
          const result = pipeline.predict(data.modelName, data.data);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Prediction failed",
            })
          );
        }
      });
      return;
    }

    // Batch prediction
    if (path === "/api/predict/batch" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as BatchPredictionRequest;

          if (!data.modelName || !data.batch) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing modelName or batch" }));
            return;
          }

          // 🔥 Batch processing in Python with high throughput!
          const result = pipeline.batch_predict(data.modelName, data.batch);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Batch prediction failed",
            })
          );
        }
      });
      return;
    }

    // Not found
    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Internal server error",
      })
    );
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log("🤖 Python ML Pipeline Server");
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log("");
  console.log("📍 Endpoints:");
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/models`);
  console.log(`   POST http://localhost:${PORT}/api/models`);
  console.log(`   GET  http://localhost:${PORT}/api/models/:name`);
  console.log(`   POST http://localhost:${PORT}/api/train`);
  console.log(`   POST http://localhost:${PORT}/api/predict`);
  console.log(`   POST http://localhost:${PORT}/api/predict/batch`);
  console.log("");
  console.log("🔥 Features:");
  console.log("   ✅ Train ML models in Python");
  console.log("   ✅ Serve via TypeScript API");
  console.log("   ✅ Batch prediction support");
  console.log("   ✅ <1ms cross-language calls");
});
