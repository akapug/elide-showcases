/**
 * Python Airflow DAGs + TypeScript Monitoring Server
 */

import { createServer } from "http";
import { monitor } from "./airflow_dags.py";

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
      res.end(JSON.stringify({ status: "healthy", service: "Python Airflow + TypeScript" }));
      return;
    }

    // List DAGs
    if (path === "/api/dags" && req.method === "GET") {
      const dags = monitor.list_dags();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ dags }));
      return;
    }

    // Get DAG info
    if (path.startsWith("/api/dags/") && req.method === "GET" && !path.includes("/runs")) {
      const dagId = path.split("/")[3];
      const info = monitor.get_dag_info(dagId);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(info));
      return;
    }

    // Trigger DAG
    if (path.startsWith("/api/dags/") && path.endsWith("/trigger") && req.method === "POST") {
      const dagId = path.split("/")[3];
      const run = monitor.trigger_dag(dagId);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(run));
      return;
    }

    // Get DAG runs
    if (path.includes("/runs") && req.method === "GET") {
      const dagId = path.split("/")[3];
      const runs = monitor.get_dag_runs(dagId);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ runs }));
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
  console.log("🌊 Python Airflow DAGs + TypeScript");
  console.log(`🚀 http://localhost:${PORT}`);
});
