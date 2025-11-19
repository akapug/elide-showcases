import { createServer } from "http";
import { parseXML, generateXML, validateXML } from "./XMLProcessor.java";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/xml/parse" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { xml } = JSON.parse(body);
      const result = parseXML(xml);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(result));
    });
    return;
  }

  if (req.url === "/api/xml/generate" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const data = JSON.parse(body);
      const xml = generateXML(data);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ xml }));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("📋 XML Processing on http://localhost:3000"));
