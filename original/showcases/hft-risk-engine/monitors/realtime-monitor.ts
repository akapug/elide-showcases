/**
 * Real-Time Risk Monitoring System
 *
 * Provides live monitoring, alerting, and metrics collection for the risk engine
 */

import type { Order, RiskCheckResult } from '../core/types';

// ============================================================================
// Monitoring Types
// ============================================================================

interface MetricSnapshot {
  timestamp: number;
  totalChecks: number;
  approvedChecks: number;
  rejectedChecks: number;
  avgLatencyMs: number;
  p95LatencyMs: number;
  p99LatencyMs: number;
  throughput: number; // checks per second
  errorRate: number;
}

interface Alert {
  id: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  type: string;
  message: string;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ViolationSummary {
  type: string;
  count: number;
  percentage: number;
  examples: string[];
}

interface MonitorConfig {
  metricsWindowMs: number; // rolling window for metrics
  alertThresholds: {
    latencyP99Ms: number;
    errorRatePercent: number;
    rejectionRatePercent: number;
    throughputMin: number;
  };
}

// ============================================================================
// Real-Time Monitor
// ============================================================================

export class RealTimeMonitor {
  private checkHistory: Array<{ result: RiskCheckResult; latencyMs: number; timestamp: number }> = [];
  private alerts: Alert[] = [];
  private violations: Map<string, number> = new Map();
  private config: MonitorConfig;
  private metricsCollectionStartTime: number;
  private alertIdCounter = 0;

  constructor(config?: Partial<MonitorConfig>) {
    this.config = {
      metricsWindowMs: 60000, // 1 minute default
      alertThresholds: {
        latencyP99Ms: 2.0,
        errorRatePercent: 1.0,
        rejectionRatePercent: 50.0,
        throughputMin: 100,
      },
      ...config,
    };

    this.metricsCollectionStartTime = Date.now();

    // Start periodic monitoring
    this.startPeriodicMonitoring();
  }

  // ============================================================================
  // Recording Events
  // ============================================================================

  recordCheck(result: RiskCheckResult, latencyMs: number) {
    const record = {
      result,
      latencyMs,
      timestamp: Date.now(),
    };

    this.checkHistory.push(record);

    // Record violations
    if (!result.approved && result.violations) {
      for (const violation of result.violations) {
        const count = this.violations.get(violation) || 0;
        this.violations.set(violation, count + 1);
      }
    }

    // Trim old history
    const cutoff = Date.now() - this.config.metricsWindowMs;
    this.checkHistory = this.checkHistory.filter(r => r.timestamp >= cutoff);

    // Check thresholds
    this.checkAlertThresholds();
  }

  // ============================================================================
  // Metrics Calculation
  // ============================================================================

  getCurrentMetrics(): MetricSnapshot {
    if (this.checkHistory.length === 0) {
      return {
        timestamp: Date.now(),
        totalChecks: 0,
        approvedChecks: 0,
        rejectedChecks: 0,
        avgLatencyMs: 0,
        p95LatencyMs: 0,
        p99LatencyMs: 0,
        throughput: 0,
        errorRate: 0,
      };
    }

    const approved = this.checkHistory.filter(r => r.result.approved).length;
    const rejected = this.checkHistory.length - approved;

    const latencies = this.checkHistory.map(r => r.latencyMs).sort((a, b) => a - b);
    const avgLatency = latencies.reduce((sum, l) => sum + l, 0) / latencies.length;
    const p95Latency = latencies[Math.floor(latencies.length * 0.95)];
    const p99Latency = latencies[Math.floor(latencies.length * 0.99)];

    const windowDurationSec = (Date.now() - this.checkHistory[0].timestamp) / 1000;
    const throughput = this.checkHistory.length / windowDurationSec;

    // Error rate (checks that threw errors vs completed)
    const errors = this.checkHistory.filter(r => r.result.violations && r.result.violations.includes('SYSTEM_ERROR')).length;
    const errorRate = errors / this.checkHistory.length;

    return {
      timestamp: Date.now(),
      totalChecks: this.checkHistory.length,
      approvedChecks: approved,
      rejectedChecks: rejected,
      avgLatencyMs: avgLatency,
      p95LatencyMs: p95Latency,
      p99LatencyMs: p99Latency,
      throughput,
      errorRate,
    };
  }

