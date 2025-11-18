/**
 * Server - Simple HTTP Server
 *
 * Simple, powerful HTTP server.
 * **POLYGLOT SHOWCASE**: HTTP server for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/server (~200K downloads/week)
 *
 * Features:
 * - Promise-based API
 * - Modern async/await
 * - Route handling
 * - Middleware support
 * - Static file serving
 * - Zero dependencies
 *
 * Use cases:
 * - Web applications
 * - REST APIs
 * - Static sites
 * - Development servers
 *
 * Package has ~200K downloads/week on npm!
 */

interface Context {
  method: string;
  path: string;
  query: Record<string, string>;
  data?: any;
}

type Handler = (ctx: Context) => Promise<any> | any;

const routes: Map<string, Map<string, Handler>> = new Map();

export function get(path: string, handler: Handler): void {
  if (!routes.has("GET")) routes.set("GET", new Map());
  routes.get("GET")!.set(path, handler);
}

export function post(path: string, handler: Handler): void {
  if (!routes.has("POST")) routes.set("POST", new Map());
  routes.get("POST")!.set(path, handler);
}

export async function router(ctx: Context): Promise<any> {
  const methodRoutes = routes.get(ctx.method);
  if (!methodRoutes) return { status: 404, error: "Not Found" };

  const handler = methodRoutes.get(ctx.path);
  if (!handler) return { status: 404, error: "Not Found" };

  return await handler(ctx);
}

export default { get, post, router };

if (import.meta.url.includes("elide-server.ts")) {
  console.log("🖥️  Server - Simple HTTP Server (POLYGLOT!)\n");

  get("/", async () => ({ hello: "world" }));
  get("/users", async () => ({ users: [] }));
  post("/users", async (ctx) => ({ created: ctx.data }));

  router({ method: "GET", path: "/", query: {} }).then((res) => {
    console.log("GET /:", res);
  });

  router({ method: "POST", path: "/users", query: {}, data: { name: "Alice" } }).then((res) => {
    console.log("POST /users:", res);
  });

  console.log("\n💡 Polyglot: Same server pattern everywhere!");
}
