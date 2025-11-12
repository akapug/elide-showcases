/**
 * HTTP Router for Elide Cloud
 *
 * Handles HTTP/HTTPS routing, load balancing, and SSL termination
 */

import { createServer, IncomingMessage, ServerResponse } from 'http';
import { Logger, generateId } from '../core/utils.ts';
import type { Application, Domain, Route, Dyno } from '../core/types.ts';
import { db } from '../database/database.ts';

const logger = new Logger('Router');

// =============================================================================
// Load Balancer
// =============================================================================

export class LoadBalancer {
  private currentIndex: Map<string, number> = new Map();

  /**
   * Select a dyno using round-robin algorithm
   */
  selectDyno(dynos: Dyno[], algorithm: 'round_robin' | 'least_connections' | 'ip_hash' = 'round_robin'): Dyno | null {
    if (dynos.length === 0) return null;

    switch (algorithm) {
      case 'round_robin':
        return this.roundRobin(dynos);

      case 'least_connections':
        return this.leastConnections(dynos);

      case 'ip_hash':
        return this.ipHash(dynos);

      default:
        return this.roundRobin(dynos);
    }
  }

  private roundRobin(dynos: Dyno[]): Dyno {
    const key = dynos.map(d => d.id).join(',');
    const currentIndex = this.currentIndex.get(key) || 0;
    const selectedDyno = dynos[currentIndex];

    this.currentIndex.set(key, (currentIndex + 1) % dynos.length);

    return selectedDyno;
  }

  private leastConnections(dynos: Dyno[]): Dyno {
    // Sort by active connections (simulated via state.requests)
    return dynos.reduce((min, dyno) =>
      dyno.state.requests < min.state.requests ? dyno : min
    , dynos[0]);
  }

  private ipHash(dynos: Dyno[]): Dyno {
    // Simple hash-based selection
    const hash = Date.now() % dynos.length;
    return dynos[hash];
  }
}

// =============================================================================
// SSL Manager
// =============================================================================

export class SSLManager {
  /**
   * Get SSL certificate for domain
   */
  async getCertificate(domain: string): Promise<{
    cert: string;
    key: string;
  } | null> {
    logger.info(`Getting SSL certificate for ${domain}`);

    // In real implementation, this would:
    // 1. Check if certificate exists in database
    // 2. If not, provision via Let's Encrypt
    // 3. Store and return certificate

    return {
      cert: '-----BEGIN CERTIFICATE-----\n...\n-----END CERTIFICATE-----',
      key: '-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----',
    };
  }

  /**
   * Auto-renew certificates
   */
  async autoRenewCertificates(): Promise<void> {
    const domains = Array.from(db.domains.values());
    const now = new Date();

    for (const domain of domains) {
      if (domain.sslCert) {
        const daysUntilExpiry = Math.floor(
          (domain.sslCert.expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
        );

        // Renew if expiring in less than 30 days
        if (daysUntilExpiry < 30) {
          logger.info(`Renewing certificate for ${domain.hostname}`);
          await this.getCertificate(domain.hostname);
        }
      }
    }
  }
}

// =============================================================================
// Request Router
// =============================================================================

export class RequestRouter {
  private loadBalancer: LoadBalancer;
  private sslManager: SSLManager;

