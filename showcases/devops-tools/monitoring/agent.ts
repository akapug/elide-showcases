/**
 * Monitoring Agent
 *
 * Collects system metrics, application metrics, and custom metrics.
 * Sends data to central monitoring system and triggers alerts.
 */

import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';
import { spawn } from 'child_process';
import { parse as parseCron } from 'cron-parser';
import ms from 'ms';

// ============================================================================
// Types and Interfaces
// ============================================================================

export interface MetricValue {
  timestamp: Date;
  value: number;
  unit: string;
  labels?: Record<string, string>;
}

export interface Metric {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'summary';
  description: string;
  values: MetricValue[];
  aggregation?: 'sum' | 'avg' | 'min' | 'max' | 'p95' | 'p99';
}

export interface SystemMetrics {
  cpu: {
    usage: number;
    loadAverage: number[];
    cores: number;
  };
  memory: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number;
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    bytesIn: number;
    bytesOut: number;
    packetsIn: number;
    packetsOut: number;
  };
  processes: {
    total: number;
    running: number;
    sleeping: number;
  };
}

export interface ApplicationMetrics {
  requests: {
    total: number;
    rate: number;
    errors: number;
    errorRate: number;
  };
  response: {
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  };
  database: {
    connections: number;
    queries: number;
    queryTime: number;
  };
  cache: {
    hits: number;
    misses: number;
    hitRate: number;
  };
}

export interface MetricCollector {
  name: string;
  type: 'system' | 'application' | 'custom';
  interval: string;
  enabled: boolean;
  collect: () => Promise<Metric[]>;
}

export interface MonitoringConfig {
  agentId: string;
  hostname: string;
  collectors: MetricCollector[];
  retentionPeriod: string; // e.g., "7d"
  exportInterval: string; // e.g., "60s"
  exportPath?: string;
  enablePythonAnalytics?: boolean;
  tags?: Record<string, string>;
}

export interface Alert {
  id: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  message: string;
  metric?: string;
  value?: number;
  threshold?: number;
  timestamp: Date;
  acknowledged: boolean;
}

// ============================================================================
// Metric Storage
// ============================================================================

export class MetricStore {
  private metrics: Map<string, Metric>;
  private retentionMs: number;

  constructor(retentionPeriod: string) {
    this.metrics = new Map();
    this.retentionMs = ms(retentionPeriod);
  }

