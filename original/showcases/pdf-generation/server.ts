import { createServer } from "http";
import { createDocument, generateInvoice } from "./PDFGenerator.java";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/pdf/create") {
    const doc = createDocument("Test Document");
    doc.addHeading("Introduction");
    doc.addParagraph("This is a test PDF document generated with Java iText.");
    const result = doc.generate();
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify(result));
    return;
  }

  if (req.url === "/api/pdf/invoice" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const data = JSON.parse(body);
      const invoice = generateInvoice(data);
      res.writeHead(200, corsHeaders);
      res.end(JSON.stringify(invoice));
    });
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("📄 PDF Generation on http://localhost:3000"));