  getViolationSummary(): ViolationSummary[] {
    const total = this.checkHistory.filter(r => !r.result.approved).length;

    if (total === 0) {
      return [];
    }

    const summaries: ViolationSummary[] = [];

    for (const [type, count] of this.violations.entries()) {
      summaries.push({
        type,
        count,
        percentage: (count / total) * 100,
        examples: this.getViolationExamples(type, 3),
      });
    }

    return summaries.sort((a, b) => b.count - a.count);
  }

  private getViolationExamples(violationType: string, limit: number): string[] {
    const examples: string[] = [];

    for (const record of this.checkHistory) {
      if (record.result.violations?.includes(violationType)) {
        examples.push(`Order ${record.result.orderId} at ${new Date(record.timestamp).toISOString()}`);
        if (examples.length >= limit) break;
      }
    }

    return examples;
  }

  // ============================================================================
  // Alert Management
  // ============================================================================

  private checkAlertThresholds() {
    const metrics = this.getCurrentMetrics();

    // P99 latency alert
    if (metrics.p99LatencyMs > this.config.alertThresholds.latencyP99Ms) {
      this.createAlert('CRITICAL', 'HIGH_LATENCY', `P99 latency is ${metrics.p99LatencyMs.toFixed(2)}ms (threshold: ${this.config.alertThresholds.latencyP99Ms}ms)`, {
        p99LatencyMs: metrics.p99LatencyMs,
        threshold: this.config.alertThresholds.latencyP99Ms,
      });
    }

    // Error rate alert
    if (metrics.errorRate * 100 > this.config.alertThresholds.errorRatePercent) {
      this.createAlert('CRITICAL', 'HIGH_ERROR_RATE', `Error rate is ${(metrics.errorRate * 100).toFixed(1)}% (threshold: ${this.config.alertThresholds.errorRatePercent}%)`, {
        errorRate: metrics.errorRate,
        threshold: this.config.alertThresholds.errorRatePercent / 100,
      });
    }

    // Rejection rate alert
    const rejectionRate = (metrics.rejectedChecks / metrics.totalChecks) * 100;
    if (rejectionRate > this.config.alertThresholds.rejectionRatePercent) {
      this.createAlert('WARNING', 'HIGH_REJECTION_RATE', `Rejection rate is ${rejectionRate.toFixed(1)}% (threshold: ${this.config.alertThresholds.rejectionRatePercent}%)`, {
        rejectionRate: rejectionRate / 100,
        threshold: this.config.alertThresholds.rejectionRatePercent / 100,
      });
    }

    // Low throughput alert
    if (metrics.throughput < this.config.alertThresholds.throughputMin) {
      this.createAlert('WARNING', 'LOW_THROUGHPUT', `Throughput is ${metrics.throughput.toFixed(0)} checks/sec (threshold: ${this.config.alertThresholds.throughputMin})`, {
        throughput: metrics.throughput,
        threshold: this.config.alertThresholds.throughputMin,
      });
    }
  }

  private createAlert(severity: Alert['severity'], type: string, message: string, metadata?: Record<string, any>) {
    // Deduplicate - don't create identical alert within 1 minute
    const recentAlerts = this.alerts.filter(a => Date.now() - a.timestamp < 60000);
    const isDuplicate = recentAlerts.some(a => a.type === type && a.severity === severity);

    if (isDuplicate) {
      return;
    }

    const alert: Alert = {
      id: `ALERT-${++this.alertIdCounter}`,
      severity,
      type,
      message,
      timestamp: Date.now(),
      metadata,
    };

    this.alerts.push(alert);

    // Emit alert (in production, send to monitoring system)
    console.error(`🚨 [${severity}] ${type}: ${message}`);

    // Trim old alerts (keep last 100)
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }
  }

  getRecentAlerts(count: number = 10): Alert[] {
    return this.alerts.slice(-count).reverse();
  }

  // ============================================================================
  // Periodic Monitoring
  // ============================================================================

  private startPeriodicMonitoring() {
    setInterval(() => {
      this.emitPeriodicReport();
    }, 30000); // Every 30 seconds
  }

