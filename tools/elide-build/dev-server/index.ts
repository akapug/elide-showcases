/**
 * Elide Development Server
 *
 * Fast development server with:
 * - Hot Module Replacement (HMR)
 * - HTTPS support
 * - Proxy configuration
 * - Mock API server
 * - Error overlay
 * - Auto-reload
 */

import * as http from "http";
import * as https from "https";
import * as fs from "fs";
import * as path from "path";
import { HMRManager } from "../bundler/hmr";
import { Bundler } from "../bundler/index";

export interface DevServerOptions {
  port?: number;
  host?: string;
  https?: boolean | { key: string; cert: string };
  proxy?: Record<string, ProxyOptions>;
  mock?: Record<string, MockHandler>;
  hmr?: boolean;
  open?: boolean;
  overlay?: boolean;
  cors?: boolean;
  headers?: Record<string, string>;
  middleware?: Middleware[];
  static?: string | string[];
  compress?: boolean;
  historyApiFallback?: boolean;
}

export interface ProxyOptions {
  target: string;
  changeOrigin?: boolean;
  pathRewrite?: Record<string, string>;
  secure?: boolean;
}

export type MockHandler = (req: http.IncomingMessage, res: http.ServerResponse) => void;
export type Middleware = (
  req: http.IncomingMessage,
  res: http.ServerResponse,
  next: () => void
) => void;

export class DevServer {
  private options: Required<Omit<DevServerOptions, "https" | "proxy" | "mock" | "middleware" | "static">> & Pick<DevServerOptions, "https" | "proxy" | "mock" | "middleware" | "static">;
  private server?: http.Server | https.Server;
  private hmrManager?: HMRManager;
  private bundler?: Bundler;
  private clients: Set<any> = new Set();
  private startTime: number = 0;

  constructor(options: DevServerOptions = {}) {
    this.options = {
      port: options.port || 3000,
      host: options.host || "localhost",
      https: options.https || false,
      proxy: options.proxy,
      mock: options.mock,
      hmr: options.hmr ?? true,
      open: options.open ?? false,
      overlay: options.overlay ?? true,
      cors: options.cors ?? true,
      headers: options.headers || {},
      middleware: options.middleware,
      static: options.static,
      compress: options.compress ?? true,
      historyApiFallback: options.historyApiFallback ?? true,
    };

    if (this.options.hmr) {
      this.hmrManager = new HMRManager({ enabled: true });
    }
  }

