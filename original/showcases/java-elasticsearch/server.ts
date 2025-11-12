/**
 * Java Elasticsearch Client + TypeScript API Server
 *
 * Java Elasticsearch client with TypeScript REST API.
 * Perfect for search-driven applications.
 *
 * Run with: elide serve server.ts
 */

import { createServer } from "http";

// 🔥 Import Java Elasticsearch client!
import { ElasticsearchClient } from "./ElasticsearchClient.java";

const esClient = new ElasticsearchClient();

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
    if (path === "/health" || path === "/") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          service: "Java Elasticsearch + TypeScript",
          integration: "java-typescript",
        })
      );
      return;
    }

    // Create index
    if (path.startsWith("/api/indices/") && req.method === "PUT") {
      const indexName = path.split("/")[3];
      const result = esClient.createIndex(indexName);

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    // Index document
    if (path.startsWith("/api/") && path.includes("/_doc") && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const indexName = path.split("/")[2];
          const data = JSON.parse(body);

          const result = esClient.indexDocument(
            indexName,
            data.id || Math.random().toString(36).substr(2, 9),
            data
          );

          res.writeHead(201, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Indexing failed" }));
        }
      });
      return;
    }

    // Search
    if (path.includes("/_search") && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const indexName = path.split("/")[2];
          const data = JSON.parse(body);
          const query = data.query?.match?.query || "";

          const result = esClient.search(indexName, query);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify(result));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ error: "Search failed" }));
        }
      });
      return;
    }

    // Get stats
    if (path === "/api/stats" && req.method === "GET") {
      const stats = esClient.getStats();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(stats));
      return;
    }

    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    console.error("Error:", error);
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

const PORT = 3000;

server.listen(PORT, () => {
  console.log("🔍 Java Elasticsearch + TypeScript Server");
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log("");
  console.log("📍 Endpoints:");
  console.log(`   PUT  http://localhost:${PORT}/api/indices/:name`);
  console.log(`   POST http://localhost:${PORT}/api/:index/_doc`);
  console.log(`   POST http://localhost:${PORT}/api/:index/_search`);
  console.log(`   GET  http://localhost:${PORT}/api/stats`);
  console.log("");
  console.log("🔥 Java ES client + TypeScript API!");
});
