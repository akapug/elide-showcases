/**
 * Legacy Java Wrapper Server
 *
 * Wraps legacy Java enterprise code with modern TypeScript API.
 * Demonstrates seamless Java-TypeScript integration on Elide.
 *
 * Run with: elide serve server.ts
 */

import { createServer } from "http";

// 🔥 Direct Java import - No JNI, no subprocess, no serialization!
import { LegacySystem } from "./LegacySystem.java";

// =============================================================================
// Type Definitions
// =============================================================================

interface Customer {
  id: string;
  name: string;
  tier: string;
  balance: number;
  transactionCount: number;
}

interface Transaction {
  id: string;
  customerId: string;
  amount: number;
  type: string;
  timestamp: string;
}

interface TransactionRequest {
  customerId: string;
  amount: number;
  type: "CREDIT" | "DEBIT";
}

// =============================================================================
// Legacy System Integration
// =============================================================================

const legacySystem = new LegacySystem();

/**
 * Convert Java Customer object to TypeScript interface
 */
function convertCustomer(javaCustomer: any): Customer {
  return {
    id: javaCustomer.getId(),
    name: javaCustomer.getName(),
    tier: javaCustomer.getTier(),
    balance: javaCustomer.getBalance(),
    transactionCount: javaCustomer.getTransactions().length,
  };
}

/**
 * Convert Java Transaction object to TypeScript interface
 */
function convertTransaction(javaTxn: any): Transaction {
  return {
    id: javaTxn.getId(),
    customerId: javaTxn.getCustomerId(),
    amount: javaTxn.getAmount(),
    type: javaTxn.getType(),
    timestamp: javaTxn.getTimestamp().toISOString(),
  };
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
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          status: "healthy",
          service: "Legacy Java Wrapper",
          integration: "java-typescript",
          legacySystem: "connected",
        })
      );
      return;
    }

    // Get all customers
    if (path === "/api/customers" && req.method === "GET") {
      const javaCustomers = legacySystem.getAllCustomers();
      const customers = javaCustomers.map((c: any) => convertCustomer(c));

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ customers, count: customers.length }));
      return;
    }

    // Get specific customer
    if (path.startsWith("/api/customers/") && req.method === "GET") {
      const customerId = path.split("/")[3];
      const javaCustomer = legacySystem.getCustomer(customerId);

      if (!javaCustomer) {
        res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: "Customer not found" }));
        return;
      }

      const customer = convertCustomer(javaCustomer);
      const javaTxns = legacySystem.getCustomerTransactions(customerId);
      const transactions = javaTxns.map((t: any) => convertTransaction(t));

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ customer, transactions }));
      return;
    }

    // Process transaction
    if (path === "/api/transactions" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk.toString();
      });

      req.on("end", async () => {
        try {
          const data = JSON.parse(body) as TransactionRequest;

          if (!data.customerId || !data.amount || !data.type) {
            res.writeHead(400, { ...corsHeaders, "Content-Type": "application/json" });
            res.end(JSON.stringify({ error: "Missing required fields" }));
            return;
          }

          // 🔥 Call legacy Java code directly!
          const javaTxn = legacySystem.processTransaction(
            data.customerId,
            data.amount,
            data.type
          );

          const transaction = convertTransaction(javaTxn);

          res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(JSON.stringify({ transaction, success: true }));
        } catch (error) {
          res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
          res.end(
            JSON.stringify({
              error: error instanceof Error ? error.message : "Transaction failed",
            })
          );
        }
      });
      return;
    }

    // Generate report
    if (path === "/api/reports/summary" && req.method === "GET") {
      const javaReport = legacySystem.generateReport();

      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(
        JSON.stringify({
          report: {
            totalCustomers: javaReport.totalCustomers,
            totalTransactions: javaReport.totalTransactions,
            totalVolume: javaReport.totalVolume,
            generatedAt: javaReport.generatedAt,
          },
          source: "legacy-java-system",
        })
      );
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
  console.log("🏛️  Legacy Java Wrapper Server");
  console.log(`🚀 Running on http://localhost:${PORT}`);
  console.log("");
  console.log("📍 Endpoints:");
  console.log(`   GET  http://localhost:${PORT}/health`);
  console.log(`   GET  http://localhost:${PORT}/api/customers`);
  console.log(`   GET  http://localhost:${PORT}/api/customers/:id`);
  console.log(`   POST http://localhost:${PORT}/api/transactions`);
  console.log(`   GET  http://localhost:${PORT}/api/reports/summary`);
  console.log("");
  console.log("🔥 Features:");
  console.log("   ✅ Direct Java imports in TypeScript");
  console.log("   ✅ Zero serialization overhead");
  console.log("   ✅ Legacy code wrapped in modern API");
  console.log("   ✅ Single deployment artifact");
});
