/**
 * Dashboard Controller
 *
 * Manages dashboard UI, chart rendering, and data updates.
 * Uses simple canvas-based charts for real-time visualization.
 */

import { createClient, WebSocketClient, PollingClient } from './websocket-client.ts';

/**
 * Simple chart implementation using Canvas API
 */
class SimpleChart {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private data: number[] = [];
  private maxDataPoints: number = 60;
  private color: string;
  private fillColor: string;
  private min: number = 0;
  private max: number = 100;

  constructor(
    canvasId: string,
    color: string = '#2563eb',
    maxDataPoints: number = 60
  ) {
    this.canvas = document.getElementById(canvasId) as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.maxDataPoints = maxDataPoints;
    this.color = color;
    this.fillColor = color + '20'; // Add alpha for fill

    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  private resizeCanvas(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.draw();
  }

  public addDataPoint(value: number): void {
    this.data.push(value);
    if (this.data.length > this.maxDataPoints) {
      this.data.shift();
    }
    this.draw();
  }

  public setRange(min: number, max: number): void {
    this.min = min;
    this.max = max;
  }

  public clear(): void {
    this.data = [];
    this.draw();
  }

  private draw(): void {
    const { width, height } = this.canvas;
    const ctx = this.ctx;

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    if (this.data.length === 0) {
      return;
    }

    // Calculate points
    const padding = 10;
    const chartWidth = width - padding * 2;
    const chartHeight = height - padding * 2;
    const stepX = chartWidth / (this.maxDataPoints - 1);
    const range = this.max - this.min;

    // Draw area
    ctx.beginPath();
    ctx.moveTo(padding, height - padding);

    this.data.forEach((value, index) => {
      const x = padding + index * stepX;
      const normalizedValue = range > 0 ? (value - this.min) / range : 0;
      const y = height - padding - normalizedValue * chartHeight;

      if (index === 0) {
        ctx.lineTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.lineTo(padding + (this.data.length - 1) * stepX, height - padding);
    ctx.closePath();

    // Fill area
    ctx.fillStyle = this.fillColor;
    ctx.fill();

    // Draw line
    ctx.beginPath();
    this.data.forEach((value, index) => {
      const x = padding + index * stepX;
      const normalizedValue = range > 0 ? (value - this.min) / range : 0;
      const y = height - padding - normalizedValue * chartHeight;

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw grid lines (optional)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([2, 2]);

    for (let i = 0; i <= 4; i++) {
      const y = padding + (chartHeight / 4) * i;
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    ctx.setLineDash([]);
  }
}

/**
 * Dashboard Controller
 */
class DashboardController {
  private client: WebSocketClient | PollingClient;
  private charts: Map<string, SimpleChart> = new Map();
  private lastUpdate: number = 0;
  private dataPointsCount: number = 0;

  constructor() {
    // Initialize client (use polling for this demo)
    this.client = createClient(
      'ws://localhost:8080/ws',
      'http://localhost:8080',
      2000
    );

    this.initializeCharts();
    this.setupEventListeners();
    this.connectToServer();
  }

  private initializeCharts(): void {
    // Create charts for each metric
    this.charts.set('cpu', new SimpleChart('cpuChart', '#2563eb'));
    this.charts.set('memory', new SimpleChart('memoryChart', '#7c3aed'));
    this.charts.set('network', new SimpleChart('networkChart', '#10b981'));
    this.charts.set('disk', new SimpleChart('diskChart', '#f59e0b'));
    this.charts.set('requests', new SimpleChart('requestChart', '#06b6d4'));
    this.charts.set('errors', new SimpleChart('errorChart', '#ef4444'));
    this.charts.set('latency', new SimpleChart('latencyChart', '#8b5cf6'));

    // Set ranges
    this.charts.get('cpu')!.setRange(0, 100);
    this.charts.get('memory')!.setRange(0, 100);
    this.charts.get('disk')!.setRange(0, 100);
  }

  private setupEventListeners(): void {
    // Handle metrics updates
    this.client.on('metrics_update', (message) => {
      this.handleMetricsUpdate(message);
    });

    // Handle connection status
    this.client.on('connected', () => {
      this.updateConnectionStatus(true);
    });

    this.client.on('disconnected', () => {
      this.updateConnectionStatus(false);
    });

    // Handle initial metrics
    this.client.on('initial_metrics', (message) => {
      console.log('Received initial metrics');
      this.handleMetricsUpdate(message);
    });
  }

  private connectToServer(): void {
    if (this.client instanceof WebSocketClient) {
      this.client.connect();
    } else {
      this.client.start();
    }
  }

  private updateConnectionStatus(connected: boolean): void {
    const statusElement = document.getElementById('connectionStatus');
    const statusDot = statusElement?.querySelector('.status-dot');

    if (statusElement && statusDot) {
      if (connected) {
        statusElement.innerHTML = `
          <span class="status-dot connected"></span>
          Connected
        `;
      } else {
        statusElement.innerHTML = `
          <span class="status-dot disconnected"></span>
          Disconnected
        `;
      }
    }
  }

  private handleMetricsUpdate(message: any): void {
    const { data } = message;
    if (!data) return;

    const { system, application, anomalies } = data;

    // Update system metrics
    if (system) {
      this.updateSystemMetrics(system);
    }

    // Update application metrics
    if (application) {
      this.updateApplicationMetrics(application);
    }

    // Update anomalies
    if (anomalies) {
      this.updateAnomalies(anomalies);
    }

    // Update timestamp
    this.lastUpdate = Date.now();
    this.updateLastUpdateTime();

    // Increment data points counter
    this.dataPointsCount++;
    this.updateDataPointsCount();
  }

  private updateSystemMetrics(system: any): void {
    // CPU
    if (system.cpu) {
      const cpuUsage = system.cpu.usage;
      this.setValue('cpuValue', `${cpuUsage.toFixed(1)}%`);
      this.setValue('cpuCores', system.cpu.cores);
      this.setValue('loadAvg', system.cpu.loadAverage[0].toFixed(2));
      this.charts.get('cpu')!.addDataPoint(cpuUsage);
    }

    // Memory
    if (system.memory) {
      const memUsage = system.memory.usagePercent;
      this.setValue('memoryValue', `${memUsage.toFixed(1)}%`);
      this.setValue('memoryUsed', this.formatBytes(system.memory.used));
      this.setValue('memoryTotal', this.formatBytes(system.memory.total));
      this.charts.get('memory')!.addDataPoint(memUsage);
    }

    // Network
    if (system.network) {
      const mbReceived = system.network.bytesReceived / (1024 * 1024);
      this.setValue('networkValue', `${mbReceived.toFixed(2)} MB`);
      this.setValue('networkRx', this.formatBytes(system.network.bytesReceived));
      this.setValue('networkTx', this.formatBytes(system.network.bytesSent));
      this.charts.get('network')!.addDataPoint(mbReceived);
    }

    // Disk
    if (system.disk) {
      const diskUsage = system.disk.usagePercent;
      this.setValue('diskValue', `${diskUsage.toFixed(1)}%`);
      this.setValue('diskRead', `${system.disk.readOps} ops/s`);
      this.setValue('diskWrite', `${system.disk.writeOps} ops/s`);
      this.charts.get('disk')!.addDataPoint(diskUsage);
    }
  }

  private updateApplicationMetrics(app: any): void {
    // Requests
    if (app.requests) {
      this.setValue('requestRate', `${app.requests.rate.toFixed(1)} req/s`);
      this.setValue('totalRequests', app.requests.total);
      this.setValue('activeConnections', app.requests.activeConnections);
      this.charts.get('requests')!.addDataPoint(app.requests.rate);
    }

    // Errors
    if (app.errors) {
      this.setValue('errorRate', `${app.errors.rate.toFixed(2)} err/s`);
      this.setValue('totalErrors', app.errors.total);
      const errorRatio = app.requests?.total > 0
        ? (app.errors.total / app.requests.total * 100).toFixed(2)
        : '0.00';
      this.setValue('errorRatio', `${errorRatio}%`);
      this.charts.get('errors')!.addDataPoint(app.errors.rate);
    }

    // Latency
    if (app.latency) {
      this.setValue('latencyValue', `${app.latency.average.toFixed(1)} ms`);
      this.setValue('latencyP95', `${app.latency.p95.toFixed(1)} ms`);
      this.setValue('latencyP99', `${app.latency.p99.toFixed(1)} ms`);
      this.charts.get('latency')!.addDataPoint(app.latency.average);
    }

    // Custom metrics
    if (app.custom) {
      if (app.custom.cache_hit_rate !== undefined) {
        this.setValue('cacheHitRate', `${(app.custom.cache_hit_rate * 100).toFixed(1)}%`);
      }
      if (app.custom.db_connections !== undefined) {
        this.setValue('dbConnections', Math.floor(app.custom.db_connections));
      }
      if (app.custom.queue_depth !== undefined) {
        this.setValue('queueDepth', Math.floor(app.custom.queue_depth));
      }
    }
  }

  private updateAnomalies(anomalies: any[]): void {
    const anomaliesList = document.getElementById('anomaliesList');
    const totalAnomalies = document.getElementById('totalAnomalies');
    const highSeverityCount = document.getElementById('highSeverityCount');
    const mediumSeverityCount = document.getElementById('mediumSeverityCount');

    if (!anomaliesList || !totalAnomalies || !highSeverityCount || !mediumSeverityCount) {
      return;
    }

    if (anomalies.length === 0) {
      anomaliesList.innerHTML = '<div class="no-anomalies">No anomalies detected</div>';
      this.setValue('totalAnomalies', '0');
      this.setValue('highSeverityCount', '0');
      this.setValue('mediumSeverityCount', '0');
      return;
    }

    // Count by severity
    const high = anomalies.filter(a => a.severity === 'high').length;
    const medium = anomalies.filter(a => a.severity === 'medium').length;

    this.setValue('totalAnomalies', anomalies.length);
    this.setValue('highSeverityCount', high);
    this.setValue('mediumSeverityCount', medium);

    // Render anomaly items
    anomaliesList.innerHTML = anomalies.map(anomaly => `
      <div class="anomaly-item ${anomaly.severity}">
        <div class="anomaly-header">
          <span class="anomaly-title">Anomaly at ${new Date(anomaly.timestamp).toLocaleTimeString()}</span>
          <span class="anomaly-severity ${anomaly.severity}">${anomaly.severity}</span>
        </div>
        <div class="anomaly-reason">${anomaly.reason}</div>
      </div>
    `).join('');
  }

  private setValue(elementId: string, value: any): void {
    const element = document.getElementById(elementId);
    if (element) {
      element.textContent = String(value);
    }
  }

  private updateLastUpdateTime(): void {
    const element = document.getElementById('updateTime');
    if (element) {
      const time = new Date(this.lastUpdate).toLocaleTimeString();
      element.textContent = `Last update: ${time}`;
    }
  }

  private updateDataPointsCount(): void {
    const element = document.getElementById('dataPoints');
    if (element) {
      element.textContent = String(this.dataPointsCount);
    }
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

// Initialize dashboard when DOM is loaded
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      new DashboardController();
    });
  } else {
    new DashboardController();
  }
}

export { DashboardController, SimpleChart };
