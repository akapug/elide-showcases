import { createServer } from "http";
import { compress, analyzeCompression } from "./Compressor.java";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/compress" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", async () => {
      const { data } = JSON.parse(body);
      const result = await compress(data);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(result));
    });
    return;
  }

  if (req.url === "/api/analyze" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { data } = JSON.parse(body);
      const analysis = analyzeCompression(data);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(analysis));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🗜️  Compression Tools on http://localhost:3000"));
