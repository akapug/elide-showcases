import { createServer } from "http";
import { getBalance, createTransaction, getBlockInfo, validateAddress } from "./Web3Utils.java";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url?.startsWith("/api/balance/")) {
    const address = req.url.split("/api/balance/")[1];
    const balance = getBalance(address);
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(balance));
    return;
  }

  if (req.url === "/api/transaction" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { from, to, value } = JSON.parse(body);
      const tx = createTransaction(from, to, value);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(tx));
    });
    return;
  }

  if (req.url?.startsWith("/api/block/")) {
    const blockNumber = parseInt(req.url.split("/api/block/")[1]);
    const block = getBlockInfo(blockNumber);
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(block));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("⛓️  Blockchain Utils on http://localhost:3000"));
