#!/usr/bin/env elide

/**
 * Health Monitoring Dashboard
 *
 * Real-time monitoring dashboard for marketplace infrastructure
 */

import { serve, Request, Response } from "@elide/http";
import { Database } from "@elide/db";

interface ServiceHealth {
  name: string;
  url: string;
  status: "healthy" | "degraded" | "down";
  responseTime: number;
  lastChecked: Date;
  error?: string;
}

interface SystemMetrics {
  cpu: number;
  memory: number;
  disk: number;
  uptime: number;
}

class HealthMonitor {
  private db: Database;
  private services: Map<string, ServiceHealth>;

  constructor() {
    this.db = new Database("marketplace.db");
    this.services = new Map();

    // Define services to monitor
    this.addService("API Server", "http://localhost:3000/health");
    this.addService("Registry", "http://localhost:4873");
    this.addService("Marketplace", "http://localhost:3001/api/services");
    this.addService("Dashboard", "http://localhost:8080");
    this.addService("Orchestrator", "http://localhost:3002");
  }

  private addService(name: string, url: string): void {
    this.services.set(name, {
      name,
      url,
      status: "down",
      responseTime: 0,
      lastChecked: new Date()
    });
  }

  /**
   * Check health of a single service
   */
  async checkServiceHealth(name: string): Promise<ServiceHealth> {
    const service = this.services.get(name);
    if (!service) {
      throw new Error(`Service ${name} not found`);
    }

    const startTime = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(service.url, {
        signal: controller.signal,
        method: "GET"
      });

      clearTimeout(timeoutId);

      const responseTime = Date.now() - startTime;
      const status = response.ok ? "healthy" : "degraded";

      const health: ServiceHealth = {
        ...service,
        status,
        responseTime,
        lastChecked: new Date()
      };

      this.services.set(name, health);
      return health;

    } catch (error) {
      const health: ServiceHealth = {
        ...service,
        status: "down",
        responseTime: Date.now() - startTime,
        lastChecked: new Date(),
        error: error.message
      };

      this.services.set(name, health);
      return health;
    }
  }

  /**
   * Check all services
   */
  async checkAllServices(): Promise<ServiceHealth[]> {
    const results = await Promise.all(
      Array.from(this.services.keys()).map(name => this.checkServiceHealth(name))
    );

    return results;
  }

  /**
   * Get system metrics
   */
  async getSystemMetrics(): Promise<SystemMetrics> {
    // Simulate system metrics
    // In production, use actual system monitoring tools
    return {
      cpu: Math.random() * 100,
      memory: 45 + Math.random() * 20,
      disk: 60 + Math.random() * 10,
      uptime: Date.now() / 1000
    };
  }

  /**
   * Get database metrics
   */
  async getDatabaseMetrics(): Promise<any> {
    try {
      // Count various entities
      const packageCount = this.db.prepare("SELECT COUNT(*) as count FROM packages").get();
      const serviceCount = this.db.prepare("SELECT COUNT(*) as count FROM services").get();
      const userCount = this.db.prepare("SELECT COUNT(*) as count FROM users").get();
      const deploymentCount = this.db.prepare(
        "SELECT COUNT(*) as count FROM deployments WHERE status = 'running'"
      ).get();

      // Database size (simplified)
      const dbSize = 1024 * 1024 * Math.random() * 100; // Simulate 0-100MB

      return {
        packages: packageCount.count,
        services: serviceCount.count,
        users: userCount.count,
        activeDeployments: deploymentCount.count,
        databaseSize: dbSize
      };
    } catch (error) {
      return {
        packages: 0,
        services: 0,
        users: 0,
        activeDeployments: 0,
        databaseSize: 0,
        error: error.message
      };
    }
  }

  /**
   * Get recent alerts
   */
  async getAlerts(): Promise<any[]> {
    const alerts: any[] = [];

    // Check for failing services
    for (const [name, health] of this.services) {
      if (health.status === "down") {
        alerts.push({
          severity: "critical",
          service: name,
          message: `${name} is down`,
          timestamp: health.lastChecked
        });
      } else if (health.status === "degraded") {
        alerts.push({
          severity: "warning",
          service: name,
          message: `${name} is degraded`,
          timestamp: health.lastChecked
        });
      }
    }

    // Check for high response times
    for (const [name, health] of this.services) {
      if (health.responseTime > 1000 && health.status !== "down") {
        alerts.push({
          severity: "warning",
          service: name,
          message: `${name} has high response time (${health.responseTime}ms)`,
          timestamp: health.lastChecked
        });
      }
    }

    return alerts.sort((a, b) => {
      const severityOrder = { critical: 0, warning: 1, info: 2 };
      return severityOrder[a.severity] - severityOrder[b.severity];
    });
  }
}

// HTML Dashboard
const monitor = new HealthMonitor();

