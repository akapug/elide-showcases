import { createServer } from "http";
import { processor } from "./image_proc.py";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/resize") {
    const result = processor.resize(1920, 1080, 800, 600);
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🖼️  Image Processing on http://localhost:3000"));
