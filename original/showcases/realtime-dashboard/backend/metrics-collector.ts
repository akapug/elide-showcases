/**
 * Metrics Collector
 *
 * Collects system and application metrics in real-time.
 * Supports CPU, memory, network, disk I/O, and custom application metrics.
 */

export interface SystemMetrics {
  timestamp: number;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disk: DiskMetrics;
  network: NetworkMetrics;
}

export interface CpuMetrics {
  usage: number;        // Percentage (0-100)
  cores: number;
  loadAverage: number[];
  temperature?: number;  // Optional, if available
}

export interface MemoryMetrics {
  total: number;         // Bytes
  used: number;          // Bytes
  free: number;          // Bytes
  usagePercent: number;  // Percentage (0-100)
  cached?: number;       // Bytes
  buffers?: number;      // Bytes
}

export interface DiskMetrics {
  total: number;         // Bytes
  used: number;          // Bytes
  free: number;          // Bytes
  usagePercent: number;  // Percentage (0-100)
  readOps: number;       // Operations per second
  writeOps: number;      // Operations per second
}

export interface NetworkMetrics {
  bytesReceived: number; // Bytes
  bytesSent: number;     // Bytes
  packetsReceived: number;
  packetsSent: number;
  errors: number;
  drops: number;
}

export interface ApplicationMetrics {
  timestamp: number;
  requests: RequestMetrics;
  errors: ErrorMetrics;
  latency: LatencyMetrics;
  custom: Record<string, number>;
}

export interface RequestMetrics {
  total: number;
  rate: number;          // Requests per second
  activeConnections: number;
  queuedRequests: number;
}

export interface ErrorMetrics {
  total: number;
  rate: number;          // Errors per second
  byType: Record<string, number>;
  lastError?: string;
  lastErrorTime?: number;
}

export interface LatencyMetrics {
  p50: number;           // 50th percentile (median)
  p90: number;           // 90th percentile
  p95: number;           // 95th percentile
  p99: number;           // 99th percentile
  average: number;
  min: number;
  max: number;
}

/**
 * MetricsCollector class
 * Collects system and application metrics periodically
 */
export class MetricsCollector {
  private metricsHistory: SystemMetrics[] = [];
  private appMetricsHistory: ApplicationMetrics[] = [];
  private maxHistorySize: number = 1000;

  // Tracking variables for calculating rates
  private previousNetworkStats: NetworkMetrics | null = null;
  private previousDiskStats: DiskMetrics | null = null;
  private previousTimestamp: number = 0;

  // Application metrics tracking
  private requestCount: number = 0;
  private errorCount: number = 0;
  private latencies: number[] = [];
  private activeConnections: number = 0;
  private errorsByType: Record<string, number> = {};
  private lastError: string | null = null;
  private lastErrorTime: number | null = null;
  private customMetrics: Record<string, number> = {};

  constructor(maxHistorySize: number = 1000) {
    this.maxHistorySize = maxHistorySize;
  }

  /**
   * Collect all system metrics
   */
  public async collectSystemMetrics(): Promise<SystemMetrics> {
    const timestamp = Date.now();

    const metrics: SystemMetrics = {
      timestamp,
      cpu: await this.collectCpuMetrics(),
      memory: await this.collectMemoryMetrics(),
      disk: await this.collectDiskMetrics(),
      network: await this.collectNetworkMetrics(),
    };

    // Store in history
    this.metricsHistory.push(metrics);
    if (this.metricsHistory.length > this.maxHistorySize) {
      this.metricsHistory.shift();
    }

    return metrics;
  }

  /**
   * Collect CPU metrics
   */
  private async collectCpuMetrics(): Promise<CpuMetrics> {
    // In a real implementation, this would use OS-specific APIs
    // For this showcase, we'll simulate realistic values

    const cores = this.getSystemInfo().cpuCores;

    // Simulate CPU usage with some realistic variance
    const baseUsage = 30 + Math.random() * 40; // 30-70%
    const usage = Math.min(100, Math.max(0, baseUsage + (Math.random() - 0.5) * 20));

    // Load average (1, 5, 15 minutes) - simulated
    const loadAverage = [
      cores * (0.3 + Math.random() * 0.4),
      cores * (0.25 + Math.random() * 0.35),
      cores * (0.2 + Math.random() * 0.3),
    ];

    return {
      usage: Math.round(usage * 100) / 100,
      cores,
      loadAverage: loadAverage.map(l => Math.round(l * 100) / 100),
      temperature: 45 + Math.random() * 20, // 45-65°C
    };
  }

