import { createServer } from "http";
import { geo } from "./geo_processor.py";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/distance" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { lat1, lon1, lat2, lon2 } = JSON.parse(body);
      const distance = geo.calculate_distance(lat1, lon1, lat2, lon2);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ distance_km: distance }));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🗺️  Geospatial on http://localhost:3000"));
