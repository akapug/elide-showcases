/**
 * Velocity App - Main Application Class
 * Ultra-fast web framework optimized for Bun
 */

import type { Server, ServerWebSocket } from 'bun';
import { RadixRouter, type HTTPMethod, type RouteHandler } from './router';
import { Context } from './context';

export type Middleware = (ctx: Context, next: () => Promise<any>) => any | Promise<any>;

export interface WebSocketHandler {
  open?: (ws: ServerWebSocket<any>) => void;
  message?: (ws: ServerWebSocket<any>, message: string | Buffer) => void;
  close?: (ws: ServerWebSocket<any>, code: number, reason: string) => void;
  error?: (ws: ServerWebSocket<any>, error: Error) => void;
}

export interface VelocityOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  maxRequestBodySize?: number;
}

export class Velocity {
  private router: RadixRouter;
  private middleware: Middleware[];
  private wsHandlers: Map<string, WebSocketHandler>;
  private errorHandler: ((error: Error, ctx: Context) => Response) | null;
  private notFoundHandler: ((ctx: Context) => Response) | null;
  private server: Server | null;

  constructor() {
    this.router = new RadixRouter();
    this.middleware = [];
    this.wsHandlers = new Map();
    this.errorHandler = null;
    this.notFoundHandler = null;
    this.server = null;
  }

  /**
   * Add global middleware
   */
  use(middleware: Middleware): void {
    this.middleware.push(middleware);
  }

  /**
   * Register GET route
   */
  get(path: string, handler: RouteHandler): void {
    this.router.add('GET', path, handler);
  }

  /**
   * Register POST route
   */
  post(path: string, handler: RouteHandler): void {
    this.router.add('POST', path, handler);
  }

  /**
   * Register PUT route
   */
  put(path: string, handler: RouteHandler): void {
    this.router.add('PUT', path, handler);
  }

  /**
   * Register DELETE route
   */
  delete(path: string, handler: RouteHandler): void {
    this.router.add('DELETE', path, handler);
  }

  /**
   * Register PATCH route
   */
  patch(path: string, handler: RouteHandler): void {
    this.router.add('PATCH', path, handler);
  }

  /**
   * Register HEAD route
   */
  head(path: string, handler: RouteHandler): void {
    this.router.add('HEAD', path, handler);
  }

  /**
   * Register OPTIONS route
   */
  options(path: string, handler: RouteHandler): void {
    this.router.add('OPTIONS', path, handler);
  }

  /**
   * Register route for all methods
   */
  all(path: string, handler: RouteHandler): void {
    const methods: HTTPMethod[] = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS'];
    for (const method of methods) {
      this.router.add(method, path, handler);
    }
  }

  /**
   * Register WebSocket handler
   */
  ws(path: string, handler: WebSocketHandler): void {
    this.wsHandlers.set(path, handler);
  }

  /**
   * Set custom error handler
   */
  onError(handler: (error: Error, ctx: Context) => Response): void {
    this.errorHandler = handler;
  }

  /**
   * Set custom 404 handler
   */
  onNotFound(handler: (ctx: Context) => Response): void {
    this.notFoundHandler = handler;
  }

  /**
   * Serve static files from a directory
   */
  static(prefix: string, directory: string): void {
    this.get(`${prefix}/*path`, async (ctx: Context) => {
      const path = ctx.param('path') || '';
      const filePath = `${directory}/${path}`;

      try {
        const file = Bun.file(filePath);
        const exists = await file.exists();

        if (!exists) {
          return ctx.status(404).textResponse('File not found');
        }

        return new Response(file);
      } catch (error) {
        return ctx.status(500).textResponse('Internal server error');
      }
    });
  }

  /**
   * Handle incoming request
   */
  private async handleRequest(req: Request): Promise<Response> {
    const url = new URL(req.url);
    const method = req.method as HTTPMethod;

    // Find matching route
    const { handler, params } = this.router.find(method, url.pathname);

    // Create context
    const ctx = new Context(req, params);

    try {
      // No route found
      if (!handler) {
        if (this.notFoundHandler) {
          return this.notFoundHandler(ctx);
        }
        return ctx.status(404).jsonResponse({ error: 'Not found' });
      }

      // Execute middleware chain
      let index = 0;
      const next = async (): Promise<any> => {
        if (index < this.middleware.length) {
          const middleware = this.middleware[index++];
          return await middleware(ctx, next);
        } else {
          return await handler(ctx);
        }
      };

      const result = await next();

      // Handle different response types
      if (result instanceof Response) {
        return result;
      } else if (result === null || result === undefined) {
        return new Response(null, { status: 204 });
      } else if (typeof result === 'string') {
        return ctx.textResponse(result);
      } else if (typeof result === 'object') {
        return ctx.jsonResponse(result);
      } else {
        return ctx.textResponse(String(result));
      }
    } catch (error) {
      // Error handling
      if (this.errorHandler) {
        return this.errorHandler(error as Error, ctx);
      }

      console.error('Error:', error);
      return ctx.status(500).jsonResponse({
        error: 'Internal server error',
        message: (error as Error).message,
      });
    }
  }

  /**
   * Start the server
   */
  listen(options: VelocityOptions = {}): Server {
    const {
      port = 3000,
      hostname = '0.0.0.0',
      development = false,
    } = options;

    this.server = Bun.serve({
      port,
      hostname,
      development,

      fetch: async (req, server) => {
        // Check for WebSocket upgrade
        const url = new URL(req.url);
        const wsHandler = this.wsHandlers.get(url.pathname);

        if (wsHandler && server.upgrade(req)) {
          return undefined as any; // WebSocket handled
        }

        // Handle HTTP request
        return await this.handleRequest(req);
      },

      websocket: {
        open: (ws) => {
          const handler = this.wsHandlers.get(ws.data?.path || '');
          if (handler?.open) {
            handler.open(ws);
          }
        },
        message: (ws, message) => {
          const handler = this.wsHandlers.get(ws.data?.path || '');
          if (handler?.message) {
            handler.message(ws, message);
          }
        },
        close: (ws, code, reason) => {
          const handler = this.wsHandlers.get(ws.data?.path || '');
          if (handler?.close) {
            handler.close(ws, code, reason);
          }
        },
        error: (ws, error) => {
          const handler = this.wsHandlers.get(ws.data?.path || '');
          if (handler?.error) {
            handler.error(ws, error);
          }
        },
      },
    });

    console.log(`🚀 Velocity server running at http://${hostname}:${port}`);

    return this.server;
  }

  /**
   * Stop the server
   */
  stop(): void {
    if (this.server) {
      this.server.stop();
      this.server = null;
    }
  }

  /**
   * Get server instance
   */
  getServer(): Server | null {
    return this.server;
  }

  /**
   * Get all registered routes (for debugging)
   */
  getRoutes(): Array<{ method: HTTPMethod; path: string }> {
    return this.router.getAllRoutes();
  }
}

/**
 * Create a new Velocity app instance
 */
export function createApp(): Velocity {
  return new Velocity();
}
