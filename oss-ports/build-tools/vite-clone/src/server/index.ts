/**
 * Vite Clone - Development Server
 *
 * Fast development server with Hot Module Replacement (HMR),
 * native ESM support, and middleware-based request handling.
 */

import { createServer as createHttpServer, IncomingMessage, ServerResponse, Server } from 'http';
import { createServer as createHttpsServer } from 'https';
import { resolve, extname, join } from 'path';
import { existsSync, readFileSync, statSync } from 'fs';
import type { ResolvedConfig } from '../types/config';
import type { Plugin } from '../types/plugin';
import type { ModuleGraph, ModuleNode } from './moduleGraph';
import type { HMRServer } from './hmr';
import { createModuleGraph } from './moduleGraph';
import { createHMRServer } from './hmr';
import { createPluginContainer } from './pluginContainer';
import { transformRequest } from './transformRequest';
import { resolveId } from './resolveId';

/**
 * Development server interface
 */
export interface ViteDevServer {
  config: ResolvedConfig;
  server: Server;
  middlewares: Connect.Server;
  httpServer: Server;
  ws: HMRServer;
  moduleGraph: ModuleGraph;
  pluginContainer: PluginContainer;
  transformIndexHtml: (url: string, html: string) => Promise<string>;
  transformRequest: (url: string, options?: TransformOptions) => Promise<TransformResult | null>;
  listen: (port?: number, host?: string) => Promise<void>;
  close: () => Promise<void>;
  restart: () => Promise<void>;
  _restartPromise: Promise<void> | null;
}

/**
 * Plugin container for applying hooks
 */
export interface PluginContainer {
  options: any;
  buildStart: () => Promise<void>;
  resolveId: (id: string, importer?: string) => Promise<string | null>;
  load: (id: string) => Promise<string | null>;
  transform: (code: string, id: string) => Promise<{ code: string; map?: any } | null>;
  close: () => Promise<void>;
}

/**
 * Transform options
 */
export interface TransformOptions {
  ssr?: boolean;
  html?: boolean;
}

/**
 * Transform result
 */
export interface TransformResult {
  code: string;
  map?: any;
  etag?: string;
  deps?: string[];
}

/**
 * Connect middleware type
 */
namespace Connect {
  export interface Server {
    use: (middleware: Middleware) => void;
  }

  export type Middleware = (
    req: IncomingMessage,
    res: ServerResponse,
    next: (err?: any) => void,
  ) => void;
}

/**
 * Create development server
 */
export async function createServer(
  inlineConfig: any = {},
): Promise<ViteDevServer> {
  const config = await resolveConfig(inlineConfig, 'serve', 'development');
  const root = config.root;
  const serverConfig = config.server;

  // Create HTTP/HTTPS server
  const httpServer = serverConfig.https
    ? createHttpsServer(serverConfig.https)
    : createHttpServer();

  // Create middleware stack
  const middlewares = createMiddlewareStack();

  // Create module graph
  const moduleGraph = createModuleGraph();

  // Create plugin container
  const pluginContainer = createPluginContainer(config.plugins);

  // Create HMR server
  const ws = createHMRServer(httpServer, config);

  // Watch file system for changes
  const watcher = createFileWatcher(config, moduleGraph, ws);

  // Create server instance
  const server: ViteDevServer = {
    config,
    server: httpServer,
    middlewares,
    httpServer,
    ws,
    moduleGraph,
    pluginContainer,
    transformIndexHtml: async (url: string, html: string) => {
      return await transformIndexHtml(html, url, config, pluginContainer);
    },
    transformRequest: async (url: string, options?: TransformOptions) => {
      return await transformRequest(url, server, options);
    },
    listen: async (port?: number, host?: string) => {
      const serverPort = port || serverConfig.port;
      const serverHost = host || serverConfig.host;

      return new Promise((resolve, reject) => {
        const onError = (e: Error & { code?: string }) => {
          if (e.code === 'EADDRINUSE') {
            if (serverConfig.strictPort) {
              reject(new Error(`Port ${serverPort} is already in use`));
            } else {
              config.logger.info(`Port ${serverPort} is in use, trying another one...`);
              httpServer.listen(0, serverHost);
            }
          } else {
            reject(e);
          }
        };

        httpServer.on('error', onError);

        httpServer.listen(serverPort, serverHost, () => {
          httpServer.removeListener('error', onError);

          const address = httpServer.address();
          const actualPort = typeof address === 'object' ? address?.port : serverPort;

          config.logger.info(`\n  Dev server running at:\n`);
          config.logger.info(`  > Local:   http://${serverHost}:${actualPort}/`);
          config.logger.info(`  > Network: use --host to expose\n`);

          if (serverConfig.open) {
            openBrowser(`http://${serverHost}:${actualPort}`);
          }

          resolve();
        });
      });
    },
    close: async () => {
      await watcher.close();
      await ws.close();
      await pluginContainer.close();
      await new Promise((resolve) => httpServer.close(resolve));
    },
    restart: async () => {
      if (server._restartPromise) {
        return server._restartPromise;
      }

      server._restartPromise = (async () => {
        config.logger.info('Restarting server...');
        await server.close();
        const newServer = await createServer(inlineConfig);
        Object.assign(server, newServer);
        await server.listen();
        server._restartPromise = null;
      })();

      return server._restartPromise;
    },
    _restartPromise: null,
  };

  // Setup middlewares
  setupMiddlewares(server);

  // Connect HTTP server to middleware stack
  httpServer.on('request', (req, res) => {
    let index = 0;

    const next = (err?: any) => {
      if (err) {
        res.statusCode = 500;
        res.end(`Internal Server Error: ${err.message}`);
        return;
      }

      if (index >= middlewares.stack.length) {
        res.statusCode = 404;
        res.end('Not Found');
        return;
      }

      const middleware = middlewares.stack[index++];
      try {
        middleware(req, res, next);
      } catch (error) {
        next(error);
      }
    };

    next();
  });

  // Run buildStart hooks
  await pluginContainer.buildStart();

  // Run configureServer hooks
  for (const plugin of config.plugins) {
    if (plugin.configureServer) {
      await plugin.configureServer(server);
    }
  }

  return server;
}

