/**
 * Business Metrics Monitoring Example
 * Detect anomalies in KPIs, revenue, user behavior, and operational metrics.
 */

import { ModelManager } from '../core/model-manager.js';
import { RealtimeScorer } from '../core/scorer.js';
import { AlertManager } from '../core/alert-manager.js';
import { SlidingWindowBuffer } from '../core/event-buffer.js';

interface BusinessMetrics {
  timestamp: number;
  revenue: number;
  activeUsers: number;
  conversionRate: number;
  averageOrderValue: number;
  pageLoadTime: number;
  errorRate: number;
  apiLatency: number;
}

class BusinessMetricsMonitor {
  private modelManager: ModelManager;
  private scorer: RealtimeScorer;
  private alertManager: AlertManager;
  private revenueBuffer: SlidingWindowBuffer;

  constructor() {
    this.modelManager = new ModelManager('./models');
    this.scorer = new RealtimeScorer(this.modelManager, 100);
    this.alertManager = new AlertManager();
    this.revenueBuffer = new SlidingWindowBuffer(24); // 24-hour window

    this.configureBusinessAlerts();
  }

  async initialize(): Promise<void> {
    console.log('📈 Business Metrics Anomaly Detection');
    console.log('='.repeat(80));
    console.log('Initializing...\n');

    await this.modelManager.initialize();

    // Generate training data from historical business metrics
    console.log('Analyzing historical business data...');
    const trainingData = this.generateHistoricalMetrics(2000);

    // Train time-series model for business metrics
    console.log('Training business metrics model...');
    const tsData = trainingData.map(d => d[0]); // Revenue as primary metric

    const metadata = await this.modelManager.trainModel(
      'timeseries',
      tsData.map(v => [v]),
      {
        contamination: 0.05,
        window_size: 24
      }
    );

    console.log(`Model trained on ${metadata.nSamples} historical data points`);
    console.log(`Training time: ${metadata.performance?.trainingTime.toFixed(0)}ms\n`);

    await this.modelManager.loadModel('timeseries');
  }

  async monitorMetrics(): Promise<void> {
    console.log('Starting real-time business metrics monitoring...\n');
    console.log('='.repeat(80));

    let metricCount = 0;
    let anomalyCount = 0;
    const anomalies: Array<{ type: string; metrics: BusinessMetrics; score: number }> = [];

    // Track different anomaly types
    const anomalyTypes = {
      revenueDrop: 0,
      userSpike: 0,
      conversionDrop: 0,
      performanceIssue: 0,
      errorSpike: 0
    };

    // Listen for business metric alerts
    this.alertManager.on('alert', (alert) => {
      if (alert.severity === 'critical' || alert.severity === 'high') {
        console.log(`\n💼 BUSINESS ALERT: ${alert.severity.toUpperCase()}`);
        console.log(`   ${alert.message}`);
        console.log(`   Investigation required!\n`);
      }
    });

    console.log('Monitoring business metrics (simulating 24 hours in 30 seconds)...\n');

    const totalDuration = 30000; // 30 seconds
    const hoursToSimulate = 24;
    const interval = totalDuration / hoursToSimulate;
    const startTime = Date.now();

    for (let hour = 0; hour < hoursToSimulate; hour++) {
      // Generate metrics for this hour
      let metrics: BusinessMetrics;

      // Simulate different business scenarios
      if (hour === 10) {
        // Morning revenue drop (system issue)
        metrics = this.simulateRevenueDrop(hour);
        anomalies.push({ type: 'Revenue Drop', metrics, score: 0 });
        anomalyTypes.revenueDrop++;
      } else if (hour === 15) {
        // Afternoon traffic spike (viral content)
        metrics = this.simulateUserSpike(hour);
        anomalies.push({ type: 'User Spike', metrics, score: 0 });
        anomalyTypes.userSpike++;
      } else if (hour === 18) {
        // Evening conversion rate drop
        metrics = this.simulateConversionDrop(hour);
        anomalies.push({ type: 'Conversion Drop', metrics, score: 0 });
        anomalyTypes.conversionDrop++;
      } else if (hour === 21) {
        // Late night performance degradation
        metrics = this.simulatePerformanceIssue(hour);
        anomalies.push({ type: 'Performance Issue', metrics, score: 0 });
        anomalyTypes.performanceIssue++;
      } else {
        // Normal business operations
        metrics = this.generateNormalMetrics(hour);
      }

      // Update revenue buffer
      this.revenueBuffer.push(metrics.revenue);

      // Convert to event (use time-series approach)
      const event = {
        id: `metrics_${metrics.timestamp}`,
        timestamp: metrics.timestamp,
        features: [metrics.revenue], // Primary metric for time-series
        metadata: { hour, ...metrics }
      };

      try {
        const result = await this.scorer.scoreEvent(event, {
          algorithm: 'timeseries'
        });

        if (result.isAnomaly) {
          anomalyCount++;

          // Update anomaly score
          if (anomalies.length > 0 && anomalies[anomalies.length - 1].score === 0) {
            anomalies[anomalies.length - 1].score = result.score;
          }
        }

        metricCount++;

        // Process alert
        await this.alertManager.processResult(result);

        // Display hourly summary
        const bufferStats = this.revenueBuffer.getStats();
        console.log(
          `Hour ${hour.toString().padStart(2, '0')}:00 | ` +
          `Revenue: $${metrics.revenue.toFixed(0).padStart(6)} | ` +
          `Users: ${metrics.activeUsers.toString().padStart(5)} | ` +
          `Conv: ${(metrics.conversionRate * 100).toFixed(1)}% | ` +
          `${result.isAnomaly ? '⚠️  ANOMALY' : '✓ Normal'} | ` +
          `Score: ${result.score.toFixed(3)}`
        );

      } catch (error: any) {
        console.error(`\nError processing hour ${hour}:`, error.message);
      }

      await this.sleep(interval);
    }

    console.log('\n' + '='.repeat(80));
    this.printSummary(metricCount, anomalyCount, anomalies, anomalyTypes);
  }

