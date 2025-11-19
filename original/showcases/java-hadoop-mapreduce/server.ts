/**
 * Java Hadoop MapReduce + TypeScript UI Server
 */

import { createServer } from "http";
import { HadoopMapReduce } from "./HadoopMapReduce.java";

const hadoop = new HadoopMapReduce();

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
      res.end(JSON.stringify({ status: "healthy", service: "Java Hadoop + TypeScript" }));
      return;
    }

    if (path === "/api/jobs" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        const data = JSON.parse(body);
        const result = hadoop.submitJob(data.jobName, data.inputPath, data.outputPath);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      });
      return;
    }

    if (path === "/api/jobs" && req.method === "GET") {
      const jobs = hadoop.listJobs();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ jobs }));
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
  console.log("🐘 Java Hadoop MapReduce + TypeScript");
  console.log(`🚀 http://localhost:${PORT}`);
});