  /**
   * Collect memory metrics
   */
  private async collectMemoryMetrics(): Promise<MemoryMetrics> {
    const systemInfo = this.getSystemInfo();
    const total = systemInfo.totalMemory;

    // Simulate memory usage (60-80% typically)
    const usagePercent = 60 + Math.random() * 20;
    const used = Math.floor(total * usagePercent / 100);
    const free = total - used;

    const cached = Math.floor(used * 0.3);
    const buffers = Math.floor(used * 0.1);

    return {
      total,
      used,
      free,
      usagePercent: Math.round(usagePercent * 100) / 100,
      cached,
      buffers,
    };
  }

  /**
   * Collect disk metrics
   */
  private async collectDiskMetrics(): Promise<DiskMetrics> {
    const total = 500 * 1024 * 1024 * 1024; // 500 GB
    const usagePercent = 45 + Math.random() * 30; // 45-75%
    const used = Math.floor(total * usagePercent / 100);
    const free = total - used;

    // I/O operations - simulated with realistic variance
    const readOps = Math.floor(100 + Math.random() * 500);
    const writeOps = Math.floor(50 + Math.random() * 200);

    const diskMetrics: DiskMetrics = {
      total,
      used,
      free,
      usagePercent: Math.round(usagePercent * 100) / 100,
      readOps,
      writeOps,
    };

    this.previousDiskStats = diskMetrics;
    return diskMetrics;
  }

  /**
   * Collect network metrics
   */
  private async collectNetworkMetrics(): Promise<NetworkMetrics> {
    const now = Date.now();

    // Calculate time delta for rate calculations
    const timeDelta = this.previousTimestamp > 0
      ? (now - this.previousTimestamp) / 1000
      : 1;

    // Simulate network traffic
    const bytesPerSecondReceived = 1024 * 1024 * (1 + Math.random() * 5); // 1-6 MB/s
    const bytesPerSecondSent = 1024 * 512 * (0.5 + Math.random() * 2); // 0.5-2.5 MB/s

    const bytesReceived = this.previousNetworkStats
      ? this.previousNetworkStats.bytesReceived + Math.floor(bytesPerSecondReceived * timeDelta)
      : Math.floor(bytesPerSecondReceived * 60);

    const bytesSent = this.previousNetworkStats
      ? this.previousNetworkStats.bytesSent + Math.floor(bytesPerSecondSent * timeDelta)
      : Math.floor(bytesPerSecondSent * 60);

    const packetsReceived = Math.floor(bytesReceived / 1000);
    const packetsSent = Math.floor(bytesSent / 1000);

    // Simulate occasional errors and drops
    const errors = Math.random() < 0.1 ? Math.floor(Math.random() * 5) : 0;
    const drops = Math.random() < 0.05 ? Math.floor(Math.random() * 3) : 0;

    const networkMetrics: NetworkMetrics = {
      bytesReceived,
      bytesSent,
      packetsReceived,
      packetsSent,
      errors: (this.previousNetworkStats?.errors || 0) + errors,
      drops: (this.previousNetworkStats?.drops || 0) + drops,
    };

    this.previousNetworkStats = networkMetrics;
    this.previousTimestamp = now;

    return networkMetrics;
  }

  /**
   * Collect application metrics
   */
  public collectApplicationMetrics(): ApplicationMetrics {
    const timestamp = Date.now();
    const timeSinceLastCollection = this.appMetricsHistory.length > 0
      ? (timestamp - this.appMetricsHistory[this.appMetricsHistory.length - 1].timestamp) / 1000
      : 1;

    const requestRate = this.requestCount / timeSinceLastCollection;
    const errorRate = this.errorCount / timeSinceLastCollection;

    const latencyStats = this.calculateLatencyStats();

    const metrics: ApplicationMetrics = {
      timestamp,
      requests: {
        total: this.requestCount,
        rate: Math.round(requestRate * 100) / 100,
        activeConnections: this.activeConnections,
        queuedRequests: Math.floor(Math.random() * 10),
      },
      errors: {
        total: this.errorCount,
        rate: Math.round(errorRate * 100) / 100,
        byType: { ...this.errorsByType },
        lastError: this.lastError || undefined,
        lastErrorTime: this.lastErrorTime || undefined,
      },
      latency: latencyStats,
      custom: { ...this.customMetrics },
    };

    // Store in history
    this.appMetricsHistory.push(metrics);
    if (this.appMetricsHistory.length > this.maxHistorySize) {
      this.appMetricsHistory.shift();
    }

    return metrics;
  }

