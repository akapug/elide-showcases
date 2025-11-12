import { createServer } from "http";
import { audio } from "./audio_processor.py";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/features") {
    const features = audio.extract_features("song.mp3");
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(features));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🎵 Audio Processing on http://localhost:3000"));