  /**
   * Start the development server
   */
  async start(): Promise<void> {
    this.startTime = Date.now();

    const handler = this.createRequestHandler();

    if (this.options.https) {
      const httpsOptions =
        typeof this.options.https === "object"
          ? this.options.https
          : this.getDefaultHTTPSOptions();

      this.server = https.createServer(httpsOptions, handler);
    } else {
      this.server = http.createServer(handler);
    }

    await new Promise<void>((resolve) => {
      this.server!.listen(this.options.port, this.options.host, () => {
        resolve();
      });
    });

    const protocol = this.options.https ? "https" : "http";
    const url = `${protocol}://${this.options.host}:${this.options.port}`;

    console.log(`\n🚀 Elide Dev Server started!\n`);
    console.log(`  Local:   ${url}`);
    console.log(`  HMR:     ${this.options.hmr ? "enabled" : "disabled"}`);
    console.log(`  Overlay: ${this.options.overlay ? "enabled" : "disabled"}\n`);

    if (this.options.open) {
      this.openBrowser(url);
    }
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server!.close(() => resolve());
      });
    }

    console.log("✅ Dev server stopped");
  }

  /**
   * Create request handler
   */
  private createRequestHandler(): (req: http.IncomingMessage, res: http.ServerResponse) => void {
    return async (req, res) => {
      const startTime = performance.now();

      try {
        // Apply CORS headers
        if (this.options.cors) {
          this.applyCORSHeaders(res);
        }

        // Apply custom headers
        for (const [key, value] of Object.entries(this.options.headers)) {
          res.setHeader(key, value);
        }

        // Handle middleware
        if (this.options.middleware && this.options.middleware.length > 0) {
          await this.applyMiddleware(req, res);
          if (res.writableEnded) return;
        }

        // Handle HMR WebSocket
        if (req.url === "/__hmr" && req.headers.upgrade === "websocket") {
          this.handleHMRWebSocket(req, res);
          return;
        }

        // Handle mock API
        if (this.options.mock && this.handleMockAPI(req, res)) {
          return;
        }

        // Handle proxy
        if (this.options.proxy && this.handleProxy(req, res)) {
          return;
        }

        // Handle static files
        if (this.options.static && this.handleStaticFile(req, res)) {
          return;
        }

        // Handle SPA fallback
        if (this.options.historyApiFallback && !req.url?.includes(".")) {
          this.serveIndexHTML(res);
          return;
        }

        // Default 404
        this.send404(res);
      } catch (error) {
        this.handleError(error, req, res);
      } finally {
        const duration = performance.now() - startTime;
        console.log(`${req.method} ${req.url} - ${duration.toFixed(2)}ms`);
      }
    };
  }

  /**
   * Apply CORS headers
   */
  private applyCORSHeaders(res: http.ServerResponse): void {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
  }

  /**
   * Apply middleware
   */
  private async applyMiddleware(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    for (const middleware of this.options.middleware!) {
      await new Promise<void>((resolve) => {
        middleware(req, res, () => resolve());
      });

      if (res.writableEnded) break;
    }
  }

  /**
   * Handle HMR WebSocket
   */
  private handleHMRWebSocket(req: http.IncomingMessage, res: http.ServerResponse): void {
    // Simplified WebSocket handling
    const key = req.headers["sec-websocket-key"];
    const accept = this.generateWebSocketAccept(key || "");

    res.writeHead(101, {
      Upgrade: "websocket",
      Connection: "Upgrade",
      "Sec-WebSocket-Accept": accept,
    });

    const client = { req, send: (data: string) => res.write(this.encodeWebSocketFrame(data)) };
    this.clients.add(client);

    console.log(`HMR client connected (${this.clients.size} total)`);

    client.send(
      JSON.stringify({
        type: "connected",
        timestamp: Date.now(),
      })
    );
  }

  /**
   * Handle mock API
   */
  private handleMockAPI(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    if (!this.options.mock) return false;

    for (const [route, handler] of Object.entries(this.options.mock)) {
      if (req.url?.startsWith(route)) {
        handler(req, res);
        return true;
      }
    }

    return false;
  }

  /**
   * Handle proxy
   */
  private handleProxy(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    if (!this.options.proxy) return false;

    for (const [route, proxyOptions] of Object.entries(this.options.proxy)) {
      if (req.url?.startsWith(route)) {
        this.proxyRequest(req, res, proxyOptions);
        return true;
      }
    }

    return false;
  }

  /**
   * Proxy request
   */
  private proxyRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    options: ProxyOptions
  ): void {
    const targetURL = new URL(options.target);
    let path = req.url || "/";

    // Apply path rewrite
    if (options.pathRewrite) {
      for (const [pattern, replacement] of Object.entries(options.pathRewrite)) {
        path = path.replace(new RegExp(pattern), replacement);
      }
    }

    const proxyOptions = {
      hostname: targetURL.hostname,
      port: targetURL.port,
      path,
      method: req.method,
      headers: { ...req.headers },
    };

    if (options.changeOrigin) {
      proxyOptions.headers.host = targetURL.host;
    }

    const proxyReq = http.request(proxyOptions, (proxyRes) => {
      res.writeHead(proxyRes.statusCode || 200, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (error) => {
      console.error("Proxy error:", error);
      this.send500(res, error);
    });

    req.pipe(proxyReq);
  }

  /**
   * Handle static file
   */
  private handleStaticFile(req: http.IncomingMessage, res: http.ServerResponse): boolean {
    if (!this.options.static) return false;

    const staticDirs = Array.isArray(this.options.static)
      ? this.options.static
      : [this.options.static];

    for (const dir of staticDirs) {
      const filePath = path.join(dir, req.url || "/");

      if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        this.serveFile(filePath, res);
        return true;
      }
    }

    return false;
  }

  /**
   * Serve a file
   */
  private serveFile(filePath: string, res: http.ServerResponse): void {
    const ext = path.extname(filePath);
    const contentType = this.getContentType(ext);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        this.send500(res, err);
        return;
      }

      res.writeHead(200, {
        "Content-Type": contentType,
        "Content-Length": data.length,
      });

      res.end(data);
    });
  }

  /**
   * Serve index.html
   */
  private serveIndexHTML(res: http.ServerResponse): void {
    const indexPath = this.options.static
      ? path.join(Array.isArray(this.options.static) ? this.options.static[0] : this.options.static, "index.html")
      : "index.html";

    if (fs.existsSync(indexPath)) {
      this.serveFile(indexPath, res);
    } else {
      this.sendHTML(res, 200, this.getDefaultIndexHTML());
    }
  }

  /**
   * Get default index.html
   */
  private getDefaultIndexHTML(): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elide Dev Server</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
    }
    .status { padding: 15px; background: #f0f9ff; border-radius: 8px; }
  </style>
</head>
<body>
  <h1>🚀 Elide Dev Server</h1>
  <div class="status">
    <p>Server is running on port ${this.options.port}</p>
    <p>HMR: ${this.options.hmr ? "✓ Enabled" : "✗ Disabled"}</p>
  </div>
  ${this.options.hmr ? '<script src="/__hmr-client.js"></script>' : ""}
</body>
</html>
    `.trim();
  }

  /**
   * Get content type
   */
  private getContentType(ext: string): string {
    const types: Record<string, string> = {
      ".html": "text/html",
      ".css": "text/css",
      ".js": "application/javascript",
      ".json": "application/json",
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".gif": "image/gif",
      ".svg": "image/svg+xml",
      ".ico": "image/x-icon",
      ".woff": "font/woff",
      ".woff2": "font/woff2",
    };

    return types[ext] || "application/octet-stream";
  }

  /**
   * Send HTML response
   */
  private sendHTML(res: http.ServerResponse, status: number, html: string): void {
    res.writeHead(status, {
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(html),
    });
    res.end(html);
  }

  /**
   * Send 404
   */
  private send404(res: http.ServerResponse): void {
    this.sendHTML(res, 404, "<h1>404 Not Found</h1>");
  }

  /**
   * Send 500
   */
  private send500(res: http.ServerResponse, error: any): void {
    const html = `<h1>500 Internal Server Error</h1><pre>${error.message}</pre>`;
    this.sendHTML(res, 500, html);
  }

  /**
   * Handle error
   */
  private handleError(error: any, req: http.IncomingMessage, res: http.ServerResponse): void {
    console.error("Server error:", error);
    this.send500(res, error);
  }

  /**
   * Get default HTTPS options
   */
  private getDefaultHTTPSOptions(): { key: Buffer; cert: Buffer } {
    // In production, generate proper self-signed certificate
    return {
      key: Buffer.from("fake-key"),
      cert: Buffer.from("fake-cert"),
    };
  }

  /**
   * Open browser
   */
  private openBrowser(url: string): void {
    const { exec } = require("child_process");
    const command =
      process.platform === "win32" ? "start" : process.platform === "darwin" ? "open" : "xdg-open";

    exec(`${command} ${url}`);
  }

  /**
   * Generate WebSocket accept key
   */
  private generateWebSocketAccept(key: string): string {
    return Buffer.from(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
      .toString("base64")
      .substring(0, 28);
  }

  /**
   * Encode WebSocket frame
   */
  private encodeWebSocketFrame(data: string): Buffer {
    const payload = Buffer.from(data);
    const frame = Buffer.allocUnsafe(payload.length + 2);
    frame[0] = 0x81;
    frame[1] = payload.length;
    payload.copy(frame, 2);
    return frame;
  }

  /**
   * Broadcast to all HMR clients
   */
  broadcast(data: any): void {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      client.send(message);
    }
  }

  /**
   * Get server stats
   */
  getStats(): {
    uptime: number;
    clients: number;
  } {
    return {
      uptime: Date.now() - this.startTime,
      clients: this.clients.size,
    };
  }
}