  /**
   * Calculate latency statistics from collected latencies
   */
  private calculateLatencyStats(): LatencyMetrics {
    if (this.latencies.length === 0) {
      return {
        p50: 0,
        p90: 0,
        p95: 0,
        p99: 0,
        average: 0,
        min: 0,
        max: 0,
      };
    }

    const sorted = [...this.latencies].sort((a, b) => a - b);
    const len = sorted.length;

    const percentile = (p: number) => {
      const index = Math.ceil(len * p) - 1;
      return sorted[Math.max(0, index)];
    };

    const sum = sorted.reduce((acc, val) => acc + val, 0);
    const average = sum / len;

    return {
      p50: Math.round(percentile(0.50) * 100) / 100,
      p90: Math.round(percentile(0.90) * 100) / 100,
      p95: Math.round(percentile(0.95) * 100) / 100,
      p99: Math.round(percentile(0.99) * 100) / 100,
      average: Math.round(average * 100) / 100,
      min: Math.round(sorted[0] * 100) / 100,
      max: Math.round(sorted[len - 1] * 100) / 100,
    };
  }

  /**
   * Record a request
   */
  public recordRequest(latency: number): void {
    this.requestCount++;
    this.latencies.push(latency);

    // Keep latency buffer manageable
    if (this.latencies.length > 1000) {
      this.latencies = this.latencies.slice(-1000);
    }
  }

  /**
   * Record an error
   */
  public recordError(errorType: string, message: string): void {
    this.errorCount++;
    this.errorsByType[errorType] = (this.errorsByType[errorType] || 0) + 1;
    this.lastError = message;
    this.lastErrorTime = Date.now();
  }

  /**
   * Track active connections
   */
  public setActiveConnections(count: number): void {
    this.activeConnections = count;
  }

  /**
   * Set custom metric
   */
  public setCustomMetric(key: string, value: number): void {
    this.customMetrics[key] = value;
  }

  /**
   * Get metrics history
   */
  public getSystemMetricsHistory(limit?: number): SystemMetrics[] {
    if (limit) {
      return this.metricsHistory.slice(-limit);
    }
    return [...this.metricsHistory];
  }

  /**
   * Get application metrics history
   */
  public getApplicationMetricsHistory(limit?: number): ApplicationMetrics[] {
    if (limit) {
      return this.appMetricsHistory.slice(-limit);
    }
    return [...this.appMetricsHistory];
  }

  /**
   * Get system information (simulated)
   */
  private getSystemInfo(): { cpuCores: number; totalMemory: number } {
    return {
      cpuCores: 8,
      totalMemory: 16 * 1024 * 1024 * 1024, // 16 GB
    };
  }

  /**
   * Reset application metrics counters
   */
  public resetApplicationMetrics(): void {
    this.requestCount = 0;
    this.errorCount = 0;
    this.latencies = [];
    this.errorsByType = {};
  }

  /**
   * Generate simulated traffic for demo purposes
   */
  public simulateTraffic(): void {
    // Simulate requests with varying latencies
    const requestCount = Math.floor(10 + Math.random() * 50);
    for (let i = 0; i < requestCount; i++) {
      const latency = 10 + Math.random() * 200; // 10-210ms
      this.recordRequest(latency);
    }

    // Simulate occasional errors
    if (Math.random() < 0.1) {
      const errorTypes = ['timeout', '500', '503', '404', 'connection_refused'];
      const errorType = errorTypes[Math.floor(Math.random() * errorTypes.length)];
      this.recordError(errorType, `Simulated ${errorType} error`);
    }

    // Simulate active connections
    this.setActiveConnections(Math.floor(20 + Math.random() * 80));

    // Simulate custom metrics
    this.setCustomMetric('cache_hit_rate', 0.85 + Math.random() * 0.1);
    this.setCustomMetric('db_connections', Math.floor(10 + Math.random() * 40));
    this.setCustomMetric('queue_depth', Math.floor(Math.random() * 100));
  }
}

/**
 * Create a singleton instance for easy access
 */
export const metricsCollector = new MetricsCollector();