async function handleDashboard(req: Request): Promise<Response> {
  const serviceHealth = await monitor.checkAllServices();
  const systemMetrics = await monitor.getSystemMetrics();
  const dbMetrics = await monitor.getDatabaseMetrics();
  const alerts = await monitor.getAlerts();

  const overallStatus = serviceHealth.every(s => s.status === "healthy")
    ? "healthy"
    : serviceHealth.some(s => s.status === "down")
    ? "critical"
    : "degraded";

  const statusColor = {
    healthy: "#4caf50",
    degraded: "#ff9800",
    critical: "#f44336"
  }[overallStatus];

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="refresh" content="30">
  <title>Health Dashboard - Elide Marketplace</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0a0e27;
      color: #fff;
      padding: 2rem;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding-bottom: 1rem;
      border-bottom: 2px solid #1e2847;
    }
    h1 { font-size: 2rem; }
    .status-badge {
      padding: 0.5rem 1rem;
      border-radius: 20px;
      font-weight: bold;
      background: ${statusColor};
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    .card {
      background: #1e2847;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.3);
    }
    .card h2 {
      font-size: 1.2rem;
      margin-bottom: 1rem;
      color: #64b5f6;
    }
    .metric {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem 0;
      border-bottom: 1px solid #2d3a5f;
    }
    .metric:last-child { border-bottom: none; }
    .metric-value {
      font-size: 1.5rem;
      font-weight: bold;
    }
    .service-status {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: #151b33;
      border-radius: 8px;
      margin-bottom: 0.5rem;
    }
    .status-indicator {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      animation: pulse 2s infinite;
    }
    .status-healthy { background: #4caf50; }
    .status-degraded { background: #ff9800; }
    .status-down { background: #f44336; }
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.5; }
    }
    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 0.5rem;
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    .alert-critical { background: rgba(244, 67, 54, 0.2); border-left: 4px solid #f44336; }
    .alert-warning { background: rgba(255, 152, 0, 0.2); border-left: 4px solid #ff9800; }
    .progress-bar {
      width: 100%;
      height: 8px;
      background: #0a0e27;
      border-radius: 4px;
      overflow: hidden;
      margin-top: 0.5rem;
    }
    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    }
    .timestamp {
      color: #888;
      font-size: 0.9rem;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>🔍 Health Dashboard</h1>
      <div class="status-badge">${overallStatus.toUpperCase()}</div>
    </header>

    ${alerts.length > 0 ? `
    <div class="card" style="margin-bottom: 2rem;">
      <h2>⚠️ Alerts (${alerts.length})</h2>
      ${alerts.map(alert => `
        <div class="alert alert-${alert.severity}">
          <span>${alert.severity === "critical" ? "🔴" : "⚠️"}</span>
          <div style="flex: 1;">
            <strong>${alert.service}</strong>: ${alert.message}
            <div class="timestamp">${new Date(alert.timestamp).toLocaleString()}</div>
          </div>
        </div>
      `).join("")}
    </div>
    ` : ""}

    <div class="grid">
      <div class="card">
        <h2>📊 System Metrics</h2>
        <div class="metric">
          <span>CPU Usage</span>
          <span class="metric-value">${systemMetrics.cpu.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${systemMetrics.cpu}%"></div>
        </div>
        <div class="metric">
          <span>Memory Usage</span>
          <span class="metric-value">${systemMetrics.memory.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${systemMetrics.memory}%"></div>
        </div>
        <div class="metric">
          <span>Disk Usage</span>
          <span class="metric-value">${systemMetrics.disk.toFixed(1)}%</span>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${systemMetrics.disk}%"></div>
        </div>
        <div class="metric">
          <span>Uptime</span>
          <span class="metric-value">${Math.floor(systemMetrics.uptime / 3600)}h</span>
        </div>
      </div>

      <div class="card">
        <h2>💾 Database Metrics</h2>
        <div class="metric">
          <span>Packages</span>
          <span class="metric-value">${dbMetrics.packages.toLocaleString()}</span>
        </div>
        <div class="metric">
          <span>Services</span>
          <span class="metric-value">${dbMetrics.services.toLocaleString()}</span>
        </div>
        <div class="metric">
          <span>Users</span>
          <span class="metric-value">${dbMetrics.users.toLocaleString()}</span>
        </div>
        <div class="metric">
          <span>Active Deployments</span>
          <span class="metric-value">${dbMetrics.activeDeployments.toLocaleString()}</span>
        </div>
        <div class="metric">
          <span>Database Size</span>
          <span class="metric-value">${(dbMetrics.databaseSize / 1024 / 1024).toFixed(1)} MB</span>
        </div>
      </div>

      <div class="card" style="grid-column: span 2;">
        <h2>🔧 Service Health</h2>
        ${serviceHealth.map(service => `
          <div class="service-status">
            <div class="status-indicator status-${service.status}"></div>
            <div style="flex: 1;">
              <strong>${service.name}</strong>
              <div style="font-size: 0.9rem; color: #888;">${service.url}</div>
            </div>
            <div style="text-align: right;">
              <div>${service.status.toUpperCase()}</div>
              <div style="font-size: 0.9rem; color: #888;">${service.responseTime}ms</div>
            </div>
          </div>
        `).join("")}
      </div>
    </div>

    <div class="timestamp">
      Last updated: ${new Date().toLocaleString()} | Auto-refresh: 30s
    </div>
  </div>
</body>
</html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" }
  });
}

async function handleAPI(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname === "/api/health") {
    const health = await monitor.checkAllServices();
    return new Response(JSON.stringify(health), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.pathname === "/api/metrics") {
    const metrics = {
      system: await monitor.getSystemMetrics(),
      database: await monitor.getDatabaseMetrics()
    };
    return new Response(JSON.stringify(metrics), {
      headers: { "Content-Type": "application/json" }
    });
  }

  if (url.pathname === "/api/alerts") {
    const alerts = await monitor.getAlerts();
    return new Response(JSON.stringify(alerts), {
      headers: { "Content-Type": "application/json" }
    });
  }

  return new Response("Not found", { status: 404 });
}

async function handleRequest(req: Request): Promise<Response> {
  const url = new URL(req.url);

  if (url.pathname.startsWith("/api/")) {
    return await handleAPI(req);
  }

  return await handleDashboard(req);
}

const PORT = parseInt(Deno.env.get("HEALTH_PORT") || "9090");

console.log(`
🔍 Health Monitoring Dashboard
   Port: ${PORT}
   URL: http://localhost:${PORT}

   Auto-refresh: 30 seconds
   Monitoring: 5 services
`);

// Start periodic health checks
setInterval(async () => {
  await monitor.checkAllServices();
}, 30000);

serve(handleRequest, { port: PORT });
