import { createServer } from "http";
import { createGraph, findCycles } from "./GraphLib.java";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/graph/create") {
    const graph = createGraph();
    graph.addEdge("A", "B", 1);
    graph.addEdge("B", "C", 2);
    graph.addEdge("A", "C", 3);
    const stats = graph.getStats();
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(stats));
    return;
  }

  if (req.url === "/api/graph/path" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { edges, start, end } = JSON.parse(body);
      const graph = createGraph();
      edges.forEach(([from, to]: [string, string]) => graph.addEdge(from, to, 1));
      const path = graph.shortestPath(start, end);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify({ path }));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("📊 Graph Algorithms on http://localhost:3000"));
