/**
 * Python Scrapy Spider + TypeScript API Server
 */

import { createServer } from "http";
import { spider_manager } from "./scrapy_spider.py";

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
      res.end(JSON.stringify({ status: "healthy", service: "Python Scrapy + TypeScript" }));
      return;
    }

    // List spiders
    if (path === "/api/spiders" && req.method === "GET") {
      const spiders = spider_manager.list_spiders();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ spiders }));
      return;
    }

    // Create spider
    if (path === "/api/spiders" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        const data = JSON.parse(body);
        const spider = spider_manager.create_spider(data.name, data.startUrl);
        res.writeHead(201, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(spider));
      });
      return;
    }

    // Start crawl
    if (path === "/api/crawl" && req.method === "POST") {
      let body = "";
      req.on("data", (chunk) => { body += chunk.toString(); });
      req.on("end", async () => {
        const data = JSON.parse(body);
        const result = spider_manager.start_crawl(data.spider);
        res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(result));
      });
      return;
    }

    // Get results
    if (path === "/api/results" && req.method === "GET") {
      const spider = url.searchParams.get("spider");
      const results = spider_manager.get_results(spider);
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ results }));
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
  console.log("🕷️  Python Scrapy + TypeScript");
  console.log(`🚀 http://localhost:${PORT}`);
});
