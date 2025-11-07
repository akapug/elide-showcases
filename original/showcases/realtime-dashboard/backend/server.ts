/**
 * Real-Time Dashboard Server
 *
 * HTTP server with WebSocket support for real-time metrics streaming.
 * Serves the dashboard frontend and provides REST API endpoints.
 */

import { metricsCollector } from './metrics-collector.ts';
import { dataAggregator } from './data-aggregator.ts';
import { apiHandler, parseRequest } from './api.ts';

/**
 * WebSocket Connection Management
 */
class WebSocketConnection {
  private id: string;
  private send: (data: string) => void;
  private isAlive: boolean = true;

  constructor(id: string, sendFn: (data: string) => void) {
    this.id = id;
    this.send = sendFn;
  }

  public getId(): string {
    return this.id;
  }

  public sendMessage(data: any): void {
    try {
      this.send(JSON.stringify(data));
    } catch (error) {
      console.error(`Error sending message to ${this.id}:`, error);
    }
  }

  public ping(): void {
    this.isAlive = true;
  }

  public isActive(): boolean {
    return this.isAlive;
  }

  public markInactive(): void {
    this.isAlive = false;
  }
}

/**
 * Dashboard Server
 */
export class DashboardServer {
  private connections: Map<string, WebSocketConnection> = new Map();
  private metricsInterval: any = null;
  private trafficSimulationInterval: any = null;
  private updateFrequency: number = 2000; // 2 seconds
  private isRunning: boolean = false;

  constructor(updateFrequency: number = 2000) {
    this.updateFrequency = updateFrequency;
  }

  /**
   * Start the server
   */
  public start(): void {
    if (this.isRunning) {
      console.log('Server is already running');
      return;
    }

    console.log('Starting Real-Time Dashboard Server...');
    this.isRunning = true;

    // Start metrics collection
    this.startMetricsCollection();

    // Start traffic simulation (for demo purposes)
    this.startTrafficSimulation();

    console.log(`Server started. Update frequency: ${this.updateFrequency}ms`);
    console.log(`WebSocket connections: ${this.connections.size}`);
  }

  /**
   * Stop the server
   */
  public stop(): void {
    if (!this.isRunning) {
      return;
    }

    console.log('Stopping server...');
    this.isRunning = false;

    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }

    if (this.trafficSimulationInterval) {
      clearInterval(this.trafficSimulationInterval);
      this.trafficSimulationInterval = null;
    }

    // Close all WebSocket connections
    this.connections.forEach(conn => {
      conn.sendMessage({ type: 'server_shutdown', message: 'Server is shutting down' });
    });
    this.connections.clear();