/**
 * Create middleware stack
 */
function createMiddlewareStack(): Connect.Server {
  const stack: Connect.Middleware[] = [];

  return {
    use: (middleware: Connect.Middleware) => {
      stack.push(middleware);
    },
    stack,
  } as any;
}

/**
 * Setup built-in middlewares
 */
function setupMiddlewares(server: ViteDevServer) {
  const { config, middlewares } = server;

  // CORS middleware
  if (config.server.cors) {
    middlewares.use(corsMiddleware(config));
  }

  // Static file middleware for public directory
  if (config.publicDir && existsSync(config.publicDir)) {
    middlewares.use(staticMiddleware(config.publicDir));
  }

  // Transform middleware
  middlewares.use(transformMiddleware(server));

  // HTML fallback middleware for SPA
  middlewares.use(htmlFallbackMiddleware(server));

  // Error handling middleware
  middlewares.use(errorMiddleware());
}

/**
 * CORS middleware
 */
function corsMiddleware(config: ResolvedConfig): Connect.Middleware {
  return (req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.statusCode = 204;
      res.end();
      return;
    }

    next();
  };
}

/**
 * Static file middleware
 */
function staticMiddleware(publicDir: string): Connect.Middleware {
  return (req, res, next) => {
    if (!req.url) {
      next();
      return;
    }

    const filePath = resolve(publicDir, req.url.slice(1));

    if (!existsSync(filePath) || !statSync(filePath).isFile()) {
      next();
      return;
    }

    const ext = extname(filePath);
    const contentType = getContentType(ext);

    res.setHeader('Content-Type', contentType);
    res.end(readFileSync(filePath));
  };
}

/**
 * Transform middleware - handles module transformation
 */