  /**
   * Add a metric value
   */
  addMetric(name: string, value: MetricValue, type: Metric['type'], description: string): void {
    let metric = this.metrics.get(name);

    if (!metric) {
      metric = {
        name,
        type,
        description,
        values: [],
      };
      this.metrics.set(name, metric);
    }

    metric.values.push(value);

    // Cleanup old values
    this.cleanup(metric);
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  /**
   * Get all metrics
   */
  getAllMetrics(): Metric[] {
    return Array.from(this.metrics.values());
  }

  /**
   * Query metrics by pattern
   */
  queryMetrics(pattern: RegExp): Metric[] {
    return Array.from(this.metrics.values()).filter(m => pattern.test(m.name));
  }

  /**
   * Get latest value for a metric
   */
  getLatestValue(name: string): MetricValue | undefined {
    const metric = this.metrics.get(name);
    if (!metric || metric.values.length === 0) {
      return undefined;
    }
    return metric.values[metric.values.length - 1];
  }

  /**
   * Calculate aggregated value
   */
  aggregate(name: string, type: 'sum' | 'avg' | 'min' | 'max' | 'p95' | 'p99'): number {
    const metric = this.metrics.get(name);
    if (!metric || metric.values.length === 0) {
      return 0;
    }

    const values = metric.values.map(v => v.value);

    switch (type) {
      case 'sum':
        return values.reduce((a, b) => a + b, 0);
      case 'avg':
        return values.reduce((a, b) => a + b, 0) / values.length;
      case 'min':
        return Math.min(...values);
      case 'max':
        return Math.max(...values);
      case 'p95':
        return this.percentile(values, 95);
      case 'p99':
        return this.percentile(values, 99);
      default:
        return 0;
    }
  }

  /**
   * Calculate percentile
   */
  private percentile(values: number[], p: number): number {
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((p / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Cleanup old values
   */
  private cleanup(metric: Metric): void {
    const cutoff = Date.now() - this.retentionMs;
    metric.values = metric.values.filter(
      v => v.timestamp.getTime() > cutoff
    );
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }
}

// ============================================================================
// System Metrics Collector
// ============================================================================

export class SystemMetricsCollector {
  private previousCpuUsage?: NodeJS.CpuUsage;
  private previousNetworkStats?: { bytesIn: number; bytesOut: number };

  /**
   * Collect system metrics
   */
  async collect(): Promise<SystemMetrics> {
    const cpuMetrics = await this.collectCpuMetrics();
    const memoryMetrics = this.collectMemoryMetrics();
    const diskMetrics = await this.collectDiskMetrics();
    const networkMetrics = await this.collectNetworkMetrics();
    const processMetrics = await this.collectProcessMetrics();

    return {
      cpu: cpuMetrics,
      memory: memoryMetrics,
      disk: diskMetrics,
      network: networkMetrics,
      processes: processMetrics,
    };
  }

  /**
   * Collect CPU metrics
   */
  private async collectCpuMetrics() {
    const cpus = os.cpus();
    const loadAvg = os.loadavg();

    // Calculate CPU usage
    const currentUsage = process.cpuUsage(this.previousCpuUsage);
    this.previousCpuUsage = process.cpuUsage();

    const totalUsage = currentUsage.user + currentUsage.system;
    const usagePercent = (totalUsage / 1000000) * 100; // Convert to percentage

    return {
      usage: Math.min(100, usagePercent),
      loadAverage: loadAvg,
      cores: cpus.length,
    };
  }

  /**
   * Collect memory metrics
   */
  private collectMemoryMetrics() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    return {
      total,
      used,
      free,
      usagePercent: (used / total) * 100,
    };
  }

  /**
   * Collect disk metrics
   */
  private async collectDiskMetrics() {
    // Simple implementation - in production would use actual disk stats
    const stats = { total: 0, free: 0, used: 0 };

    try {
      // Try to read disk stats from /proc/mounts on Linux
      if (process.platform === 'linux' && fs.existsSync('/proc/mounts')) {
        // Simulate disk stats
        stats.total = 1024 * 1024 * 1024 * 100; // 100GB
        stats.free = 1024 * 1024 * 1024 * 50; // 50GB free
        stats.used = stats.total - stats.free;
      }
    } catch (error) {
      // Fallback to defaults
    }

    return {
      ...stats,
      usagePercent: stats.total > 0 ? (stats.used / stats.total) * 100 : 0,
    };
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics() {
    // Simplified network metrics
    // In production, would read from /proc/net/dev on Linux
    const current = {
      bytesIn: Math.floor(Math.random() * 1000000),
      bytesOut: Math.floor(Math.random() * 1000000),
    };

    const delta = this.previousNetworkStats
      ? {
          bytesIn: current.bytesIn - this.previousNetworkStats.bytesIn,
          bytesOut: current.bytesOut - this.previousNetworkStats.bytesOut,
        }
      : current;

    this.previousNetworkStats = current;

    return {
      bytesIn: Math.max(0, delta.bytesIn),
      bytesOut: Math.max(0, delta.bytesOut),
      packetsIn: 0,
      packetsOut: 0,
    };
  }

  /**
   * Collect process metrics
   */
  private async collectProcessMetrics() {
    // Simplified process metrics
    return {
      total: 150,
      running: 10,
      sleeping: 140,
    };
  }
}

// ============================================================================
// Monitoring Agent
// ============================================================================

export class MonitoringAgent {
  private config: MonitoringConfig;
  private store: MetricStore;
  private systemCollector: SystemMetricsCollector;
  private collectorIntervals: Map<string, NodeJS.Timeout>;
  private exportInterval?: NodeJS.Timeout;
  private running: boolean;
  private pythonAnalyticsPath: string;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.store = new MetricStore(config.retentionPeriod);
    this.systemCollector = new SystemMetricsCollector();
    this.collectorIntervals = new Map();
    this.running = false;
    this.pythonAnalyticsPath = path.join(__dirname, 'metrics.py');
  }

  /**
   * Start the monitoring agent
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('[MonitoringAgent] Agent is already running');
      return;
    }

    console.log(`[MonitoringAgent] Starting agent ${this.config.agentId}`);
    console.log(`[MonitoringAgent] Hostname: ${this.config.hostname}`);
    console.log(`[MonitoringAgent] Collectors: ${this.config.collectors.length}`);

    this.running = true;

    // Start collectors
    for (const collector of this.config.collectors) {
      if (collector.enabled) {
        this.startCollector(collector);
      }
    }

    // Start export interval
    const exportIntervalMs = ms(this.config.exportInterval);
    this.exportInterval = setInterval(() => {
      this.exportMetrics();
    }, exportIntervalMs);

    console.log('[MonitoringAgent] Agent started successfully');
  }

  /**
   * Stop the monitoring agent
   */
  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    console.log('[MonitoringAgent] Stopping agent...');

    this.running = false;

    // Stop all collectors
    for (const [name, interval] of this.collectorIntervals) {
      clearInterval(interval);
      console.log(`[MonitoringAgent] Stopped collector: ${name}`);
    }

    // Stop export interval
    if (this.exportInterval) {
      clearInterval(this.exportInterval);
    }

    // Final export
    await this.exportMetrics();

    console.log('[MonitoringAgent] Agent stopped');
  }

  /**
   * Start a metric collector
   */
  private startCollector(collector: MetricCollector): void {
    const intervalMs = ms(collector.interval);

    console.log(`[MonitoringAgent] Starting collector: ${collector.name} (${collector.interval})`);

    // Run immediately
    this.runCollector(collector);

    // Schedule periodic collection
    const interval = setInterval(() => {
      this.runCollector(collector);
    }, intervalMs);

    this.collectorIntervals.set(collector.name, interval);
  }

  /**
   * Run a collector once
   */
  private async runCollector(collector: MetricCollector): Promise<void> {
    try {
      const metrics = await collector.collect();

      for (const metric of metrics) {
        for (const value of metric.values) {
          this.store.addMetric(metric.name, value, metric.type, metric.description);
        }
      }
    } catch (error) {
      console.error(`[MonitoringAgent] Collector ${collector.name} failed:`, error);
    }
  }

  /**
   * Export metrics to storage/analytics
   */
  private async exportMetrics(): Promise<void> {
    const metrics = this.store.getAllMetrics();

    if (metrics.length === 0) {
      return;
    }

    console.log(`[MonitoringAgent] Exporting ${metrics.length} metrics`);

    // Export to file
    if (this.config.exportPath) {
      await this.exportToFile(metrics);
    }

    // Send to Python analytics
    if (this.config.enablePythonAnalytics) {
      await this.sendToPythonAnalytics(metrics);
    }
  }

  /**
   * Export metrics to file
   */
  private async exportToFile(metrics: Metric[]): Promise<void> {
    try {
      const data = {
        agentId: this.config.agentId,
        hostname: this.config.hostname,
        timestamp: new Date().toISOString(),
        tags: this.config.tags,
        metrics: metrics.map(m => ({
          name: m.name,
          type: m.type,
          description: m.description,
          latest: m.values[m.values.length - 1],
          count: m.values.length,
        })),
      };

      const json = JSON.stringify(data, null, 2);
      await fs.promises.appendFile(this.config.exportPath!, json + '\n');

      console.log(`[MonitoringAgent] Metrics exported to ${this.config.exportPath}`);
    } catch (error) {
      console.error('[MonitoringAgent] Failed to export metrics:', error);
    }
  }

  /**
   * Send metrics to Python analytics
   */
  private async sendToPythonAnalytics(metrics: Metric[]): Promise<void> {
    return new Promise((resolve) => {
      if (!fs.existsSync(this.pythonAnalyticsPath)) {
        console.warn('[MonitoringAgent] Python analytics script not found');
        resolve();
        return;
      }

      const python = spawn('python3', [this.pythonAnalyticsPath]);

      python.stdout.on('data', (data) => {
        console.log('[PythonAnalytics]', data.toString().trim());
      });

      python.stderr.on('data', (data) => {
        console.error('[PythonAnalytics Error]', data.toString().trim());
      });

      python.on('close', () => {
        resolve();
      });

      // Send metrics data
      python.stdin.write(JSON.stringify({
        agentId: this.config.agentId,
        hostname: this.config.hostname,
        metrics: metrics.map(m => ({
          name: m.name,
          type: m.type,
          values: m.values,
        })),
      }));
      python.stdin.end();
    });
  }

  /**
   * Get current metrics
   */
  getMetrics(): Metric[] {
    return this.store.getAllMetrics();
  }

  /**
   * Get metric by name
   */
  getMetric(name: string): Metric | undefined {
    return this.store.getMetric(name);
  }

  /**
   * Query metrics
   */
  queryMetrics(pattern: string): Metric[] {
    return this.store.queryMetrics(new RegExp(pattern));
  }

  /**
   * Get system metrics summary
   */
  async getSystemMetricsSummary(): Promise<Record<string, any>> {
    const cpuUsage = this.store.getLatestValue('system.cpu.usage');
    const memoryUsage = this.store.getLatestValue('system.memory.usage');
    const diskUsage = this.store.getLatestValue('system.disk.usage');

    return {
      cpu: cpuUsage?.value || 0,
      memory: memoryUsage?.value || 0,
      disk: diskUsage?.value || 0,
      timestamp: new Date(),
    };
  }
}

// ============================================================================
// Pre-built Collectors
// ============================================================================

/**
 * Create system metrics collector
 */
export function createSystemCollector(): MetricCollector {
  const collector = new SystemMetricsCollector();

  return {
    name: 'system',
    type: 'system',
    interval: '10s',
    enabled: true,
    collect: async () => {
      const systemMetrics = await collector.collect();
      const now = new Date();

      return [
        {
          name: 'system.cpu.usage',
          type: 'gauge',
          description: 'CPU usage percentage',
          values: [{
            timestamp: now,
            value: systemMetrics.cpu.usage,
            unit: 'percent',
          }],
        },
        {
          name: 'system.cpu.load_average_1m',
          type: 'gauge',
          description: '1-minute load average',
          values: [{
            timestamp: now,
            value: systemMetrics.cpu.loadAverage[0],
            unit: 'load',
          }],
        },
        {
          name: 'system.memory.usage',
          type: 'gauge',
          description: 'Memory usage percentage',
          values: [{
            timestamp: now,
            value: systemMetrics.memory.usagePercent,
            unit: 'percent',
          }],
        },
        {
          name: 'system.memory.used',
          type: 'gauge',
          description: 'Used memory in bytes',
          values: [{
            timestamp: now,
            value: systemMetrics.memory.used,
            unit: 'bytes',
          }],
        },
        {
          name: 'system.disk.usage',
          type: 'gauge',
          description: 'Disk usage percentage',
          values: [{
            timestamp: now,
            value: systemMetrics.disk.usagePercent,
            unit: 'percent',
          }],
        },
        {
          name: 'system.network.bytes_in',
          type: 'counter',
          description: 'Network bytes received',
          values: [{
            timestamp: now,
            value: systemMetrics.network.bytesIn,
            unit: 'bytes',
          }],
        },
        {
          name: 'system.network.bytes_out',
          type: 'counter',
          description: 'Network bytes sent',
          values: [{
            timestamp: now,
            value: systemMetrics.network.bytesOut,
            unit: 'bytes',
          }],
        },
      ];
    },
  };
}

/**
 * Create application metrics collector
 */
export function createApplicationCollector(): MetricCollector {
  // Simulated application metrics
  let requestCount = 0;
  let errorCount = 0;

  return {
    name: 'application',
    type: 'application',
    interval: '15s',
    enabled: true,
    collect: async () => {
      const now = new Date();

      // Simulate some activity
      requestCount += Math.floor(Math.random() * 100);
      errorCount += Math.floor(Math.random() * 5);

      return [
        {
          name: 'app.requests.total',
          type: 'counter',
          description: 'Total requests',
          values: [{
            timestamp: now,
            value: requestCount,
            unit: 'count',
          }],
        },
        {
          name: 'app.requests.errors',
          type: 'counter',
          description: 'Total errors',
          values: [{
            timestamp: now,
            value: errorCount,
            unit: 'count',
          }],
        },
        {
          name: 'app.response.time',
          type: 'histogram',
          description: 'Response time',
          values: [{
            timestamp: now,
            value: Math.random() * 200 + 50, // 50-250ms
            unit: 'ms',
          }],
        },
      ];
    },
  };
}

// ============================================================================
// CLI Interface
// ============================================================================

export async function main() {
  console.log('=== Monitoring Agent ===\n');

  const config: MonitoringConfig = {
    agentId: `agent-${os.hostname()}`,
    hostname: os.hostname(),
    collectors: [
      createSystemCollector(),
      createApplicationCollector(),
    ],
    retentionPeriod: '1h',
    exportInterval: '30s',
    exportPath: '/tmp/metrics.jsonl',
    enablePythonAnalytics: true,
    tags: {
      environment: 'production',
      region: 'us-east-1',
    },
  };

  const agent = new MonitoringAgent(config);

  // Start agent
  await agent.start();

  // Print metrics every 10 seconds
  setInterval(() => {
    const metrics = agent.getMetrics();
    console.log(`\n--- Current Metrics (${metrics.length} total) ---`);

    for (const metric of metrics.slice(0, 5)) {
      const latest = metric.values[metric.values.length - 1];
      console.log(`${metric.name}: ${latest.value.toFixed(2)} ${latest.unit}`);
    }
  }, 10000);

  // Handle shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down...');
    await agent.stop();
    process.exit(0);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
