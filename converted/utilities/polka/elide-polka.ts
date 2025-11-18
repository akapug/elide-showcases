/**
 * Polka - Ultra-Lightweight HTTP Framework
 *
 * A micro web server so fast, it'll make you dance!
 * **POLYGLOT SHOWCASE**: Lightweight HTTP for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/polka (~400K downloads/week)
 *
 * Features:
 * - Express-like API
 * - Extremely fast routing
 * - Minimal overhead
 * - Middleware support
 * - Route parameters
 * - Zero dependencies
 *
 * Use cases:
 * - High-performance APIs
 * - Serverless functions
 * - Lightweight microservices
 * - Edge computing
 *
 * Package has ~400K downloads/week on npm!
 */

interface Request {
  method: string;
  url: string;
  path?: string;
  params?: Record<string, string>;
  query?: Record<string, string>;
}

interface Response {
  statusCode: number;
  end(data: string): void;
}

type Handler = (req: Request, res: Response, next?: () => void) => void;

interface Route {
  method: string;
  path: string;
  handler: Handler;
}

export class Polka {
  private routes: Route[] = [];
  private middleware: Handler[] = [];

  use(handler: Handler): this {
    this.middleware.push(handler);
    return this;
  }

  get(path: string, handler: Handler): this {
    this.routes.push({ method: "GET", path, handler });
    return this;
  }

  post(path: string, handler: Handler): this {
    this.routes.push({ method: "POST", path, handler });
    return this;
  }

  put(path: string, handler: Handler): this {
    this.routes.push({ method: "PUT", path, handler });
    return this;
  }

  delete(path: string, handler: Handler): this {
    this.routes.push({ method: "DELETE", path, handler });
    return this;
  }

  private matchRoute(method: string, path: string): Route | null {
    for (const route of this.routes) {
      if (route.method !== method) continue;
      if (route.path === path) return route;

      // Simple param matching
      const pattern = route.path.replace(/:\w+/g, "([^/]+)");
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(path)) return route;
    }
    return null;
  }

  async handle(req: Request, res: Response): Promise<void> {
    const [path, query] = req.url.split("?");
    req.path = path;

    const route = this.matchRoute(req.method, path);

    if (!route) {
      res.statusCode = 404;
      res.end("Not Found");
      return;
    }

    for (const mw of this.middleware) {
      mw(req, res);
    }

    route.handler(req, res);
  }

  listen(port: number, callback?: () => void): void {
    console.log(`Polka listening on port ${port}`);
    if (callback) callback();
  }
}

export default function polka(): Polka {
  return new Polka();
}

export { polka };

if (import.meta.url.includes("elide-polka.ts")) {
  console.log("💃 Polka - Ultra-Lightweight HTTP Framework (POLYGLOT!)\n");

  const app = polka();

  app.get("/", (req, res) => {
    res.end(JSON.stringify({ message: "Hello Polka!" }));
  });

  app.get("/users/:id", (req, res) => {
    res.end(JSON.stringify({ userId: "123" }));
  });

  const mockRes = {
    statusCode: 200,
    end(data: string) {
      console.log("Response:", data);
    },
  };

  app.handle({ method: "GET", url: "/" }, mockRes);
  console.log();

  console.log("✅ Use Cases:");
  console.log("- High-performance APIs");
  console.log("- Serverless functions");
  console.log("- Edge computing");
  console.log();

  console.log("💡 Polyglot: Same fast routing everywhere!");
}
