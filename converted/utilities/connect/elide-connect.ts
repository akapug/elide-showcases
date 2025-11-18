/**
 * Connect - Extensible HTTP Server Framework
 *
 * Middleware framework for building HTTP servers with composable middleware.
 * **POLYGLOT SHOWCASE**: Build HTTP servers with middleware in ANY language on Elide!
 *
 * Based on https://www.npmjs.com/package/connect (~1M+ downloads/week)
 *
 * Features:
 * - Middleware composition
 * - Request/response handling
 * - Error handling middleware
 * - Mount path support
 * - Route matching
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Python, Ruby, Java can all use same middleware pattern
 * - ONE middleware system across all languages
 * - Share HTTP logic between services
 * - Consistent request handling
 *
 * Use cases:
 * - HTTP server middleware
 * - API route handling
 * - Request/response processing
 * - Error handling pipelines
 *
 * Package has ~1M+ downloads/week on npm - essential middleware framework!
 */

export type Request = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: any;
  params?: Record<string, string>;
  query?: Record<string, string>;
};

export type Response = {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  setHeader(name: string, value: string): void;
  writeHead(statusCode: number, headers?: Record<string, string>): void;
  end(body?: any): void;
  send(body: any): void;
  json(data: any): void;
};

export type NextFunction = (err?: any) => void;

export type Middleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export type ErrorMiddleware = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => void | Promise<void>;

export class Connect {
  private middleware: Array<{
    path: string;
    handler: Middleware | ErrorMiddleware;
  }> = [];

  /**
   * Add middleware to the stack
   */
  use(pathOrHandler: string | Middleware, handler?: Middleware): this {
    if (typeof pathOrHandler === 'function') {
      this.middleware.push({ path: '/', handler: pathOrHandler });
    } else if (handler) {
      this.middleware.push({ path: pathOrHandler, handler });
    }
    return this;
  }

  /**
   * Handle incoming request
   */
  async handle(req: Request, res: Response): Promise<void> {
    let index = 0;
    let error: any = null;

    const next = async (err?: any): Promise<void> => {
      if (err) {
        error = err;
      }

      if (index >= this.middleware.length) {
        if (error) {
          // No error handler found
          res.statusCode = 500;
          res.end(error.message || 'Internal Server Error');
        } else {
          // No handler responded
          res.statusCode = 404;
          res.end('Not Found');
        }
        return;
      }

      const layer = this.middleware[index++];

      // Check if path matches
      if (!req.url.startsWith(layer.path)) {
        return next(error);
      }

      try {
        // Check if error handler
        if (error && layer.handler.length === 4) {
          await (layer.handler as ErrorMiddleware)(error, req, res, next);
          error = null; // Error handled
        } else if (!error && layer.handler.length < 4) {
          await (layer.handler as Middleware)(req, res, next);
        } else {
          return next(error);
        }
      } catch (err) {
        return next(err);
      }
    };

    await next();
  }

  /**
   * Create request handler function
   */
  listen(port?: number): (req: Request, res: Response) => Promise<void> {
    if (port) {
      console.log(`Connect server listening on port ${port}`);
    }
    return (req: Request, res: Response) => this.handle(req, res);
  }
}

/**
 * Create a new Connect app
 */
export function createServer(): Connect {
  return new Connect();
}

export default createServer;

// CLI Demo
if (import.meta.url.includes("elide-connect.ts")) {
  console.log("🔌 Connect - HTTP Middleware Framework (POLYGLOT!)\n");

  const app = createServer();

  // Example 1: Basic middleware
  console.log("=== Example 1: Basic Middleware ===");
  app.use((req, res, next) => {
    console.log(`${req.method} ${req.url}`);
    next();
  });

  app.use((req, res, next) => {
    res.send = (body: any) => {
      res.body = body;
      res.end(body);
    };
    res.json = (data: any) => {
      res.setHeader('Content-Type', 'application/json');
      res.send(JSON.stringify(data));
    };
    next();
  });

  // Example 2: Route handling
  console.log("\n=== Example 2: Route Handling ===");
  app.use('/api', (req, res, next) => {
    if (req.url === '/api/users') {
      res.json({ users: ['Alice', 'Bob', 'Charlie'] });
    } else {
      next();
    }
  });

  app.use('/api', (req, res, next) => {
    if (req.url === '/api/posts') {
      res.json({ posts: ['Post 1', 'Post 2'] });
    } else {
      next();
    }
  });

  // Example 3: Error handling
  console.log("\n=== Example 3: Error Handling ===");
  app.use((req, res, next) => {
    if (req.url === '/error') {
      next(new Error('Something went wrong!'));
    } else {
      next();
    }
  });

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    console.error('Error caught:', err.message);
    res.statusCode = 500;
    res.json({ error: err.message });
  });

  // Test the middleware
  console.log("\n=== Testing Middleware ===");

  const mockResponse = (): Response => ({
    statusCode: 200,
    headers: {},
    body: null,
    setHeader(name: string, value: string) {
      this.headers[name] = value;
    },
    writeHead(statusCode: number, headers?: Record<string, string>) {
      this.statusCode = statusCode;
      if (headers) Object.assign(this.headers, headers);
    },
    end(body?: any) {
      if (body !== undefined) this.body = body;
      console.log(`Response: ${this.statusCode}`, this.body);
    },
    send(body: any) {
      this.body = body;
      this.end(body);
    },
    json(data: any) {
      this.setHeader('Content-Type', 'application/json');
      this.send(JSON.stringify(data));
    }
  });

  (async () => {
    console.log("\nTest 1: GET /api/users");
    await app.handle(
      { url: '/api/users', method: 'GET', headers: {} },
      mockResponse()
    );

    console.log("\nTest 2: GET /api/posts");
    await app.handle(
      { url: '/api/posts', method: 'GET', headers: {} },
      mockResponse()
    );

    console.log("\nTest 3: GET /error");
    await app.handle(
      { url: '/error', method: 'GET', headers: {} },
      mockResponse()
    );

    console.log("\nTest 4: GET /notfound");
    await app.handle(
      { url: '/notfound', method: 'GET', headers: {} },
      mockResponse()
    );

    console.log("\n=== POLYGLOT Use Case ===");
    console.log("🌐 Same middleware pattern works in:");
    console.log("  • JavaScript/TypeScript");
    console.log("  • Python (via Elide)");
    console.log("  • Ruby (via Elide)");
    console.log("  • Java (via Elide)");
    console.log("\nBenefits:");
    console.log("  ✓ One middleware system for all languages");
    console.log("  ✓ Share HTTP logic across services");
    console.log("  ✓ Consistent error handling");
    console.log("  ✓ ~1M+ downloads/week on npm!");
  })();
}
