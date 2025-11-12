import { createServer } from "http";
import { video } from "./video_analyzer.py";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/metadata") {
    const metadata = video.extract_metadata("video.mp4");
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(metadata));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🎬 Video Analysis on http://localhost:3000"));