  constructor() {
    this.loadBalancer = new LoadBalancer();
    this.sslManager = new SSLManager();

    // Start auto-renewal
    setInterval(() => {
      this.sslManager.autoRenewCertificates();
    }, 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Route incoming request to appropriate application
   */
  async routeRequest(
    req: IncomingMessage,
    res: ServerResponse
  ): Promise<void> {
    const hostname = req.headers.host?.split(':')[0] || '';

    // Find domain
    const domain = this.findDomain(hostname);

    if (!domain) {
      this.sendError(res, 404, 'Application not found');
      return;
    }

    // Get application
    const application = db.getApplicationById(domain.applicationId);

    if (!application) {
      this.sendError(res, 404, 'Application not found');
      return;
    }

    // Check maintenance mode
    if (application.maintenance) {
      this.sendMaintenance(res);
      return;
    }

    // Get running dynos for web process
    const dynos = db.getDynosByApplication(application.id)
      .filter(d => d.processType === 'web' && d.status === 'running');

    if (dynos.length === 0) {
      this.sendError(res, 503, 'Service temporarily unavailable');
      return;
    }

    // Select dyno using load balancer
    const dyno = this.loadBalancer.selectDyno(dynos);

    if (!dyno) {
      this.sendError(res, 503, 'No available dynos');
      return;
    }

    // Forward request to dyno
    await this.forwardRequest(req, res, dyno);

    // Log request
    db.addLog({
      applicationId: application.id,
      processId: dyno.id,
      timestamp: new Date(),
      source: 'router',
      level: 'info',
      message: `${req.method} ${req.url} -> ${dyno.id}`,
      metadata: {
        hostname,
        method: req.method,
        url: req.url,
        dynoId: dyno.id,
      },
    });

    // Update metrics
    db.addMetric({
      applicationId: application.id,
      timestamp: new Date(),
      type: 'requests',
      value: 1,
      unit: 'count',
      dimensions: {
        hostname,
        method: req.method || 'GET',
        dynoId: dyno.id,
      },
    });

    // Update dyno state
    db.updateDyno(dyno.id, {
      state: {
        ...dyno.state,
        requests: dyno.state.requests + 1,
      },
    });
  }

  /**
   * Find domain by hostname
   */
  private findDomain(hostname: string): Domain | undefined {
    // Check exact match
    let domain = Array.from(db.domains.values())
      .find(d => d.hostname === hostname && d.status === 'verified');

    if (domain) return domain;

    // Check for default elide-cloud.io domain
    const appSlug = hostname.replace('.elide-cloud.io', '');
    const application = db.getApplicationBySlug(appSlug);

    if (application) {
      // Return synthetic domain
      return {
        id: generateId('dmn'),
        applicationId: application.id,
        hostname,
        kind: 'elide',
        status: 'verified',
        cname: hostname,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }

    return undefined;
  }

  /**
   * Forward request to dyno
   */
  private async forwardRequest(
    req: IncomingMessage,
    res: ServerResponse,
    dyno: Dyno
  ): Promise<void> {
    // In real implementation, this would:
    // 1. Create a connection to the dyno's container
    // 2. Forward the HTTP request
    // 3. Stream the response back

    // Simulated response
    const responseBody = JSON.stringify({
      message: 'Hello from Elide Cloud!',
      dyno: dyno.id,
      processType: dyno.processType,
      size: dyno.size,
      uptime: dyno.state.uptime,
    });

    res.writeHead(200, {
      'Content-Type': 'application/json',
      'X-Dyno-ID': dyno.id,
      'X-Process-Type': dyno.processType,
    });
    res.end(responseBody);
  }

  /**
   * Send error response
   */
  private sendError(res: ServerResponse, statusCode: number, message: string): void {
    res.writeHead(statusCode, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: message,
      statusCode,
    }));
  }

  /**
   * Send maintenance page
   */
  private sendMaintenance(res: ServerResponse): void {
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Maintenance</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              margin: 0;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
            }
            .container {
              text-align: center;
            }
            h1 {
              font-size: 48px;
              margin-bottom: 16px;
            }
            p {
              font-size: 20px;
              opacity: 0.9;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1>Under Maintenance</h1>
            <p>We'll be back soon!</p>
          </div>
        </body>
      </html>
    `;

    res.writeHead(503, { 'Content-Type': 'text/html' });
    res.end(html);
  }
}

// =============================================================================
// WebSocket Router
// =============================================================================

export class WebSocketRouter {
  /**
   * Route WebSocket connection
   */
  async routeWebSocket(
    hostname: string,
    path: string
  ): Promise<Dyno | null> {
    // Find application by hostname
    const domain = Array.from(db.domains.values())
      .find(d => d.hostname === hostname);

    if (!domain) return null;

    // Get running web dynos
    const dynos = db.getDynosByApplication(domain.applicationId)
      .filter(d => d.processType === 'web' && d.status === 'running');

    if (dynos.length === 0) return null;

    // Select dyno (sticky session for WebSockets)
    return dynos[0];
  }
}

// =============================================================================
// Router Server
// =============================================================================

export class RouterServer {
  private router: RequestRouter;
  private wsRouter: WebSocketRouter;

  constructor() {
    this.router = new RequestRouter();
    this.wsRouter = new WebSocketRouter();
  }

  /**
   * Start the router server
   */
  start(port: number = 8080): void {
    const server = createServer(async (req, res) => {
      try {
        await this.router.routeRequest(req, res);
      } catch (error: any) {
        logger.error('Router error:', error);
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('Internal Server Error');
      }
    });

    server.listen(port, () => {
      logger.info(`Router listening on port ${port}`);
    });
  }
}
