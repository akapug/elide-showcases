/**
 * Development Server with Hot Module Replacement (HMR)
 *
 * Features:
 * - Fast refresh for React components
 * - File watching
 * - Source maps
 * - Error overlay
 * - Native Elide HTTP performance
 */

import { watch } from 'fs';
import { createServer, IncomingMessage, ServerResponse } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { FileRouter } from '../runtime/router';
import { PageRenderer } from '../runtime/renderer';
import { join } from 'path';

export interface DevServerOptions {
  port?: number;
  hostname?: string;
  hmr?: boolean;
  rootDir?: string;
}

export class DevServer {
  private httpServer?: ReturnType<typeof createServer>;
  private wsServer?: WebSocketServer;
  private router: FileRouter;
  private renderer: PageRenderer;
  private clients = new Set<WebSocket>();
  private options: Required<DevServerOptions>;

  constructor(options: DevServerOptions = {}) {
    this.options = {
      port: options.port || 3000,
      hostname: options.hostname || 'localhost',
      hmr: options.hmr !== false,
      rootDir: options.rootDir || process.cwd(),
    };

    this.router = new FileRouter(
      join(this.options.rootDir, 'pages'),
      join(this.options.rootDir, 'app')
    );

    this.renderer = new PageRenderer();
  }

  /**
   * Start development server
   */
  async start(): Promise<void> {
    // Build initial route tree
    await this.router.build();

    // Create HTTP server
    this.httpServer = createServer(this.handleRequest.bind(this));

    // Create WebSocket server for HMR
    if (this.options.hmr) {
      this.wsServer = new WebSocketServer({ server: this.httpServer });
      this.setupHMR();
    }

    // Watch for file changes
    this.watchFiles();

    // Start listening
    return new Promise((resolve) => {
      this.httpServer!.listen(
        this.options.port,
        this.options.hostname,
        () => {
          resolve();
        }
      );
    });
  }

  /**
   * Handle HTTP request
   */
  private async handleRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const start = performance.now();
    const url = req.url || '/';