  generateNormalMetrics(hour: number): BusinessMetrics {
    // Business varies by hour (higher during business hours)
    const hourFactor = this.getHourlyFactor(hour);

    return {
      timestamp: Date.now(),
      revenue: this.randomNormal(10000, 1000) * hourFactor,
      activeUsers: Math.floor(this.randomNormal(1000, 100) * hourFactor),
      conversionRate: this.randomNormal(0.03, 0.005),
      averageOrderValue: this.randomNormal(150, 20),
      pageLoadTime: this.randomNormal(1.5, 0.3),
      errorRate: this.randomNormal(0.01, 0.002),
      apiLatency: this.randomNormal(100, 20)
    };
  }

  simulateRevenueDrop(hour: number): BusinessMetrics {
    const hourFactor = this.getHourlyFactor(hour);
    return {
      timestamp: Date.now(),
      revenue: this.randomNormal(3000, 500) * hourFactor, // 70% drop
      activeUsers: Math.floor(this.randomNormal(1000, 100) * hourFactor),
      conversionRate: this.randomNormal(0.01, 0.002), // Conversion issues
      averageOrderValue: this.randomNormal(150, 20),
      pageLoadTime: this.randomNormal(5, 1), // Slow page loads
      errorRate: this.randomNormal(0.05, 0.01), // More errors
      apiLatency: this.randomNormal(500, 100) // High latency
    };
  }

  simulateUserSpike(hour: number): BusinessMetrics {
    const hourFactor = this.getHourlyFactor(hour);
    return {
      timestamp: Date.now(),
      revenue: this.randomNormal(15000, 2000) * hourFactor,
      activeUsers: Math.floor(this.randomNormal(5000, 500) * hourFactor), // 5x users
      conversionRate: this.randomNormal(0.025, 0.005), // Lower conversion
      averageOrderValue: this.randomNormal(150, 20),
      pageLoadTime: this.randomNormal(2.5, 0.5), // Slight slowdown
      errorRate: this.randomNormal(0.015, 0.003),
      apiLatency: this.randomNormal(150, 30)
    };
  }

  simulateConversionDrop(hour: number): BusinessMetrics {
    const hourFactor = this.getHourlyFactor(hour);
    return {
      timestamp: Date.now(),
      revenue: this.randomNormal(7000, 1000) * hourFactor, // Revenue affected
      activeUsers: Math.floor(this.randomNormal(1000, 100) * hourFactor),
      conversionRate: this.randomNormal(0.01, 0.002), // 66% drop
      averageOrderValue: this.randomNormal(150, 20),
      pageLoadTime: this.randomNormal(1.5, 0.3),
      errorRate: this.randomNormal(0.01, 0.002),
      apiLatency: this.randomNormal(100, 20)
    };
  }