    console.log('Server stopped');
  }

  /**
   * Start metrics collection loop
   */
  private startMetricsCollection(): void {
    // Collect initial metrics
    this.collectAndBroadcastMetrics();

    // Set up periodic collection
    this.metricsInterval = setInterval(() => {
      this.collectAndBroadcastMetrics();
    }, this.updateFrequency);
  }

  /**
   * Collect metrics and broadcast to all connected clients
   */
  private async collectAndBroadcastMetrics(): Promise<void> {
    try {
      // Collect system metrics
      const systemMetrics = await metricsCollector.collectSystemMetrics();
      dataAggregator.addSystemMetrics(systemMetrics);

      // Collect application metrics
      const appMetrics = metricsCollector.collectApplicationMetrics();
      dataAggregator.addApplicationMetrics(appMetrics);

      // Detect anomalies
      const summary = dataAggregator.getSummaryStatistics(5);
      const anomalies = [
        ...summary.anomalies.cpu.filter(a => a.isAnomaly),
        ...summary.anomalies.memory.filter(a => a.isAnomaly),
        ...summary.anomalies.latency.filter(a => a.isAnomaly),
      ];

      // Prepare broadcast message
      const message = {
        type: 'metrics_update',
        timestamp: Date.now(),
        data: {
          system: systemMetrics,
          application: appMetrics,
          anomalies: anomalies.slice(0, 5), // Top 5 recent anomalies
        },
      };

      // Broadcast to all connected clients
      this.broadcast(message);
    } catch (error) {
      console.error('Error collecting metrics:', error);
    }
  }

  /**
   * Start simulating traffic (for demo purposes)
   */
  private startTrafficSimulation(): void {
    this.trafficSimulationInterval = setInterval(() => {
      metricsCollector.simulateTraffic();
    }, 1000); // Simulate traffic every second
  }

  /**
   * Handle WebSocket connection
   */
  public handleWebSocketConnection(connectionId: string, sendFn: (data: string) => void): void {
    const connection = new WebSocketConnection(connectionId, sendFn);
    this.connections.set(connectionId, connection);

    console.log(`WebSocket connection established: ${connectionId}`);
    console.log(`Total connections: ${this.connections.size}`);

    // Send welcome message
    connection.sendMessage({
      type: 'connected',
      message: 'Connected to Real-Time Dashboard',
      updateFrequency: this.updateFrequency,
    });

    // Send initial metrics immediately
    this.sendInitialMetrics(connection);
  }

  /**
   * Handle WebSocket disconnection
   */
  public handleWebSocketDisconnection(connectionId: string): void {
    this.connections.delete(connectionId);
    console.log(`WebSocket connection closed: ${connectionId}`);
    console.log(`Total connections: ${this.connections.size}`);
  }

  /**
   * Handle WebSocket message
   */
  public handleWebSocketMessage(connectionId: string, message: string): void {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      return;
    }

    try {
      const data = JSON.parse(message);

      if (data.type === 'ping') {
        connection.ping();
        connection.sendMessage({ type: 'pong' });
      } else if (data.type === 'request_history') {
        this.sendHistory(connection, data.limit || 100);
      } else if (data.type === 'simulate_traffic') {
        metricsCollector.simulateTraffic();
        connection.sendMessage({ type: 'traffic_simulated' });
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Send initial metrics to a new connection
   */
  private async sendInitialMetrics(connection: WebSocketConnection): Promise<void> {
    const systemMetrics = await metricsCollector.collectSystemMetrics();
    const appMetrics = metricsCollector.collectApplicationMetrics();

    connection.sendMessage({
      type: 'initial_metrics',
      data: {
        system: systemMetrics,
        application: appMetrics,
      },
    });
  }

  /**
   * Send historical data
   */
  private sendHistory(connection: WebSocketConnection, limit: number): void {
    const systemHistory = metricsCollector.getSystemMetricsHistory(limit);
    const appHistory = metricsCollector.getApplicationMetricsHistory(limit);

    connection.sendMessage({
      type: 'history',
      data: {
        system: systemHistory,
        application: appHistory,
      },
    });
  }

  /**
   * Broadcast message to all connected clients
   */
  private broadcast(message: any): void {
    this.connections.forEach(connection => {
      connection.sendMessage(message);
    });
  }

  /**
   * Handle HTTP request
   */
  public async handleHttpRequest(method: string, url: string, body?: any): Promise<any> {
    // Serve static files
    if (method === 'GET' && url === '/') {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'text/html' },
        body: 'Dashboard HTML would be served here',
      };
    }

    // Handle API requests
    if (url.startsWith('/api/')) {
      const request = parseRequest(method, url, body);
      const response = await apiHandler.handleRequest(request);

      return {
        statusCode: response.success ? 200 : (response.error?.includes('Not found') ? 404 : 500),
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(response),
      };
    }

    return {
      statusCode: 404,
      headers: { 'Content-Type': 'text/plain' },
      body: 'Not Found',
    };
  }

  /**
   * Get server statistics
   */
  public getStats(): {
    isRunning: boolean;
    connections: number;
    updateFrequency: number;
    dataStats: any;
  } {
    return {
      isRunning: this.isRunning,
      connections: this.connections.size,
      updateFrequency: this.updateFrequency,
      dataStats: dataAggregator.getDataSummary(),
    };
  }

  /**
   * Set update frequency
   */
  public setUpdateFrequency(frequency: number): void {
    this.updateFrequency = frequency;
    if (this.isRunning) {
      // Restart metrics collection with new frequency
      if (this.metricsInterval) {
        clearInterval(this.metricsInterval);
      }
      this.startMetricsCollection();
    }
  }
}

/**
 * Create and export server instance
 */
export const dashboardServer = new DashboardServer(2000);

/**
 * Main function for standalone execution
 */
export function main() {
  console.log('='.repeat(60));
  console.log('Real-Time Dashboard Server');
  console.log('='.repeat(60));

  // Start the server
  dashboardServer.start();

  // Simulate some HTTP requests for demonstration
  setTimeout(async () => {
    console.log('\n--- Testing API Endpoints ---\n');

    // Test current metrics endpoint
    const currentMetrics = await dashboardServer.handleHttpRequest('GET', '/api/metrics/current');
    console.log('Current Metrics Response:', JSON.parse(currentMetrics.body).data);

    // Test health endpoint
    const health = await dashboardServer.handleHttpRequest('GET', '/api/health');
    console.log('\nHealth Response:', JSON.parse(health.body).data);

    // Test summary endpoint
    const summary = await dashboardServer.handleHttpRequest('GET', '/api/metrics/summary?minutes=1');
    console.log('\nSummary Response:', JSON.parse(summary.body).data);

    console.log('\n--- Server Statistics ---');
    console.log(dashboardServer.getStats());
  }, 5000);

  // Simulate WebSocket connection
  const mockConnectionId = 'test-connection-1';
  const mockSendFn = (data: string) => {
    const parsed = JSON.parse(data);
    if (parsed.type === 'metrics_update') {
      console.log(`\n[WebSocket] Received metrics update at ${new Date(parsed.timestamp).toISOString()}`);
      console.log(`  CPU: ${parsed.data.system.cpu.usage.toFixed(2)}%`);
      console.log(`  Memory: ${parsed.data.system.memory.usagePercent.toFixed(2)}%`);
      console.log(`  Requests: ${parsed.data.application.requests.total}`);
      if (parsed.data.anomalies.length > 0) {
        console.log(`  Anomalies detected: ${parsed.data.anomalies.length}`);
      }
    }
  };

  setTimeout(() => {
    console.log('\n--- Simulating WebSocket Connection ---\n');
    dashboardServer.handleWebSocketConnection(mockConnectionId, mockSendFn);
  }, 2000);

  // Run for 30 seconds then stop
  setTimeout(() => {
    console.log('\n--- Shutting down server ---\n');
    dashboardServer.stop();
    console.log('Demo completed');
  }, 30000);
}

// Run main if this is the entry point
if (import.meta.main) {
  main();
}
