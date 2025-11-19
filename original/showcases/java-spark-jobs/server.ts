/**
 * Java Spark Jobs + TypeScript Orchestration Server
 */

import { createServer } from "http";
import { SparkOrchestrator } from "./SparkOrchestrator.java";

const spark = new SparkOrchestrator();

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
      res.end(JSON.stringify({ status: "healthy", service: "Java Spark + TypeScript" }));
      return;
    }

    // List jobs
    if (path === "/api/jobs" && req.method === "GET") {
      const jobs = spark.listJobs();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ jobs }));
      return;
    }

    // Submit job
    if (path === "/api/jobs/submit" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        const data = JSON.parse(body);
        const result = spark.submitJob(data.jobName, data.config || {});
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      });
      return;
    }

    // Get job status
    if (path.startsWith("/api/jobs/") && req.method === "GET") {
      const executionId = path.split("/")[3];
      const status = spark.getJobStatus(executionId);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(status));
      return;
    }

    // Get stats
    if (path === "/api/stats" && req.method === "GET") {
      const stats = spark.getStats();
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
  console.log("⚡ Java Spark + TypeScript Orchestration");
  console.log(`🚀 http://localhost:${PORT}`);
});