function transformMiddleware(server: ViteDevServer): Connect.Middleware {
  return async (req, res, next) => {
    if (!req.url || req.method !== 'GET') {
      next();
      return;
    }

    const url = req.url;

    try {
      // Handle index.html
      if (url === '/' || url === '/index.html') {
        const indexPath = resolve(server.config.root, 'index.html');
        if (existsSync(indexPath)) {
          let html = readFileSync(indexPath, 'utf-8');
          html = await server.transformIndexHtml(url, html);

          res.setHeader('Content-Type', 'text/html');
          res.statusCode = 200;
          res.end(html);
          return;
        }
      }

      // Handle module transformation
      const result = await server.transformRequest(url);

      if (result) {
        const ext = extname(url);
        const contentType = getContentType(ext);

        res.setHeader('Content-Type', contentType);
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('ETag', result.etag || '');

        res.statusCode = 200;
        res.end(result.code);
        return;
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * HTML fallback middleware for SPA
 */
function htmlFallbackMiddleware(server: ViteDevServer): Connect.Middleware {
  return async (req, res, next) => {
    if (!req.url || req.method !== 'GET') {
      next();
      return;
    }

    // If no extension, might be a SPA route - serve index.html
    if (!extname(req.url)) {
      const indexPath = resolve(server.config.root, 'index.html');
      if (existsSync(indexPath)) {
        let html = readFileSync(indexPath, 'utf-8');
        html = await server.transformIndexHtml(req.url, html);

        res.setHeader('Content-Type', 'text/html');
        res.statusCode = 200;
        res.end(html);
        return;
      }
    }

    next();
  };
}

/**
 * Error handling middleware
 */
function errorMiddleware(): Connect.Middleware {
  return (req, res, next) => {
    // This middleware catches errors from other middlewares
    next();
  };
}

/**
 * Transform index.html with plugins
 */
async function transformIndexHtml(
  html: string,
  url: string,
  config: ResolvedConfig,
  pluginContainer: PluginContainer,
): Promise<string> {
  // Inject HMR client
  html = html.replace(
    '</head>',
    `  <script type="module" src="/@vite/client"></script>\n  </head>`,
  );

  // Run transformIndexHtml hooks
  for (const plugin of config.plugins) {
    if (plugin.transformIndexHtml) {
      const result = await plugin.transformIndexHtml(html, { path: url, filename: url });
      if (typeof result === 'string') {
        html = result;
      } else if (result) {
        if (result.html) html = result.html;
        // Handle tags injection
        if (result.tags) {
          for (const tag of result.tags) {
            if (tag.injectTo === 'head') {
              html = html.replace('</head>', `  ${renderTag(tag)}\n  </head>`);
            } else {
              html = html.replace('</body>', `  ${renderTag(tag)}\n  </body>`);
            }
          }
        }
      }
    }
  }

  return html;
}

/**
 * Render HTML tag
 */
function renderTag(tag: any): string {
  const attrs = Object.entries(tag.attrs || {})
    .map(([key, value]) => `${key}="${value}"`)
    .join(' ');

  if (tag.tag === 'script' || tag.tag === 'style') {
    return `<${tag.tag} ${attrs}>${tag.children || ''}</${tag.tag}>`;
  }

  return `<${tag.tag} ${attrs} />`;
}

/**
 * Create file watcher
 */
function createFileWatcher(
  config: ResolvedConfig,
  moduleGraph: ModuleGraph,
  ws: HMRServer,
) {
  // Simplified file watcher
  // In production, would use chokidar or similar
  const watchers: any[] = [];

  return {
    close: async () => {
      for (const watcher of watchers) {
        await watcher.close();
      }
    },
  };
}

/**
 * Get content type for file extension
 */
function getContentType(ext: string): string {
  const contentTypes: Record<string, string> = {
    '.html': 'text/html',
    '.js': 'application/javascript',
    '.mjs': 'application/javascript',
    '.ts': 'application/javascript',
    '.tsx': 'application/javascript',
    '.jsx': 'application/javascript',
    '.json': 'application/json',
    '.css': 'text/css',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf',
    '.eot': 'application/vnd.ms-fontobject',
  };

  return contentTypes[ext] || 'application/octet-stream';
}

/**
 * Open browser
 */
function openBrowser(url: string) {
  const open = require('open');
  if (open) {
    open(url).catch(() => {
      // Ignore errors
    });
  }
}

/**
 * Import config resolution from config module
 */
async function resolveConfig(inlineConfig: any, command: string, mode: string) {
  // This would import from ../core/config
  // For now, return a mock config
  return {
    root: process.cwd(),
    base: '/',
    mode,
    command,
    server: {
      port: 5173,
      host: 'localhost',
      strictPort: false,
      open: false,
      cors: true,
      https: false,
      hmr: {
        protocol: 'ws',
        host: 'localhost',
        port: 24678,
      },
    },
    publicDir: resolve(process.cwd(), 'public'),
    plugins: [],
    logger: {
      info: console.log,
      warn: console.warn,
      error: console.error,
      clearScreen: () => console.clear(),
    },
  } as ResolvedConfig;
}
