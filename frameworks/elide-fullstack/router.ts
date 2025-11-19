/**
 * Elide Full-Stack Framework - File-Based Router
 *
 * Convention-based routing inspired by Next.js with enhanced Elide capabilities:
 * - pages/api/users.ts → /api/users
 * - pages/blog/[id].ts → /blog/:id (dynamic routes)
 * - pages/docs/[...slug].ts → /docs/* (catch-all routes)
 * - pages/index.ts → /
 *
 * Features:
 * - Automatic route discovery
 * - TypeScript-first with full type safety
 * - Middleware support
 * - Request/response validation
 * - Streaming responses
 * - Server-side rendering integration
 */

import { serve, Request, Response } from "elide:http";
import { readdir, stat } from "elide:fs";
import { join, dirname, basename, extname } from "elide:path";

// Route metadata for type-safe routing
export interface RouteMetadata {
  path: string;
  method: string | string[];
  handler: RouteHandler;
  middleware?: Middleware[];
  params?: Record<string, string>;
  streaming?: boolean;
  cache?: CacheConfig;
}

export interface CacheConfig {
  maxAge?: number;
  swr?: number;
  tags?: string[];
  revalidate?: boolean;
}

export type RouteHandler = (
  req: Request,
  ctx: RouteContext
) => Response | Promise<Response> | AsyncIterable<string>;

export type Middleware = (
  req: Request,
  ctx: RouteContext,
  next: () => Promise<Response>
) => Response | Promise<Response>;

export interface RouteContext {
  params: Record<string, string>;
  query: URLSearchParams;
  cookies: Map<string, string>;
  session?: any;
  user?: any;
  data: Map<string, any>;
}

// Route pattern matcher for dynamic routes
class RoutePattern {
  private pattern: RegExp;
  private keys: string[] = [];

  constructor(path: string) {
    const { pattern, keys } = this.compile(path);
    this.pattern = pattern;
    this.keys = keys;
  }

  private compile(path: string): { pattern: RegExp; keys: string[] } {
    const keys: string[] = [];

    // Handle catch-all routes: [...slug] or [...path]
    if (path.includes("[...")) {
      const regexPath = path.replace(/\[\.\.\.(\w+)\]/g, (_, key) => {
        keys.push(key);
        return "(?<" + key + ">.*)";
      });
      return { pattern: new RegExp(`^${regexPath}$`), keys };
    }

    // Handle dynamic routes: [id] or [slug]
    const regexPath = path.replace(/\[(\w+)\]/g, (_, key) => {
      keys.push(key);
      return "(?<" + key + ">[^/]+)";
    });

    return { pattern: new RegExp(`^${regexPath}$`), keys };
  }

  match(path: string): { matched: boolean; params: Record<string, string> } {
    const match = this.pattern.exec(path);
    if (!match) {
      return { matched: false, params: {} };
    }

    const params: Record<string, string> = {};
    for (const key of this.keys) {
      params[key] = match.groups?.[key] || "";
    }

    return { matched: true, params };
  }
}

// Route registry for storing all discovered routes
class RouteRegistry {
  private routes: Map<string, Map<string, RouteMetadata>> = new Map();
  private patterns: Array<{ pattern: RoutePattern; methods: Map<string, RouteMetadata> }> = [];

  register(metadata: RouteMetadata): void {
    const methods = Array.isArray(metadata.method)
      ? metadata.method
      : [metadata.method];

    // Check if route has dynamic segments
    if (metadata.path.includes("[")) {
      const pattern = new RoutePattern(metadata.path);
      let methodMap = this.patterns.find(p => p.pattern === pattern)?.methods;

      if (!methodMap) {
        methodMap = new Map();
        this.patterns.push({ pattern, methods: methodMap });
      }

      for (const method of methods) {
        methodMap.set(method.toUpperCase(), metadata);
      }
    } else {
      // Static route
      if (!this.routes.has(metadata.path)) {
        this.routes.set(metadata.path, new Map());
      }

      const methodMap = this.routes.get(metadata.path)!;
      for (const method of methods) {
        methodMap.set(method.toUpperCase(), metadata);
      }
    }
  }

  find(path: string, method: string): { route: RouteMetadata | null; params: Record<string, string> } {
    // Try static routes first (faster)
    const staticRoute = this.routes.get(path)?.get(method.toUpperCase());
    if (staticRoute) {
      return { route: staticRoute, params: {} };
    }

    // Try dynamic routes
    for (const { pattern, methods } of this.patterns) {
      const { matched, params } = pattern.match(path);
      if (matched) {
        const route = methods.get(method.toUpperCase());
        if (route) {
          return { route, params };
        }
      }
    }

    return { route: null, params: {} };
  }

  all(): RouteMetadata[] {
    const routes: RouteMetadata[] = [];

    for (const methods of this.routes.values()) {
      for (const route of methods.values()) {
        routes.push(route);
      }
    }

    for (const { methods } of this.patterns) {
      for (const route of methods.values()) {
        routes.push(route);
      }
    }

    return routes;
  }
}

// Router class for managing routes and handling requests
export class Router {
  private registry = new RouteRegistry();
  private globalMiddleware: Middleware[] = [];
  private pagesDir: string;

  constructor(pagesDir: string = "./pages") {
    this.pagesDir = pagesDir;
  }

  // Automatically discover and load routes from pages directory
  async discover(): Promise<void> {
    await this.scanDirectory(this.pagesDir, "");
  }

