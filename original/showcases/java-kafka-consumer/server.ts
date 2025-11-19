/**
 * Java Kafka Consumer + TypeScript Processing Server
 *
 * Demonstrates Java Kafka integration with TypeScript message processing.
 * Perfect for event-driven architectures.
 *
 * Run with: elide serve server.ts
 */

import { createServer } from "http";

// 🔥 Import Java Kafka processor directly!
import { KafkaProcessor } from "./KafkaProcessor.java";

// =============================================================================
// Type Definitions
// =============================================================================

interface ConsumeRequest {
  topic: string;
  key: string;
  value: string;
}

interface BatchConsumeRequest {
  topic: string;
  records: Array<{
    key: string;
    value: string;
  }>;
}

interface ProcessRequest {
  messageId: string;
}

interface BatchProcessRequest {
  messageIds: string[];
}

// =============================================================================
// Kafka Integration
// =============================================================================

const kafkaProcessor = new KafkaProcessor();

// =============================================================================
// HTTP Server
// =============================================================================

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
  const path = url.pathname;

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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
          service: "Java Kafka Consumer + TypeScript",
          integration: "java-typescript",
          kafka: "simulated",
        })
      );
      return;
    }

    // Consume single message
    if (path === "/api/consume" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as ConsumeRequest;

          if (!data.topic || !data.key || !data.value) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required fields" }));
            return;
          }

          // 🔥 Java Kafka consumer!
          const message = kafkaProcessor.consumeMessage(data.topic, data.key, data.value);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              message: {
                id: message.getId(),
                topic: message.getTopic(),
                key: message.getKey(),
                value: message.getValue(),
                timestamp: message.getTimestamp(),
              },
              consumed: true,
            })
          );
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Consumption failed",
            })
          );
        }
      });
      return;
    }

    // Consume batch
    if (path === "/api/consume/batch" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as BatchConsumeRequest;

          if (!data.topic || !data.records) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing topic or records" }));
            return;
          }

          // 🔥 Batch consumption in Java!
          const messages = kafkaProcessor.consumeBatch(data.topic, data.records);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              messages: messages.map((m: any) => ({
                id: m.getId(),
                topic: m.getTopic(),
                key: m.getKey(),
                value: m.getValue(),
                timestamp: m.getTimestamp(),
              })),
              count: messages.length,
            })
          );
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Batch consumption failed",
            })
          );
        }
      });
      return;
    }

    // Process message
    if (path === "/api/process" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as ProcessRequest;

          if (!data.messageId) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing messageId" }));
            return;
          }

          // 🔥 Java message processing!
          const result = kafkaProcessor.processMessage(data.messageId);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              result: {
                messageId: result.getMessageId(),
                success: result.isSuccess(),
                processedValue: result.getProcessedValue(),
                error: result.getError(),
                processedAt: result.getProcessedAt(),
              },
            })
          );
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

    // Batch process
    if (path === "/api/process/batch" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as BatchProcessRequest;

          if (!data.messageIds) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing messageIds" }));
            return;
          }

          const results = kafkaProcessor.processBatch(data.messageIds);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              results: results.map((r: any) => ({
                messageId: r.getMessageId(),
                success: r.isSuccess(),
                processedValue: r.getProcessedValue(),
                error: r.getError(),
                processedAt: r.getProcessedAt(),
              })),
              count: results.length,
            })
          );
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Batch processing failed",
            })
          );
        }
      });
      return;
    }

    // Get messages
    if (path === "/api/messages" && req.method === "GET") {
      const topic = url.searchParams.get("topic");
      const messages = kafkaProcessor.getMessages(topic);

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          messages: messages.map((m: any) => ({
            id: m.getId(),
            topic: m.getTopic(),
            key: m.getKey(),
            value: m.getValue(),
            timestamp: m.getTimestamp(),
          })),
          count: messages.length,
        })
      );
      return;
    }

    // Get stats
    if (path === "/api/stats" && req.method === "GET") {
      const stats = kafkaProcessor.getStats();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(stats));
      return;
    }

    // Clear messages
    if (path === "/api/messages" && req.method === "DELETE") {
      kafkaProcessor.clearMessages();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ success: true, message: "Messages cleared" }));
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
  console.log("📨 Java Kafka Consumer + TypeScript Server");
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log("");
  console.log("📍 Endpoints:");
  console.log(`   POST   http://localhost:${PORT}/api/consume`);
  console.log(`   POST   http://localhost:${PORT}/api/consume/batch`);
  console.log(`   POST   http://localhost:${PORT}/api/process`);
  console.log(`   POST   http://localhost:${PORT}/api/process/batch`);
  console.log(`   GET    http://localhost:${PORT}/api/messages`);
  console.log(`   GET    http://localhost:${PORT}/api/stats`);
  console.log(`   DELETE http://localhost:${PORT}/api/messages`);
  console.log("");
  console.log("🔥 Features:");
  console.log("   ✅ Java Kafka consumer integration");
  console.log("   ✅ TypeScript message processing");
  console.log("   ✅ Batch processing support");
  console.log("   ✅ <1ms cross-language calls");
});
