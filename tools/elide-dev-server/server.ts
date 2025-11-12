/**
 * Elide Development Server
 *
 * A high-performance development server with hot reload for all languages.
 * Features:
 * - Sub-20ms hot reload
 * - WebSocket-based live reload
 * - Source map support
 * - Error overlays
 * - Multi-language support (TypeScript, Python, Ruby, Java)
 */

import { createServer, IncomingMessage, ServerResponse } from "http";
import { FileWatcher } from "./watcher";
import { ReloadManager } from "./reload-manager";
import { ErrorOverlay } from "./error-overlay";
import { Debugger } from "./debugger";
import { Profiler } from "./profiler";

interface ServerConfig {
  port?: number;
  host?: string;
  root?: string;
  watchPatterns?: string[];
  hotReload?: boolean;
  sourceMap?: boolean;
  errorOverlay?: boolean;
  debug?: boolean;
  profile?: boolean;
}

interface WebSocketClient {
  id: string;
  send: (data: string) => void;
  close: () => void;
}

export class ElideDevServer {
  private config: Required<ServerConfig>;
  private server: any;
  private watcher: FileWatcher;
  private reloadManager: ReloadManager;
  private errorOverlay: ErrorOverlay;
  private debugger: Debugger;
  private profiler: Profiler;
  private clients: Set<WebSocketClient> = new Set();
  private startTime: number = 0;
  private requestCount: number = 0;

  constructor(config: ServerConfig = {}) {
    this.config = {
      port: config.port || 3000,
      host: config.host || "localhost",
      root: config.root || process.cwd(),
      watchPatterns: config.watchPatterns || ["**/*.{ts,js,py,rb,java}"],
      hotReload: config.hotReload ?? true,
      sourceMap: config.sourceMap ?? true,
      errorOverlay: config.errorOverlay ?? true,
      debug: config.debug ?? false,
      profile: config.profile ?? false,
    };

    this.reloadManager = new ReloadManager(this.config.root);
    this.errorOverlay = new ErrorOverlay();
    this.debugger = new Debugger(this.config.debug);
    this.profiler = new Profiler(this.config.profile);

    this.watcher = new FileWatcher({
      root: this.config.root,
      patterns: this.config.watchPatterns,
      onChange: this.handleFileChange.bind(this),
      debounceMs: 50,
    });
  }

  /**
   * Start the development server
   */
  async start(): Promise<void> {
    this.startTime = Date.now();

    // Create HTTP server
    this.server = createServer(this.handleRequest.bind(this));

    // Start file watcher
    await this.watcher.start();

    // Start server
    await new Promise<void>((resolve) => {
      this.server.listen(this.config.port, this.config.host, () => {
        resolve();
      });
    });

    console.log(`🚀 Elide Dev Server started at http://${this.config.host}:${this.config.port}`);
    console.log(`📁 Watching: ${this.config.root}`);
    console.log(`🔥 Hot reload: ${this.config.hotReload ? "enabled" : "disabled"}`);
    console.log(`🗺️  Source maps: ${this.config.sourceMap ? "enabled" : "disabled"}`);
    console.log(`🐛 Debug mode: ${this.config.debug ? "enabled" : "disabled"}`);
    console.log(`📊 Profiling: ${this.config.profile ? "enabled" : "disabled"}`);
  }

