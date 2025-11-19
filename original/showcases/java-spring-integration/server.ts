/**
 * Java Spring Integration - TypeScript Frontend Server
 *
 * Demonstrates REAL polyglot integration between TypeScript and Java Spring beans.
 * Direct imports with <1ms overhead!
 *
 * Run with: elide run server.ts
 */

import { createServer } from "http";

// 🔥 REAL POLYGLOT: Direct Java Spring import!
import { getUserService, getDataRepository, getEventPublisher, getContext } from "./SpringBeans.java";

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
    if (path === "/health") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({
        status: "healthy",
        service: "Java Spring + TypeScript",
        polyglot: { languages: ["typescript", "java"], framework: "spring" }
      }));
      return;
    }

    // User service endpoints
    if (path === "/api/users" && req.method === "GET") {
      const userService = getUserService();
      const users = userService.getAllUsers();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ users, count: users.length }));
      return;
    }

    if (path === "/api/users" && req.method === "POST") {
      let body = "";
      req.on("data", chunk => { body += chunk.toString(); });
      req.on("end", () => {
        const { name, email } = JSON.parse(body);
        const userService = getUserService();
        const user = userService.createUser(name, email);

        // Publish event
        const eventPublisher = getEventPublisher();
        eventPublisher.publishEvent("user.created", user);

        res.writeHead(201, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(user));
      });
      return;
    }

    // Beans info
    if (path === "/api/beans" && req.method === "GET") {
      const context = getContext();
      const beanNames = context.getBeanNames();
      const beans = beanNames.map(name => context.getBeanInfo(name));
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ beans, count: beans.length }));
      return;
    }

    // Events endpoint
    if (path === "/api/events" && req.method === "GET") {
      const eventPublisher = getEventPublisher();
      const events = eventPublisher.getEvents();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ events, count: events.length }));
      return;
    }

    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));

  } catch (error) {
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(error) }));
  }
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`🌱 Java Spring + TypeScript running on http://localhost:${PORT}`);
});
