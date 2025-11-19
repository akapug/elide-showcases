/**
 * Ruby Redis Queue (Resque) + TypeScript Server
 */

import { createServer } from "http";
import { $redis_worker as worker } from "./redis_queue.rb";

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
      res.end(JSON.stringify({ status: "healthy", service: "Ruby Redis Queue + TypeScript" }));
      return;
    }

    // Enqueue job
    if (path === "/api/enqueue" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        const data = JSON.parse(body);
        const jobId = worker.enqueue(data.queue, data.jobClass, data.args);
        res.writeHead(202, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ jobId, queued: true }));
      });
      return;
    }

    // Process next job
    if (path === "/api/process" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        const data = JSON.parse(body);
        const job = worker.process_next(data.queue);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ job }));
      });
      return;
    }

    // Get stats
    if (path === "/api/stats" && req.method === "GET") {
      const stats = worker.stats();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(stats));
      return;
    }

    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Internal server error" }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log("💎 Ruby Redis Queue (Resque) + TypeScript");
  console.log(`🚀 http://localhost:${PORT}`);
});