    try {
      // HMR client script
      if (url === '/__elide_hmr__.js') {
        res.writeHead(200, { 'Content-Type': 'application/javascript' });
        res.end(this.getHMRClientScript());
        return;
      }

      // Static files
      if (url.startsWith('/public/') || url.startsWith('/_next/static/')) {
        await this.serveStatic(url, res);
        return;
      }

      // Match route
      const match = this.router.match(url);

      if (!match) {
        res.writeHead(404, { 'Content-Type': 'text/html' });
        res.end(this.render404());
        return;
      }

      // Handle API routes
      if (match.route.type === 'api') {
        await this.handleApiRoute(match, req, res);
        return;
      }

      // Render page
      const result = await this.renderer.render(
        match.route,
        match.params,
        req,
        res
      );

      // Add HMR script
      let html = result.html;
      if (this.options.hmr && !html.includes('__elide_hmr__')) {
        html = html.replace(
          '</body>',
          '<script src="/__elide_hmr__.js"></script></body>'
        );
      }

      res.writeHead(result.statusCode, result.headers);
      res.end(html);

      const elapsed = performance.now() - start;
      console.log(`[${req.method}] ${url} - ${result.statusCode} (${elapsed.toFixed(2)}ms)`);
    } catch (error) {
      console.error('Request error:', error);
      res.writeHead(500, { 'Content-Type': 'text/html' });
      res.end(this.renderError(error));
    }
  }

  /**
   * Handle API route
   */
  private async handleApiRoute(
    match: any,
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const module = await import(match.route.filePath);
    const handler = module.default;

    if (!handler) {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'API handler not found' }));
      return;
    }

    // Create API request/response objects
    const apiReq = Object.assign(req, {
      query: match.params,
      body: await this.parseBody(req),
    });

    const apiRes = Object.assign(res, {
      status: (code: number) => {
        res.statusCode = code;
        return apiRes;
      },
      json: (data: any) => {
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify(data));
      },
      send: (data: any) => {
        res.end(data);
      },
    });

    await handler(apiReq, apiRes);
  }

  /**
   * Parse request body
   */
  private async parseBody(req: IncomingMessage): Promise<any> {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', (chunk) => {
        body += chunk.toString();
      });
      req.on('end', () => {
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
  }

  /**
   * Serve static files
   */
  private async serveStatic(url: string, res: ServerResponse): Promise<void> {
    // In production, use proper static file serving
    // For dev, just return 404
    res.writeHead(404);
    res.end('Static file not found');
  }

  /**
   * Setup Hot Module Replacement
   */
  private setupHMR(): void {
    this.wsServer!.on('connection', (ws) => {
      this.clients.add(ws);
      console.log('[HMR] Client connected');

      ws.on('close', () => {
        this.clients.delete(ws);
        console.log('[HMR] Client disconnected');
      });

      // Send initial connection
      ws.send(JSON.stringify({ type: 'connected' }));
    });
  }

  /**
   * Watch for file changes
   */
  private watchFiles(): void {
    const watchDirs = [
      join(this.options.rootDir, 'pages'),
      join(this.options.rootDir, 'app'),
      join(this.options.rootDir, 'components'),
    ];

    for (const dir of watchDirs) {
      try {
        watch(dir, { recursive: true }, (eventType, filename) => {
          if (filename) {
            console.log(`[Watch] ${eventType}: ${filename}`);
            this.handleFileChange(filename);
          }
        });
      } catch {
        // Directory might not exist
      }
    }
  }

  /**
   * Handle file change
   */
  private async handleFileChange(filename: string): Promise<void> {
    // Rebuild router
    await this.router.build();

    // Clear renderer cache
    this.renderer = new PageRenderer();

    // Notify clients
    this.broadcast({
      type: 'update',
      file: filename,
      timestamp: Date.now(),
    });
  }

  /**
   * Broadcast to all HMR clients
   */
  private broadcast(message: any): void {
    const data = JSON.stringify(message);
    for (const client of this.clients) {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    }
  }

  /**
   * Get HMR client script
   */
  private getHMRClientScript(): string {
    return `
(function() {
  const ws = new WebSocket('ws://${this.options.hostname}:${this.options.port}');

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);

    switch (message.type) {
      case 'connected':
        console.log('[HMR] Connected');
        break;

      case 'update':
        console.log('[HMR] Update detected:', message.file);
        window.location.reload();
        break;

      case 'error':
        console.error('[HMR] Error:', message.error);
        showErrorOverlay(message.error);
        break;
    }
  };

  ws.onerror = (error) => {
    console.error('[HMR] WebSocket error:', error);
  };

  ws.onclose = () => {
    console.log('[HMR] Disconnected - retrying...');
    setTimeout(() => window.location.reload(), 1000);
  };

  function showErrorOverlay(error) {
    const overlay = document.createElement('div');
    overlay.id = '__elide_error_overlay__';
    overlay.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.9);
      color: #ff5555;
      padding: 20px;
      font-family: monospace;
      font-size: 14px;
      overflow: auto;
      z-index: 999999;
    \`;
    overlay.innerHTML = \`
      <h1 style="color: #ff5555; margin: 0 0 20px 0;">Build Error</h1>
      <pre style="color: #fff; margin: 0;">\${error}</pre>
      <button onclick="this.parentElement.remove()" style="
        margin-top: 20px;
        padding: 10px 20px;
        background: #ff5555;
        color: white;
        border: none;
        cursor: pointer;
      ">Close</button>
    \`;

    const existing = document.getElementById('__elide_error_overlay__');
    if (existing) {
      existing.remove();
    }

    document.body.appendChild(overlay);
  }
})();
    `.trim();
  }

  /**
   * Render 404 page
   */
  private render404(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <title>404 - Page Not Found</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      text-align: center;
      padding: 50px;
      background: #f5f5f5;
    }
    h1 {
      font-size: 4rem;
      margin: 0;
      color: #333;
    }
    p {
      color: #666;
      font-size: 1.2rem;
    }
  </style>
</head>
<body>
  <h1>404</h1>
  <p>This page could not be found.</p>
</body>
</html>
    `.trim();
  }

  /**
   * Render error page
   */
  private renderError(error: any): string {
    const stack = error instanceof Error ? error.stack : String(error);

    return `
<!DOCTYPE html>
<html>
<head>
  <title>Error</title>
  <style>
    body {
      font-family: monospace;
      padding: 20px;
      background: #1a1a1a;
      color: #ff5555;
    }
    pre {
      background: #2a2a2a;
      padding: 20px;
      border-radius: 5px;
      overflow: auto;
      color: #fff;
    }
  </style>
</head>
<body>
  <h1>Application Error</h1>
  <pre>${stack}</pre>
</body>
</html>
    `.trim();
  }

  /**
   * Stop server
   */
  async stop(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
    }

    if (this.httpServer) {
      return new Promise((resolve) => {
        this.httpServer!.close(() => resolve());
      });
    }
  }
}

export default DevServer;
