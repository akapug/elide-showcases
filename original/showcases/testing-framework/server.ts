import { createServer } from "http";
import { create_test_suite, expect, run_example_tests } from "./rspec_runner.rb";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/test/run" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const { tests } = JSON.parse(body);
      const suite = create_test_suite("API Tests");

      tests.forEach((test: any) => {
        suite.add_test(test.description, () => {
          if (test.assertion === "eq") {
            expect(test.actual).to_eq(test.expected);
          } else if (test.assertion === "truthy") {
            expect(test.actual).to_be_truthy();
          }
        });
      });

      const results = suite.run();
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(results));
    });
    return;
  }

  if (req.url === "/api/test/examples" && req.method === "GET") {
    const results = run_example_tests();
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(results));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🧪 Testing Framework on http://localhost:3000"));
