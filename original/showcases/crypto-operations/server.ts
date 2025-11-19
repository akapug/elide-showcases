import { createServer } from "http";
import { sha256, hmacSha256, generateKeyPair, encrypt } from "./CryptoUtils.java";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/hash" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", async () => {
      const { data } = JSON.parse(body);
      const hash = await sha256(data);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ hash }));
    });
    return;
  }

  if (req.url === "/api/keypair" && req.method === "GET") {
    const keyPair = generateKeyPair();
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(keyPair));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🔐 Crypto Operations on http://localhost:3000"));
