/**
 * Ruby Rails Patterns - TypeScript API Server
 * Direct Ruby ActiveRecord imports!
 */

import { createServer } from "http";
import { create_user, create_post, get_all_users, get_all_posts, find_user, seed_data } from "./active_record.rb";

const server = createServer(async (req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host}`);
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
    if (url.pathname === "/health") {
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ status: "healthy", service: "Ruby Rails + TypeScript" }));
      return;
    }

    if (url.pathname === "/api/users" && req.method === "GET") {
      const users = get_all_users();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify({ users }));
      return;
    }

    if (url.pathname === "/api/users" && req.method === "POST") {
      let body = "";
      req.on("data", c => { body += c.toString(); });
      req.on("end", () => {
        const { name, email, role } = JSON.parse(body);
        const user = create_user(name, email, role);
        res.writeHead(201, { ...corsHeaders, "Content-Type": "application/json" });
        res.end(JSON.stringify(user));
      });
      return;
    }

    if (url.pathname === "/api/seed" && req.method === "POST") {
      const result = seed_data();
      res.writeHead(200, { ...corsHeaders, "Content-Type": "application/json" });
      res.end(JSON.stringify(result));
      return;
    }

    res.writeHead(404, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (error) {
    res.writeHead(500, { ...corsHeaders, "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(error) }));
  }
});

server.listen(3000, () => console.log("💎 Ruby Rails + TypeScript on http://localhost:3000"));
