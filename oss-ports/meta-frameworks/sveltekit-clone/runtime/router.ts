/**
 * SvelteKit Router - File-based routing with load functions
 *
 * Features:
 * - File-based routing from src/routes/
 * - Dynamic routes [param]
 * - Rest parameters [...rest]
 * - Optional parameters [[optional]]
 * - Layout cascading
 * - Load functions (+page.ts, +page.server.ts)
 * - Server routes (+server.ts)
 */

import { readdir, stat } from 'fs/promises';
import { join, sep } from 'path';

export interface Route {
  id: string;
  pattern: RegExp;
  params: string[];
  segments: RouteSegment[];
  page?: string;
  layout?: string;
  error?: string;
  load?: string;
  serverLoad?: string;
  server?: string;
}

export interface RouteSegment {
  content: string;
  dynamic: boolean;
  rest: boolean;
  optional: boolean;
}

export class SvelteKitRouter {
  private routes: Route[] = [];
  private routesDir: string;

  constructor(routesDir: string) {
    this.routesDir = routesDir;
  }

  /**
   * Build route tree
   */
  async build(): Promise<void> {
    console.log('[Router] Building routes...');
    const start = performance.now();

    await this.scanRoutes(this.routesDir);

    // Sort by specificity
    this.routes.sort((a, b) => {
      const aStatic = a.segments.every(s => !s.dynamic);
      const bStatic = b.segments.every(s => !s.dynamic);

      if (aStatic && !bStatic) return -1;
      if (!aStatic && bStatic) return 1;

      return b.segments.length - a.segments.length;
    });

    const elapsed = performance.now() - start;
    console.log(`[Router] Built ${this.routes.length} routes in ${elapsed.toFixed(2)}ms`);
  }

  /**
   * Scan routes directory
   */
  private async scanRoutes(dir: string, basePath = ''): Promise<void> {
    const entries = await readdir(dir, { withFileTypes: true });

    // Collect route files
    const files: Record<string, string> = {};

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isFile()) {
        files[entry.name] = fullPath;
      } else if (entry.isDirectory()) {
        // Recurse into subdirectories
        const relativePath = join(basePath, entry.name);
        await this.scanRoutes(fullPath, relativePath);
      }
    }

    // Build route from files
    if (Object.keys(files).length > 0) {
      const route = this.buildRoute(basePath, files);
      if (route) {
        this.routes.push(route);
      }
    }
  }

  /**
   * Build route from files
   */
  private buildRoute(path: string, files: Record<string, string>): Route | null {
    const id = path || '/';

    // Parse segments
    const segments = this.parseSegments(path);

    // Build pattern and params
    const { pattern, params } = this.buildPattern(segments);

    // Identify files
    const page = files['+page.svelte'];
    const layout = files['+layout.svelte'];
    const error = files['+error.svelte'];
    const load = files['+page.ts'] || files['+page.js'];
    const serverLoad = files['+page.server.ts'] || files['+page.server.js'];
    const server = files['+server.ts'] || files['+server.js'];

    // Must have at least one file
    if (!page && !server) {
      return null;
    }

    return {
      id,
      pattern,
      params,
      segments,
      page,
      layout,
      error,
      load,
      serverLoad,
      server,
    };
  }

  /**
   * Parse route segments
   */
  private parseSegments(path: string): RouteSegment[] {
    if (!path) {
      return [];
    }

    return path.split(sep).filter(Boolean).map(segment => {
      // [[optional]]
      if (segment.startsWith('[[') && segment.endsWith(']]')) {
        return {
          content: segment.slice(2, -2),
          dynamic: true,
          rest: false,
          optional: true,
        };
      }

      // [...rest]
      if (segment.startsWith('[...') && segment.endsWith(']')) {
        return {
          content: segment.slice(4, -1),
          dynamic: true,
          rest: true,
          optional: false,
        };
      }

      // [param]
      if (segment.startsWith('[') && segment.endsWith(']')) {
        return {
          content: segment.slice(1, -1),
          dynamic: true,
          rest: false,
          optional: false,
        };
      }

      // static
      return {
        content: segment,
        dynamic: false,
        rest: false,
        optional: false,
      };
    });
  }

  /**
   * Build regex pattern from segments
   */
  private buildPattern(segments: RouteSegment[]): { pattern: RegExp; params: string[] } {
    const params: string[] = [];
    let pattern = '^';

    for (let i = 0; i < segments.length; i++) {
      const segment = segments[i];

      if (segment.dynamic) {
        params.push(segment.content);

        if (segment.rest) {
          pattern += '/(?<' + segment.content + '>.+)';
        } else if (segment.optional) {
          pattern += '(?:/(?<' + segment.content + '>[^/]+))?';
        } else {
          pattern += '/(?<' + segment.content + '>[^/]+)';
        }
      } else {
        pattern += '/' + segment.content.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      }
    }

    pattern += '$';

    return {
      pattern: new RegExp(pattern),
      params,
    };
  }

  /**
   * Match URL to route
   */
  match(url: string): { route: Route; params: Record<string, string> } | null {
    const pathname = new URL(url, 'http://localhost').pathname;

    for (const route of this.routes) {
      const match = pathname.match(route.pattern);

      if (match && match.groups) {
        return {
          route,
          params: match.groups,
        };
      }
    }

    return null;
  }

  /**
   * Get all routes
   */
  getRoutes(): Route[] {
    return [...this.routes];
  }

  /**
   * Get route by id
   */
  getRoute(id: string): Route | undefined {
    return this.routes.find(r => r.id === id);
  }
}

/**
 * Load function executor
 */
export class LoadExecutor {
  /**
   * Execute load function
   */
  async execute(
    loadPath: string,
    context: {
      params: Record<string, string>;
      url: URL;
      fetch: typeof fetch;
      parent?: () => Promise<any>;
    }
  ): Promise<any> {
    const loadModule = await import(loadPath);
    const loadFn = loadModule.load;

    if (!loadFn) {
      return {};
    }

    return await loadFn(context);
  }

  /**
   * Execute server load function
   */
  async executeServer(
    loadPath: string,
    context: {
      params: Record<string, string>;
      url: URL;
      request: Request;
      cookies: any;
      locals: any;
      parent?: () => Promise<any>;
    }
  ): Promise<any> {
    const loadModule = await import(loadPath);
    const loadFn = loadModule.load;

    if (!loadFn) {
      return {};
    }

    return await loadFn(context);
  }
}

/**
 * Server route handler
 */
export class ServerRouteHandler {
  /**
   * Handle request
   */
  async handle(
    serverPath: string,
    method: string,
    request: Request
  ): Promise<Response> {
    const serverModule = await import(serverPath);
    const handler = serverModule[method];

    if (!handler) {
      return new Response('Method not allowed', { status: 405 });
    }

    const event = {
      request,
      params: {},
      url: new URL(request.url),
      cookies: {},
      locals: {},
    };

    return await handler(event);
  }
}

export default SvelteKitRouter;
