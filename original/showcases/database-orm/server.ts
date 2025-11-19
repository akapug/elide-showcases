import { createServer } from "http";
import { getSession, createEntity } from "./HibernateORM.java";

const server = createServer((req, res) => {
  const corsHeaders = { "Access-Control-Allow-Origin": "*", "Content-Type": "application/json" };

  if (req.url === "/api/entities" && req.method === "POST") {
    let body = "";
    req.on("data", c => { body += c; });
    req.on("end", () => {
      const data = JSON.parse(body);
      const entity = createEntity(data);
      res.writeHead(201, corsHeaders);
      res.end(JSON.stringify({ id: entity.getId(), fields: entity.getFields() }));
    });
    return;
  }

  if (req.url === "/api/entities" && req.method === "GET") {
    const session = getSession();
    const entities = session.findAll();
    res.writeHead(200, corsHeaders);
    res.end(JSON.stringify({ entities: entities.map(e => ({ id: e.getId(), fields: e.getFields() })) }));
    return;
  }

  res.writeHead(404, corsHeaders);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(3000, () => console.log("🗄️  Hibernate ORM on http://localhost:3000"));