  /**
   * Stop the development server
   */
  async stop(): Promise<void> {
    await this.watcher.stop();

    // Close all WebSocket connections
    for (const client of this.clients) {
      client.close();
    }
    this.clients.clear();

    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server.close(() => resolve());
      });
    }

    console.log("✅ Server stopped");
  }

  /**
   * Handle HTTP requests
   */
  private async handleRequest(req: IncomingMessage, res: ServerResponse): Promise<void> {
    const startTime = performance.now();
    this.requestCount++;

    try {
      const url = req.url || "/";
      const method = req.method || "GET";

      // Handle WebSocket upgrade
      if (url === "/__ws" && req.headers.upgrade === "websocket") {
        this.handleWebSocketUpgrade(req, res);
        return;
      }

      // Handle special dev server endpoints
      if (url.startsWith("/__elide")) {
        await this.handleDevEndpoint(url, req, res);
        return;
      }

      // Handle static files
      if (url.startsWith("/__error-overlay")) {
        this.serveErrorOverlay(res);
        return;
      }

      // Inject hot reload script if HTML
      if (url.endsWith(".html") || url === "/") {
        await this.serveHTMLWithHotReload(url, res);
        return;
      }

      // Default response
      this.sendJSON(res, 200, {
        message: "Elide Dev Server",
        uptime: Date.now() - this.startTime,
        requests: this.requestCount,
        hotReload: this.config.hotReload,
        watching: this.watcher.getWatchedFiles().length,
      });

    } catch (error) {
      await this.handleError(error, req, res);
    } finally {
      const duration = performance.now() - startTime;
      if (this.config.profile) {
        this.profiler.recordRequest(req.url || "/", duration);
      }
    }
  }

  /**
   * Handle file changes
   */
  private async handleFileChange(filePath: string): Promise<void> {
    const reloadStart = performance.now();

    try {
      console.log(`📝 File changed: ${filePath}`);

      // Analyze dependencies
      const affectedModules = await this.reloadManager.getAffectedModules(filePath);

      console.log(`🔄 Reloading ${affectedModules.length} module(s)...`);

      // Reload modules
      const reloaded = await this.reloadManager.reloadModules(affectedModules);

      const reloadTime = performance.now() - reloadStart;
      console.log(`✅ Hot reload completed in ${reloadTime.toFixed(2)}ms`);

      // Notify all connected clients
      this.broadcast({
        type: "hot-reload",
        files: affectedModules,
        reloaded: reloaded.length,
        duration: reloadTime,
        timestamp: Date.now(),
      });

    } catch (error) {
      console.error("❌ Hot reload failed:", error);

      // Send error to clients
      this.broadcast({
        type: "error",
        error: this.formatError(error),
        timestamp: Date.now(),
      });
    }
  }

  /**
   * Handle WebSocket upgrade
   */
  private handleWebSocketUpgrade(req: IncomingMessage, res: ServerResponse): void {
    // Simple WebSocket handshake (production would use ws library)
    const key = req.headers["sec-websocket-key"];
    const accept = this.generateWebSocketAccept(key || "");

    res.writeHead(101, {
      "Upgrade": "websocket",
      "Connection": "Upgrade",
      "Sec-WebSocket-Accept": accept,
    });

    const clientId = `client-${Date.now()}-${Math.random()}`;

    const client: WebSocketClient = {
      id: clientId,
      send: (data: string) => {
        try {
          res.write(this.encodeWebSocketFrame(data));
        } catch (e) {
          console.error("Failed to send to client:", e);
        }
      },
      close: () => {
        this.clients.delete(client);
        console.log(`🔌 Client disconnected: ${clientId} (${this.clients.size} remaining)`);
      },
    };

    this.clients.add(client);
    console.log(`🔌 Client connected: ${clientId} (${this.clients.size} total)`);

    // Send welcome message
    client.send(JSON.stringify({
      type: "connected",
      clientId,
      server: "Elide Dev Server",
      features: {
        hotReload: this.config.hotReload,
        errorOverlay: this.config.errorOverlay,
        debug: this.config.debug,
      },
    }));
  }

  /**
   * Handle dev server endpoints
   */
  private async handleDevEndpoint(url: string, req: IncomingMessage, res: ServerResponse): Promise<void> {
    if (url === "/__elide/status") {
      this.sendJSON(res, 200, {
        uptime: Date.now() - this.startTime,
        requests: this.requestCount,
        clients: this.clients.size,
        watching: this.watcher.getWatchedFiles().length,
        memory: process.memoryUsage(),
      });
    } else if (url === "/__elide/profile") {
      this.sendJSON(res, 200, this.profiler.getReport());
    } else if (url === "/__elide/debug") {
      this.sendJSON(res, 200, this.debugger.getState());
    } else {
      this.sendJSON(res, 404, { error: "Endpoint not found" });
    }
  }

  /**
   * Serve HTML with hot reload script injected
   */
  private async serveHTMLWithHotReload(url: string, res: ServerResponse): Promise<void> {
    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Elide Dev Server</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      max-width: 800px;
      margin: 50px auto;
      padding: 20px;
      line-height: 1.6;
    }
    .status {
      padding: 15px;
      background: #f0f9ff;
      border-left: 4px solid #0ea5e9;
      margin: 20px 0;
      border-radius: 4px;
    }
    .connected {
      color: #059669;
      font-weight: bold;
    }
    .feature {
      display: inline-block;
      padding: 4px 12px;
      background: #f3f4f6;
      border-radius: 12px;
      margin: 4px;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <h1>🚀 Elide Dev Server</h1>
  <div class="status">
    <p>Status: <span class="connected" id="status">Connecting...</span></p>
    <p>Port: ${this.config.port}</p>
    <p>Root: ${this.config.root}</p>
  </div>

  <h2>Features</h2>
  <div>
    <span class="feature">🔥 Hot Reload</span>
    <span class="feature">🗺️ Source Maps</span>
    <span class="feature">🐛 Debugger</span>
    <span class="feature">📊 Profiler</span>
    <span class="feature">🎨 Error Overlay</span>
  </div>

  <h2>Supported Languages</h2>
  <ul>
    <li>TypeScript / JavaScript</li>
    <li>Python</li>
    <li>Ruby</li>
    <li>Java</li>
  </ul>

  ${this.getHotReloadScript()}
</body>
</html>
    `;

    res.writeHead(200, {
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(html),
    });
    res.end(html);
  }

  /**
   * Serve error overlay
   */
  private serveErrorOverlay(res: ServerResponse): void {
    const overlay = this.errorOverlay.getOverlayHTML();
    res.writeHead(200, {
      "Content-Type": "text/html",
      "Content-Length": Buffer.byteLength(overlay),
    });
    res.end(overlay);
  }

  /**
   * Get hot reload script to inject into HTML
   */
  private getHotReloadScript(): string {
    if (!this.config.hotReload) return "";

    return `
<script>
(function() {
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const ws = new WebSocket(protocol + '//' + window.location.host + '/__ws');
  let reconnectAttempts = 0;
  const maxReconnectAttempts = 5;

  ws.onopen = function() {
    console.log('🔥 Hot reload connected');
    reconnectAttempts = 0;
    const status = document.getElementById('status');
    if (status) status.textContent = 'Connected ✓';
  };

  ws.onmessage = function(event) {
    const data = JSON.parse(event.data);
    console.log('📨 Hot reload message:', data);

    if (data.type === 'hot-reload') {
      console.log('🔄 Reloading page...');
      setTimeout(() => window.location.reload(), 100);
    } else if (data.type === 'error') {
      console.error('❌ Server error:', data.error);
      showErrorOverlay(data.error);
    }
  };

  ws.onerror = function(error) {
    console.error('❌ WebSocket error:', error);
  };

  ws.onclose = function() {
    console.log('🔌 Hot reload disconnected');
    const status = document.getElementById('status');
    if (status) status.textContent = 'Disconnected ✗';

    if (reconnectAttempts < maxReconnectAttempts) {
      reconnectAttempts++;
      console.log(\`🔄 Reconnecting (attempt \${reconnectAttempts}/\${maxReconnectAttempts})...\`);
      setTimeout(() => window.location.reload(), 1000 * reconnectAttempts);
    }
  };

  function showErrorOverlay(error) {
    const overlay = document.createElement('div');
    overlay.id = 'elide-error-overlay';
    overlay.innerHTML = \`
      <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.9); z-index: 999999; padding: 40px; overflow: auto; font-family: monospace;">
        <div style="max-width: 800px; margin: 0 auto; background: #1e1e1e; padding: 30px; border-radius: 8px; color: #d4d4d4;">
          <h2 style="color: #f87171; margin-top: 0;">⚠️ Build Error</h2>
          <pre style="background: #2d2d2d; padding: 20px; border-radius: 4px; overflow-x: auto; color: #f87171;">\${error.message || error}</pre>
          <button onclick="document.getElementById('elide-error-overlay').remove()" style="margin-top: 20px; padding: 10px 20px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;">Dismiss</button>
        </div>
      </div>
    \`;
    document.body.appendChild(overlay);
  }
})();
</script>
    `;
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(data: any): void {
    const message = JSON.stringify(data);
    for (const client of this.clients) {
      client.send(message);
    }
  }

  /**
   * Handle errors
   */
  private async handleError(error: any, req: IncomingMessage, res: ServerResponse): Promise<void> {
    console.error("❌ Server error:", error);

    const errorInfo = this.formatError(error);

    if (this.config.errorOverlay) {
      const overlay = this.errorOverlay.generateErrorHTML(errorInfo);
      res.writeHead(500, { "Content-Type": "text/html" });
      res.end(overlay);
    } else {
      this.sendJSON(res, 500, { error: errorInfo });
    }
  }

  /**
   * Format error for display
   */
  private formatError(error: any): any {
    return {
      message: error.message || String(error),
      stack: error.stack || "",
      type: error.constructor?.name || "Error",
    };
  }

  /**
   * Send JSON response
   */
  private sendJSON(res: ServerResponse, status: number, data: any): void {
    const json = JSON.stringify(data, null, 2);
    res.writeHead(status, {
      "Content-Type": "application/json",
      "Content-Length": Buffer.byteLength(json),
    });
    res.end(json);
  }

  /**
   * Generate WebSocket accept key
   */
  private generateWebSocketAccept(key: string): string {
    // Note: This is a simplified implementation
    // Production would use proper SHA-1 hashing
    return Buffer.from(key + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11")
      .toString("base64")
      .substring(0, 28);
  }

  /**
   * Encode WebSocket frame
   */
  private encodeWebSocketFrame(data: string): Buffer {
    // Simplified WebSocket frame encoding
    const payload = Buffer.from(data);
    const frame = Buffer.allocUnsafe(payload.length + 2);
    frame[0] = 0x81; // FIN + text frame
    frame[1] = payload.length;
    payload.copy(frame, 2);
    return frame;
  }
}

// CLI demo
if (import.meta.url.includes("server.ts")) {
  console.log("🚀 Starting Elide Development Server\n");

  const server = new ElideDevServer({
    port: 3000,
    hotReload: true,
    sourceMap: true,
    errorOverlay: true,
    debug: false,
    profile: true,
  });

  server.start().then(() => {
    console.log("\n✅ Server is ready!");
    console.log("Press Ctrl+C to stop\n");
  });

  // Graceful shutdown
  process.on("SIGINT", async () => {
    console.log("\n\n🛑 Shutting down...");
    await server.stop();
    process.exit(0);
  });

  process.on("SIGTERM", async () => {
    await server.stop();
    process.exit(0);
  });
}
