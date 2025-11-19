/**
 * Python Celery Tasks + TypeScript API Server
 *
 * Asynchronous task processing with Python Celery,
 * exposed via modern TypeScript REST API.
 *
 * Run with: elide serve server.ts
 */

import { createServer } from "http";

// 🔥 Import Python Celery worker directly!
import { worker } from "./celery_tasks.py";

// =============================================================================
// Type Definitions
// =============================================================================

interface TaskSubmitRequest {
  taskName: string;
  args?: any[];
  kwargs?: Record<string, any>;
}

interface TaskResponse {
  taskId: string;
  status: string;
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
          service: "Python Celery + TypeScript API",
          integration: "python-typescript",
          worker: "active",
        })
      );
      return;
    }

    // Submit task
    if (path === "/api/tasks" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as TaskSubmitRequest;

          if (!data.taskName) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing taskName" }));
            return;
          }

          // 🔥 Submit task to Python Celery worker!
          const taskId = worker.apply_async(
            data.taskName,
            data.args || [],
            data.kwargs || {}
          );

          res.writeHead(202, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              taskId,
              status: "submitted",
              message: "Task queued for processing",
            })
          );
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Task submission failed",
            })
          );
        }
      });
      return;
    }

    // Get task status
    if (path.startsWith("/api/tasks/") && req.method === "GET") {
      const taskId = path.split("/")[3];

      if (!taskId) {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Missing taskId" }));
        return;
      }

      // 🔥 Get task from Python worker!
      const task = worker.get_task(taskId);

      if (!task) {
        res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Task not found" }));
        return;
      }

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ task }));
      return;
    }

    // List all tasks
    if (path === "/api/tasks" && req.method === "GET") {
      const status = url.searchParams.get("status");
      const tasks = worker.get_all_tasks(status);

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ tasks, count: tasks.length }));
      return;
    }

    // Retry task
    if (path.startsWith("/api/tasks/") && path.endsWith("/retry") && req.method === "POST") {
      const parts = path.split("/");
      const taskId = parts[3];

      const success = worker.retry_task(taskId);

      if (!success) {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Cannot retry task" }));
        return;
      }

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Task requeued" }));
      return;
    }

    // Cancel task
    if (path.startsWith("/api/tasks/") && path.endsWith("/cancel") && req.method === "POST") {
      const parts = path.split("/");
      const taskId = parts[3];

      const success = worker.cancel_task(taskId);

      if (!success) {
        res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Cannot cancel task" }));
        return;
      }

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Task cancelled" }));
      return;
    }

    // Worker stats
    if (path === "/api/stats" && req.method === "GET") {
      const stats = worker.get_stats();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(stats));
      return;
    }

    // Quick task endpoints (convenience)
    if (path === "/api/tasks/email" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body);
          const taskId = worker.apply_async("send_email", [], data);

          res.writeHead(202, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ taskId, status: "submitted" }));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Failed",
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
  console.log("⚡ Python Celery + TypeScript API Server");
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log("");
  console.log("📍 Endpoints:");
  console.log(`   POST http://localhost:${PORT}/api/tasks - Submit task`);
  console.log(`   GET  http://localhost:${PORT}/api/tasks - List tasks`);
  console.log(`   GET  http://localhost:${PORT}/api/tasks/:id - Get task status`);
  console.log(`   POST http://localhost:${PORT}/api/tasks/:id/retry - Retry task`);
  console.log(`   POST http://localhost:${PORT}/api/tasks/:id/cancel - Cancel task`);
  console.log(`   GET  http://localhost:${PORT}/api/stats - Worker stats`);
  console.log("");
  console.log("🔥 Features:");
  console.log("   ✅ Async task processing with Python");
  console.log("   ✅ TypeScript REST API");
  console.log("   ✅ Task retry & cancellation");
  console.log("   ✅ <1ms cross-language calls");
});
