import { createServer } from "http";
import { compute } from "./numpy_compute.py";

const server = createServer(async (req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/health") {
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ status: "healthy", service: "NumPy + TypeScript" }));
    return;
  }

  if (req.url === "/api/compute" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { array } = JSON.parse(body);
      const result = compute.array_operations(array);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(result));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🔬 NumPy + TypeScript on http://localhost:3000"));