  simulatePerformanceIssue(hour: number): BusinessMetrics {
    const hourFactor = this.getHourlyFactor(hour);
    return {
      timestamp: Date.now(),
      revenue: this.randomNormal(8000, 1000) * hourFactor,
      activeUsers: Math.floor(this.randomNormal(1000, 100) * hourFactor),
      conversionRate: this.randomNormal(0.025, 0.005),
      averageOrderValue: this.randomNormal(150, 20),
      pageLoadTime: this.randomNormal(8, 2), // Very slow
      errorRate: this.randomNormal(0.08, 0.02), // High errors
      apiLatency: this.randomNormal(800, 200) // Very high latency
    };
  }

  getHourlyFactor(hour: number): number {
    // Business hours have higher activity
    if (hour >= 9 && hour <= 17) {
      return 1.5;
    } else if (hour >= 18 && hour <= 22) {
      return 1.2;
    } else {
      return 0.6;
    }
  }

  generateHistoricalMetrics(nSamples: number): number[][] {
    return Array.from({ length: nSamples }, (_, i) => {
      const hour = i % 24;
      const metrics = this.generateNormalMetrics(hour);
      return [
        metrics.revenue,
        metrics.activeUsers,
        metrics.conversionRate * 100,
        metrics.averageOrderValue,
        metrics.pageLoadTime,
        metrics.errorRate * 100,
        metrics.apiLatency
      ];
    });
  }

  configureBusinessAlerts(): void {
    this.alertManager.addRule({
      id: 'business_critical',
      name: 'Critical Business Anomaly',
      enabled: true,
      scoreThreshold: 0.8,
      confidenceThreshold: 0.7,
      severity: 'critical',
      cooldownMs: 60000
    });

    this.alertManager.addRule({
      id: 'business_high',
      name: 'Significant Business Change',
      enabled: true,
      scoreThreshold: 0.6,
      confidenceThreshold: 0.6,
      severity: 'high',
      cooldownMs: 120000
    });

    this.alertManager.addChannel({
      type: 'log',
      enabled: true,
      config: {}
    });
  }

  printSummary(
    metricCount: number,
    anomalyCount: number,
    anomalies: any[],
    anomalyTypes: any
  ): void {
    console.log('BUSINESS METRICS SUMMARY');
    console.log('='.repeat(80));

    const stats = this.scorer.getStats();
    const alertStats = this.alertManager.getStats();
    const revenueStats = this.revenueBuffer.getStats();

    console.log(`Total Hours Analyzed:  ${metricCount}`);
    console.log(`Anomalies Detected:    ${anomalyCount} (${(anomalyCount / metricCount * 100).toFixed(1)}%)`);
    console.log(`Detection Latency:     ${stats.avgLatencyMs.toFixed(2)}ms`);

    console.log(`\nRevenue Statistics (24h window):`);
    console.log(`  Mean:                $${revenueStats.mean.toFixed(2)}`);
    console.log(`  Std Dev:             $${revenueStats.std.toFixed(2)}`);
    console.log(`  Min:                 $${revenueStats.min.toFixed(2)}`);
    console.log(`  Max:                 $${revenueStats.max.toFixed(2)}`);

    console.log(`\nAnomalies by Type:`);
    for (const [type, count] of Object.entries(anomalyTypes)) {
      if (count > 0) {
        console.log(`  ${type}: ${count}`);
      }
    }

    console.log(`\nAlerts Generated:`);
    console.log(`  Total:               ${alertStats.total}`);
    console.log(`  Critical:            ${alertStats.bySeverity.critical}`);
    console.log(`  High:                ${alertStats.bySeverity.high}`);

    console.log('='.repeat(80));
    console.log('\n✅ Business metrics monitoring complete!');
  }

  randomNormal(mean: number, std: number): number {
    const u1 = Math.random();
    const u2 = Math.random();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, mean + z * std);
  }

  sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run example
async function main() {
  const monitor = new BusinessMetricsMonitor();

  try {
    await monitor.initialize();
    await monitor.monitorMetrics();
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

main();
