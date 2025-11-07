/**
 * HTTP Server - Main entry point for HTTP server
 *
 * Provides an HTTP interface to the edge compute platform.
 */

import * as http from 'http';
import * as url from 'url';
import EdgeComputePlatform from './platform';

export interface ServerConfig {
  port: number;
  host: string;
  platformConfig?: any;
}

export class EdgeComputeServer {
  private server?: http.Server;
  private platform: EdgeComputePlatform;
  private config: ServerConfig;

  constructor(config: Partial<ServerConfig> = {}) {
    this.config = {
      port: config.port || parseInt(process.env.PORT || '3000'),
      host: config.host || process.env.HOST || '0.0.0.0',
      platformConfig: config.platformConfig || {},
    };

    this.platform = new EdgeComputePlatform(this.config.platformConfig);
  }

  /**
   * Start the HTTP server
   */
  async start(): Promise<void> {
    await this.platform.initialize();

    this.server = http.createServer(async (req, res) => {
      await this.handleRequest(req, res);
    });

    return new Promise((resolve) => {
      this.server!.listen(this.config.port, this.config.host, () => {
        const logger = this.platform.getLogger();
        logger.info(`Server started on ${this.config.host}:${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the HTTP server
   */
  async stop(): Promise<void> {
    if (this.server) {
      return new Promise((resolve, reject) => {
        this.server!.close((err) => {
          if (err) {
            reject(err);
          } else {
            this.platform.shutdown().then(resolve).catch(reject);
          }
        });
      });
    }
  }

  /**
   * Handle incoming HTTP request
   */
  private async handleRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    const startTime = Date.now();
    const logger = this.platform.getLogger();

    try {
      const parsedUrl = url.parse(req.url || '', true);
      const pathname = parsedUrl.pathname || '/';
      const query = parsedUrl.query as Record<string, string>;

      // Health check
      if (pathname === '/health') {
        return this.handleHealthCheck(req, res);
      }

      // Metrics endpoint
      if (pathname === '/metrics') {
        return this.handleMetrics(req, res);
      }

      // Deployment endpoint
      if (pathname === '/deploy' && req.method === 'POST') {
        return this.handleDeploy(req, res);
      }

      // Status endpoint
      if (pathname === '/status') {
        return this.handleStatus(req, res);
      }

      // Parse request body
      const body = await this.parseBody(req);

      // Invoke function
      const response = await this.platform.invoke({
        path: pathname,
        method: req.method || 'GET',
        headers: req.headers as Record<string, string>,
        query,
        body,
        ip: this.getClientIp(req),
      });

      // Set response headers
      res.statusCode = response.statusCode;
      for (const [key, value] of Object.entries(response.headers)) {
        res.setHeader(key, value);
      }

      // Send response
      const responseBody =
        typeof response.body === 'string'
          ? response.body
          : JSON.stringify(response.body);

      res.end(responseBody);

      // Log request
      const duration = Date.now() - startTime;
      logger.logRequest(req.method || 'GET', pathname, response.statusCode, duration, {
        cached: response.cached,
        executionTime: response.executionTime,
      });
    } catch (error: any) {
      logger.error('Request handling failed', error, {
        url: req.url,
        method: req.method,
      });

      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Internal Server Error',
          message: error.message,
        })
      );
    }
  }

  /**
   * Handle health check request
   */
  private handleHealthCheck(req: http.IncomingMessage, res: http.ServerResponse): void {
    const status = this.platform.getStatus();

    res.statusCode = status.status === 'healthy' ? 200 : 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(
      JSON.stringify({
        status: status.status,
        uptime: status.uptime,
        timestamp: new Date().toISOString(),
      })
    );
  }

  /**
   * Handle metrics request
   */
  private handleMetrics(req: http.IncomingMessage, res: http.ServerResponse): void {
    const metrics = this.platform.getMetrics();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'text/plain; version=0.0.4');
    res.end(metrics.exportPrometheus());
  }

  /**
   * Handle deploy request
   */
  private async handleDeploy(
    req: http.IncomingMessage,
    res: http.ServerResponse
  ): Promise<void> {
    try {
      const body = await this.parseBody(req);

      if (!body || !body.name || !body.code || !body.runtime) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(
          JSON.stringify({
            error: 'Bad Request',
            message: 'Missing required fields: name, code, runtime',
          })
        );
        return;
      }

      const result = await this.platform.deploy(body);

      res.statusCode = 201;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(result));
    } catch (error: any) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(
        JSON.stringify({
          error: 'Deployment Failed',
          message: error.message,
        })
      );
    }
  }

  /**
   * Handle status request
   */
  private handleStatus(req: http.IncomingMessage, res: http.ServerResponse): void {
    const status = this.platform.getStatus();

    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(status, null, 2));
  }

  /**
   * Parse request body
   */
  private async parseBody(req: http.IncomingMessage): Promise<any> {
    return new Promise((resolve, reject) => {
      let body = '';

      req.on('data', (chunk) => {
        body += chunk.toString();
      });

      req.on('end', () => {
        if (!body) {
          resolve(null);
          return;
        }

        const contentType = req.headers['content-type'] || '';

        if (contentType.includes('application/json')) {
          try {
            resolve(JSON.parse(body));
          } catch (error) {
            reject(new Error('Invalid JSON'));
          }
        } else {
          resolve(body);
        }
      });

      req.on('error', reject);
    });
  }

  /**
   * Get client IP address
   */
  private getClientIp(req: http.IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }

    return req.socket.remoteAddress || 'unknown';
  }
}

// Main entry point
if (require.main === module) {
  const server = new EdgeComputeServer();

  server
    .start()
    .then(() => {
      console.log('Edge Compute Server is running');
    })
    .catch((error) => {
      console.error('Failed to start server:', error);
      process.exit(1);
    });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });

  process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await server.stop();
    process.exit(0);
  });
}

export default EdgeComputeServer;
