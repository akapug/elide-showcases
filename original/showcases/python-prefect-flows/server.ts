/**
 * Python Prefect Flows + TypeScript API Server
 */

import { createServer } from "http";
import { manager } from "./prefect_flows.py";

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
      res.end(JSON.stringify({ status: "healthy", service: "Python Prefect + TypeScript" }));
      return;
    }

    if (path === "/api/flows" && req.method === "GET") {
      const flows = manager.list_flows();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ flows }));
      return;
    }

    if (path === "/api/run" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        const data = JSON.parse(body);
        const result = manager.run_flow(data.flow);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      });
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
  console.log("🌊 Python Prefect Flows + TypeScript");
  console.log(`🚀 http://localhost:${PORT}`);
});
