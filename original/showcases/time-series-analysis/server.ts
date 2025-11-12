import { createServer } from "http";
import { ts } from "./timeseries.py";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/trend" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { values } = JSON.parse(body);
      const trend = ts.detect_trend(values);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(trend));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("📈 Time Series on http://localhost:3000"));
