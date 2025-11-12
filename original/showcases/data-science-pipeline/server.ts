/**
 * Data Science Pipeline - TypeScript Orchestration Server
 *
 * Demonstrates REAL polyglot integration between TypeScript and Python Pandas.
 * Direct imports with <1ms overhead - no HTTP, no serialization!
 *
 * Run with: elide run server.ts
 */

import { createServer } from "http";

// 🔥 REAL POLYGLOT: Direct Python Pandas import!
import { processor, timeseries, quick_aggregate, quick_stats } from "./analytics.py";

// =============================================================================
// HTTP Server with Pandas Integration
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
    if (path === "/health" || path === "/") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "healthy",
        service: "Data Science Pipeline (Pandas + TypeScript)",
        polyglot: {
          languages: ["typescript", "python"],
          framework: "pandas",
          overhead_ms: "<1"
        }
      }));
      return;
    }

    if (path === "/api/aggregate" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        const { data, group_by, agg_column, agg_function } = JSON.parse(body);
        const result = processor.aggregate_data(data, group_by, agg_column, agg_function);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      });
      return;
    }

    if (path === "/api/filter" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        const { data, column, operator, value } = JSON.parse(body);
        const result = processor.filter_data(data, column, operator, value);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ filtered_data: result, count: result.length }));
      });
      return;
    }

    if (path === "/api/stats" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", async () => {
        const { values } = JSON.parse(body);
        const result = processor.compute_statistics(values);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      });
      return;
    }

    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));

  } catch (error) {
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({
      error: error instanceof Error ? error.message : "Internal error"
    }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`📊 Data Science Pipeline running on http://localhost:${PORT}`);
  console.log("🚀 TypeScript ↔ Python Pandas polyglot integration active");
});