  private emitPeriodicReport() {
    const metrics = this.getCurrentMetrics();

    if (metrics.totalChecks === 0) {
      return; // No activity to report
    }

    console.log('\n📊 [Monitor] Periodic Report');
    console.log(`   Checks: ${metrics.totalChecks} (${metrics.approvedChecks} approved, ${metrics.rejectedChecks} rejected)`);
    console.log(`   Latency: Avg ${metrics.avgLatencyMs.toFixed(2)}ms, P95 ${metrics.p95LatencyMs.toFixed(2)}ms, P99 ${metrics.p99LatencyMs.toFixed(2)}ms`);
    console.log(`   Throughput: ${metrics.throughput.toFixed(0)} checks/sec`);
    console.log(`   Error Rate: ${(metrics.errorRate * 100).toFixed(2)}%`);

    const recentAlerts = this.getRecentAlerts(3);
    if (recentAlerts.length > 0) {
      console.log(`   Recent Alerts: ${recentAlerts.length}`);
    }
  }

  // ============================================================================
  // Dashboard Data
  // ============================================================================

  getDashboardData() {
    const metrics = this.getCurrentMetrics();
    const violations = this.getViolationSummary();
    const alerts = this.getRecentAlerts(10);

    return {
      metrics,
      violations,
      alerts,
      uptime: Date.now() - this.metricsCollectionStartTime,
    };
  }

  // ============================================================================
  // Export & Reset
  // ============================================================================

  exportMetrics(): string {
    const data = {
      timestamp: new Date().toISOString(),
      metrics: this.getCurrentMetrics(),
      violations: this.getViolationSummary(),
      alerts: this.alerts,
      config: this.config,
    };

    return JSON.stringify(data, null, 2);
  }

  reset() {
    this.checkHistory = [];
    this.alerts = [];
    this.violations.clear();
    this.metricsCollectionStartTime = Date.now();
  }
}

// ============================================================================
// WebSocket Live Monitor (for dashboards)
// ============================================================================

export class LiveMonitorServer {
  private monitor: RealTimeMonitor;
  private subscribers: Set<(data: any) => void> = new Set();

  constructor(monitor: RealTimeMonitor) {
    this.monitor = monitor;
    this.startBroadcasting();
  }

  subscribe(callback: (data: any) => void) {
    this.subscribers.add(callback);
  }

  unsubscribe(callback: (data: any) => void) {
    this.subscribers.delete(callback);
  }

  private startBroadcasting() {
    setInterval(() => {
      const data = this.monitor.getDashboardData();
      this.broadcast(data);
    }, 1000); // Update every second
  }

  private broadcast(data: any) {
    for (const callback of this.subscribers) {
      callback(data);
    }
  }
}

// ============================================================================
// Example Usage
// ============================================================================

if (import.meta.main) {
  console.log('🔍 Real-Time Monitor Demo\n');

  const monitor = new RealTimeMonitor({
    metricsWindowMs: 10000, // 10 seconds for demo
    alertThresholds: {
      latencyP99Ms: 1.0,
      errorRatePercent: 1.0,
      rejectionRatePercent: 30.0,
      throughputMin: 50,
    },
  });

  // Simulate some checks
  const simulateChecks = () => {
    for (let i = 0; i < 100; i++) {
      const latency = Math.random() * 2; // 0-2ms
      const approved = Math.random() > 0.2; // 80% approval rate

      const result: RiskCheckResult = {
        approved,
        orderId: `ORD-${i}`,
        timestamp: Date.now(),
        violations: approved ? [] : ['POSITION_LIMIT_EXCEEDED'],
        latencyUs: latency * 1000,
      };

      monitor.recordCheck(result, latency);
    }
  };

  // Simulate every second for 30 seconds
  let count = 0;
  const interval = setInterval(() => {
    console.log(`\n[${++count}] Simulating 100 checks...`);
    simulateChecks();

    const metrics = monitor.getCurrentMetrics();
    console.log(`   Metrics: ${metrics.totalChecks} checks, ${metrics.avgLatencyMs.toFixed(2)}ms avg, ${metrics.throughput.toFixed(0)}/sec`);

    if (count >= 30) {
      clearInterval(interval);

      console.log('\n📊 Final Dashboard:');
      console.log(JSON.stringify(monitor.getDashboardData(), null, 2));

      console.log('\n✅ Monitor demo completed');
    }
  }, 1000);
}
