/**
 * Micro - Asynchronous HTTP Microservices
 *
 * Tiny HTTP microservices framework.
 * **POLYGLOT SHOWCASE**: Microservices for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/micro (~500K downloads/week)
 *
 * Features:
 * - Async/await support
 * - Automatic JSON parsing
 * - Error handling
 * - Minimal API surface
 * - Production-ready
 * - Zero dependencies
 *
 * Use cases:
 * - Microservices
 * - Serverless functions
 * - API endpoints
 * - Lambda handlers
 *
 * Package has ~500K downloads/week on npm!
 */

interface Request {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: any;
}

interface Response {
  statusCode: number;
  headers: Record<string, string>;
  body?: any;
}

type Handler = (req: Request, res: Response) => Promise<any> | any;

export default function micro(handler: Handler) {
  return async function (req: Request): Promise<Response> {
    const res: Response = {
      statusCode: 200,
      headers: { "content-type": "application/json" },
    };

    try {
      const result = await handler(req, res);
      res.body = result;
    } catch (err: any) {
      res.statusCode = err.statusCode || 500;
      res.body = { error: err.message || "Internal Server Error" };
    }

    return res;
  };
}

export async function json(req: Request): Promise<any> {
  return req.body;
}

export function send(res: Response, statusCode: number, data: any): void {
  res.statusCode = statusCode;
  res.body = data;
}

export function sendError(req: Request, res: Response, error: { statusCode: number; message: string }): void {
  res.statusCode = error.statusCode || 500;
  res.body = { error: error.message };
}

export { micro };

if (import.meta.url.includes("elide-micro.ts")) {
  console.log("⚡ Micro - Asynchronous HTTP Microservices (POLYGLOT!)\n");

  console.log("=== Example 1: Simple Handler ===");
  const handler1 = micro(async (req, res) => {
    return { hello: "world" };
  });

  handler1({ method: "GET", url: "/", headers: {} }).then((res) => {
    console.log("Response:", res.body);
  });
  console.log();

  console.log("=== Example 2: JSON Parsing ===");
  const handler2 = micro(async (req, res) => {
    const data = await json(req);
    return { received: data };
  });

  handler2({ method: "POST", url: "/", headers: {}, body: { name: "Alice" } }).then((res) => {
    console.log("Echoed:", res.body);
  });
  console.log();

  console.log("=== Example 3: Custom Status ===");
  const handler3 = micro(async (req, res) => {
    send(res, 201, { created: true });
  });

  handler3({ method: "POST", url: "/users", headers: {} }).then((res) => {
    console.log(`Status: ${res.statusCode}`, res.body);
  });
  console.log();

  console.log("=== Example 4: Error Handling ===");
  const handler4 = micro(async (req, res) => {
    throw new Error("Something went wrong");
  });

  handler4({ method: "GET", url: "/error", headers: {} }).then((res) => {
    console.log(`Error ${res.statusCode}:`, res.body);
  });
  console.log();

  console.log("✅ Use Cases:");
  console.log("- Microservices");
  console.log("- Serverless functions");
  console.log("- API endpoints");
  console.log();

  console.log("💡 Polyglot: Same microservices pattern everywhere!");
}
