import { createServer } from "http";
import { enqueue_job, process_job, get_queue_stats, get_job_status } from "./job_queue.rb";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/jobs" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { type, payload } = JSON.parse(body);
      const job = enqueue_job(type, payload);
      res.writeHead(201, corsHeaders);
      res.end(JSON.stringify(job));
    });
    return;
  }

  if (req.url === "/api/jobs/process" && req.method === "POST") {
    const result = process_job();
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result || { message: "No jobs to process" }));
    return;
  }

  if (req.url === "/api/jobs/stats" && req.method === "GET") {
    const stats = get_queue_stats();
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(stats));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("⚡ Background Jobs on http://localhost:3000"));