  private async scanDirectory(dir: string, prefix: string): Promise<void> {
    const entries = await readdir(dir);

    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stats = await stat(fullPath);

      if (stats.isDirectory) {
        await this.scanDirectory(fullPath, join(prefix, entry));
      } else if (stats.isFile) {
        const ext = extname(entry);
        if (ext === ".ts" || ext === ".tsx" || ext === ".js") {
          await this.loadRoute(fullPath, prefix);
        }
      }
    }
  }

  private async loadRoute(filePath: string, prefix: string): Promise<void> {
    const fileName = basename(filePath, extname(filePath));

    // Convert file path to route path
    let routePath = join("/", prefix, fileName === "index" ? "" : fileName);

    // Normalize path
    routePath = routePath.replace(/\\/g, "/");
    if (routePath !== "/" && routePath.endsWith("/")) {
      routePath = routePath.slice(0, -1);
    }

    try {
      // Dynamically import the route module
      const module = await import(filePath);

      // Support multiple HTTP methods
      const methods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS", "HEAD"];

      for (const method of methods) {
        if (module[method] || module[method.toLowerCase()]) {
          const handler = module[method] || module[method.toLowerCase()];

          this.registry.register({
            path: routePath,
            method,
            handler,
            middleware: module.middleware || [],
            streaming: module.config?.streaming || false,
            cache: module.config?.cache,
          });
        }
      }

      // Support default export as GET handler
      if (module.default && !module.GET && !module.get) {
        this.registry.register({
          path: routePath,
          method: "GET",
          handler: module.default,
          middleware: module.middleware || [],
          streaming: module.config?.streaming || false,
          cache: module.config?.cache,
        });
      }
    } catch (error) {
      console.error(`Failed to load route ${filePath}:`, error);
    }
  }

  // Register global middleware
  use(...middleware: Middleware[]): void {
    this.globalMiddleware.push(...middleware);
  }

  // Handle incoming request
  async handle(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const { route, params } = this.registry.find(url.pathname, req.method);

    if (!route) {
      return new Response("Not Found", { status: 404 });
    }

    // Build context
    const ctx: RouteContext = {
      params,
      query: url.searchParams,
      cookies: this.parseCookies(req.headers.get("cookie") || ""),
      data: new Map(),
    };

    // Build middleware chain
    const allMiddleware = [...this.globalMiddleware, ...(route.middleware || [])];

    // Execute middleware chain
    let index = 0;
    const next = async (): Promise<Response> => {
      if (index < allMiddleware.length) {
        const middleware = allMiddleware[index++];
        return await middleware(req, ctx, next);
      }

      // Execute route handler
      const result = await route.handler(req, ctx);

      // Handle streaming responses
      if (Symbol.asyncIterator in Object(result)) {
        return this.handleStreamingResponse(result as AsyncIterable<string>, route.cache);
      }

      // Handle regular responses
      if (result instanceof Response) {
        return this.applyCacheHeaders(result, route.cache);
      }

      return new Response("Internal Server Error", { status: 500 });
    };

    try {
      return await next();
    } catch (error) {
      console.error("Route handler error:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  }

  private parseCookies(cookieHeader: string): Map<string, string> {
    const cookies = new Map<string, string>();

    for (const cookie of cookieHeader.split(";")) {
      const [key, value] = cookie.trim().split("=");
      if (key && value) {
        cookies.set(key, decodeURIComponent(value));
      }
    }

    return cookies;
  }

  private handleStreamingResponse(
    stream: AsyncIterable<string>,
    cache?: CacheConfig
  ): Response {
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();

    (async () => {
      try {
        for await (const chunk of stream) {
          await writer.write(new TextEncoder().encode(chunk));
        }
        await writer.close();
      } catch (error) {
        await writer.abort(error);
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Transfer-Encoding": "chunked",
        ...this.getCacheHeaders(cache),
      },
    });
  }

  private applyCacheHeaders(response: Response, cache?: CacheConfig): Response {
    if (!cache) return response;

    const headers = new Headers(response.headers);
    for (const [key, value] of Object.entries(this.getCacheHeaders(cache))) {
      headers.set(key, value);
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  }

  private getCacheHeaders(cache?: CacheConfig): Record<string, string> {
    if (!cache) return {};

    const headers: Record<string, string> = {};

    if (cache.maxAge !== undefined) {
      headers["Cache-Control"] = `public, max-age=${cache.maxAge}`;

      if (cache.swr !== undefined) {
        headers["Cache-Control"] += `, stale-while-revalidate=${cache.swr}`;
      }
    }

    if (cache.tags && cache.tags.length > 0) {
      headers["Cache-Tag"] = cache.tags.join(",");
    }

    return headers;
  }

  // Get all registered routes (useful for debugging)
  routes(): RouteMetadata[] {
    return this.registry.all();
  }
}

// Helper to create a new router instance
export function createRouter(pagesDir?: string): Router {
  return new Router(pagesDir);
}

// Example usage:
/**
 * // pages/index.ts
 * export async function GET(req: Request, ctx: RouteContext) {
 *   return new Response("Hello World!");
 * }
 *
 * // pages/api/users/[id].ts
 * export async function GET(req: Request, ctx: RouteContext) {
 *   const { id } = ctx.params;
 *   const user = await db.users.findOne({ id });
 *   return Response.json(user);
 * }
 *
 * // pages/blog/[...slug].ts
 * export async function GET(req: Request, ctx: RouteContext) {
 *   const { slug } = ctx.params; // e.g., "2024/01/hello-world"
 *   const post = await db.posts.findBySlug(slug);
 *   return Response.json(post);
 * }
 *
 * // Main application
 * const router = createRouter("./pages");
 * await router.discover();
 *
 * serve({
 *   port: 3000,
 *   fetch: (req) => router.handle(req),
 * });
 */
