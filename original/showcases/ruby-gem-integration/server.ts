/**
 * Ruby Gem Integration Server
 *
 * Use Ruby gems and libraries from TypeScript seamlessly.
 * Demonstrates Ruby-TypeScript polyglot integration.
 *
 * Run with: elide serve server.ts
 */

import { createServer } from "http";

// 🔥 Import Ruby module directly!
import { $gem_wrapper as gemWrapper } from "./gem_wrapper.rb";

// =============================================================================
// Type Definitions
// =============================================================================

interface TextProcessRequest {
  text: string;
}

interface HashRequest {
  data: string;
  algorithm?: "md5" | "sha1" | "sha256" | "sha512";
}

interface BatchHashRequest {
  data: string[];
  algorithm?: string;
}

interface CompareHashRequest {
  data: string;
  expectedHash: string;
  algorithm?: string;
}

interface TransformRequest {
  data: any;
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
      const health = gemWrapper.health_check();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          ...health,
          service: "Ruby Gem Integration",
          integration: "ruby-typescript",
        })
      );
      return;
    }

    // Service info
    if (path === "/api/info" && req.method === "GET") {
      const info = gemWrapper.info();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(info));
      return;
    }

    // Text processing
    if (path === "/api/text/process" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as TextProcessRequest;

          if (!data.text) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing text field" }));
            return;
          }

          // 🔥 Call Ruby text processor!
          const result = gemWrapper.text_processor.process(data.text);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Processing failed",
            })
          );
        }
      });
      return;
    }

    // Text processor stats
    if (path === "/api/text/stats" && req.method === "GET") {
      const stats = gemWrapper.text_processor.stats();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(stats));
      return;
    }

    // Cryptographic hash
    if (path === "/api/crypto/hash" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as HashRequest;

          if (!data.data) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing data field" }));
            return;
          }

          // 🔥 Call Ruby crypto service!
          const result = gemWrapper.crypto_service.hash(
            data.data,
            data.algorithm || "sha256"
          );

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Hashing failed",
            })
          );
        }
      });
      return;
    }

    // Batch hash
    if (path === "/api/crypto/hash/batch" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as BatchHashRequest;

          if (!data.data || !Array.isArray(data.data)) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Invalid data array" }));
            return;
          }

          // 🔥 Batch processing in Ruby!
          const results = gemWrapper.crypto_service.batch_hash(
            data.data,
            data.algorithm || "sha256"
          );

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ results, count: results.length }));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Batch hashing failed",
            })
          );
        }
      });
      return;
    }

    // Compare hash
    if (path === "/api/crypto/compare" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as CompareHashRequest;

          if (!data.data || !data.expectedHash) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing data or expectedHash" }));
            return;
          }

          const result = gemWrapper.crypto_service.compare_hash(
            data.data,
            data.expectedHash,
            data.algorithm || "sha256"
          );

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Comparison failed",
            })
          );
        }
      });
      return;
    }

    // Data transformation
    if (path === "/api/transform" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as TransformRequest;

          if (!data.data) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing data field" }));
            return;
          }

          // 🔥 Ruby data transformation!
          const result = gemWrapper.data_transformer.transform(data.data);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Transformation failed",
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
  console.log("💎 Ruby Gem Integration Server");
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log("");
  console.log("📍 Endpoints:");
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/info`);
  console.log(`   POST http://localhost:${PORT}/api/text/process`);
  console.log(`   GET  http://localhost:${PORT}/api/text/stats`);
  console.log(`   POST http://localhost:${PORT}/api/crypto/hash`);
  console.log(`   POST http://localhost:${PORT}/api/crypto/hash/batch`);
  console.log(`   POST http://localhost:${PORT}/api/crypto/compare`);
  console.log(`   POST http://localhost:${PORT}/api/transform`);
  console.log("");
  console.log("🔥 Features:");
  console.log("   ✅ Use Ruby gems from TypeScript");
  console.log("   ✅ Text processing with Ruby");
  console.log("   ✅ Cryptography with Ruby Digest");
  console.log("   ✅ <1ms cross-language calls");
});
