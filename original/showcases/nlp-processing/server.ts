import { createServer } from "http";
import { nlp } from "./nlp_engine.py";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/tokenize") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { text } = JSON.parse(body);
      const tokens = nlp.tokenize(text);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ tokens }));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("📝 NLP Processing on http://localhost:3000"));
