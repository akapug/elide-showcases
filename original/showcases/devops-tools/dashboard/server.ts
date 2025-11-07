/**
 * DevOps Dashboard Server
 *
 * Web-based dashboard for monitoring, deployments, and log analysis.
 */

import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import { LogCollector, LogAnalyzer } from '../log-aggregator/collector';
import { DeploymentOrchestrator } from '../deployment/orchestrator';
import { MonitoringAgent, createSystemCollector, createApplicationCollector } from '../monitoring/agent';
import { AlertManager, createDefaultRules } from '../monitoring/alerts';

// ============================================================================
// Dashboard Server
// ============================================================================

export class DashboardServer {
  private server?: http.Server;
  private port: number;
  private logCollector?: LogCollector;
  private orchestrator: DeploymentOrchestrator;
  private monitoringAgent?: MonitoringAgent;
  private alertManager: AlertManager;

  constructor(port: number = 3000) {
    this.port = port;
    this.orchestrator = new DeploymentOrchestrator();
    this.alertManager = new AlertManager();

    // Register default alert rules
    const rules = createDefaultRules();
    for (const rule of rules) {
      this.alertManager.registerRule(rule);
    }
  }

  /**
   * Start the dashboard server
   */
  async start(): Promise<void> {
    console.log('[Dashboard] Starting DevOps Tools Dashboard...');

    this.server = http.createServer((req, res) => {
      this.handleRequest(req, res);
    });

    this.server.listen(this.port, () => {
      console.log(`[Dashboard] Server running at http://localhost:${this.port}`);
      console.log(`[Dashboard] Open in browser to view dashboard`);
    });
  }

  /**
   * Stop the dashboard server
   */
  async stop(): Promise<void> {
    if (this.server) {
      this.server.close();
      console.log('[Dashboard] Server stopped');
    }
  }

  /**
   * Handle HTTP requests
   */
  private handleRequest(req: http.IncomingMessage, res: http.ServerResponse): void {
    const url = req.url || '/';

    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      res.writeHead(200);
      res.end();
      return;
    }

    // Route requests
    if (url === '/' || url === '/index.html') {
      this.serveFile(res, 'index.html', 'text/html');
    } else if (url === '/dashboard.css') {
      this.serveFile(res, 'dashboard.css', 'text/css');
    } else if (url === '/dashboard.js') {
      this.serveFile(res, 'dashboard.js', 'application/javascript');
    } else if (url.startsWith('/api/')) {
      this.handleApiRequest(req, res, url);
    } else {
      res.writeHead(404);
      res.end('Not Found');
    }
  }

  /**
   * Serve static files
   */
  private serveFile(res: http.ServerResponse, filename: string, contentType: string): void {
    const filePath = path.join(__dirname, filename);

    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(404);
        res.end('File not found');
        return;
      }

      res.writeHead(200, { 'Content-Type': contentType });
      res.end(data);
    });
  }

  /**
   * Handle API requests
   */
  private handleApiRequest(
    req: http.IncomingMessage,
    res: http.ServerResponse,
    url: string
  ): void {
    // Parse URL
    const path = url.replace('/api', '');

    if (path === '/status') {
      this.handleStatus(res);
    } else if (path === '/deployments') {
      this.handleDeployments(res);
    } else if (path === '/metrics') {
      this.handleMetrics(res);
    } else if (path === '/alerts') {
      this.handleAlerts(res);
    } else if (path === '/logs') {
      this.handleLogs(res);
    } else {
      res.writeHead(404);
      res.end(JSON.stringify({ error: 'API endpoint not found' }));
    }
  }

  /**
   * Handle /api/status
   */
  private handleStatus(res: http.ServerResponse): void {
    const status = {
      status: 'running',
      timestamp: new Date().toISOString(),
      services: {
        logCollector: this.logCollector ? 'running' : 'stopped',
        orchestrator: 'running',
        monitoring: this.monitoringAgent ? 'running' : 'stopped',
        alerts: 'running',
      },
    };

    this.sendJson(res, status);
  }

  /**
   * Handle /api/deployments
   */
  private handleDeployments(res: http.ServerResponse): void {
    const active = this.orchestrator.getActiveDeployments();
    const history = this.orchestrator.getHistory(10);

    this.sendJson(res, {
      active: active.map(d => ({
        id: d.id,
        name: d.config.name,
        version: d.config.version,
        environment: d.config.environment.name,
        state: d.state,
        progress: d.progress,
        startTime: d.startTime,
      })),
      history: history.map(d => ({
        id: d.id,
        name: d.config.name,
        version: d.config.version,
        environment: d.config.environment.name,
        state: d.state,
        startTime: d.startTime,
        endTime: d.endTime,
      })),
    });
  }

  /**
   * Handle /api/metrics
   */
  private handleMetrics(res: http.ServerResponse): void {
    if (!this.monitoringAgent) {
      this.sendJson(res, { error: 'Monitoring agent not running' });
      return;
    }

    const metrics = this.monitoringAgent.getMetrics();

    this.sendJson(res, {
      metrics: metrics.map(m => ({
        name: m.name,
        type: m.type,
        description: m.description,
        latest: m.values[m.values.length - 1],
        count: m.values.length,
      })),
    });
  }

  /**
   * Handle /api/alerts
   */
  private handleAlerts(res: http.ServerResponse): void {
    const stats = this.alertManager.getStats();
    const active = this.alertManager.getActiveAlerts();

    this.sendJson(res, {
      stats,
      active: active.map(a => ({
        id: a.id,
        severity: a.severity,
        title: a.title,
        message: a.message,
        timestamp: a.timestamp,
        acknowledged: a.acknowledged,
      })),
    });
  }

  /**
   * Handle /api/logs
   */
  private handleLogs(res: http.ServerResponse): void {
    // Return mock log data
    this.sendJson(res, {
      logs: [
        {
          timestamp: new Date(),
          level: 'INFO',
          source: 'app',
          message: 'Application started',
        },
      ],
    });
  }

  /**
   * Send JSON response
   */
  private sendJson(res: http.ServerResponse, data: any): void {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(data, null, 2));
  }
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main() {
  const server = new DashboardServer(3000);
  await server.start();

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await server.stop();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
