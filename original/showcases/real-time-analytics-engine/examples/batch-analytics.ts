/**
 * Example: Batch analytics processing.
 * Demonstrates processing large datasets with pandas/polars.
 */

import { EventBuffer } from '../src/event-buffer';
import { Event } from '../bridge/dataframe-bridge';

interface AnalyticsReport {
  summary: any;
  topUsers: any[];
  topEvents: any[];
  percentiles: any;
  hourlyTrends: any[];
  conversionFunnel: any;
}

class BatchAnalyticsDemo {
  private buffer: EventBuffer;

  constructor(engine: 'pandas' | 'polars' = 'polars') {
    this.buffer = new EventBuffer({
      maxSize: 50000,
      flushInterval: 60000,
      engine
    });
  }

  /**
   * Generate batch of historical events.
   */
  private generateBatchEvents(count: number, hoursAgo: number = 24): Event[] {
    const events: Event[] = [];
    const now = Date.now();
    const timeSpan = hoursAgo * 60 * 60 * 1000;

    const eventTypes = [
      'landing_page_view',
      'product_view',
      'add_to_cart',
      'checkout_start',
      'purchase_complete'
    ];

    const users = Array.from({ length: 500 }, (_, i) => `user_${i}`);

    for (let i = 0; i < count; i++) {
      const timestamp = now - Math.floor(Math.random() * timeSpan);
      const userId = users[Math.floor(Math.random() * users.length)];
      const eventType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      events.push({
        timestamp,
        event_type: eventType,
        user_id: userId,
        value: Math.floor(Math.random() * 500) + 10,
        metadata: {
          device: ['mobile', 'desktop', 'tablet'][Math.floor(Math.random() * 3)],
          channel: ['organic', 'paid', 'email', 'social'][Math.floor(Math.random() * 4)]
        }
      });
    }

    return events.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Load batch data into analytics engine.
   */
  async loadData(eventCount: number): Promise<void> {
    console.log(`Loading ${eventCount.toLocaleString()} events for batch analysis...`);

    const startTime = Date.now();
    const events = this.generateBatchEvents(eventCount);

    await this.buffer.addBatch(events);
    await this.buffer.flush();

    const duration = Date.now() - startTime;
    console.log(`Data loaded in ${duration}ms`);
    console.log(`Loading rate: ${Math.round(eventCount / duration * 1000).toLocaleString()} events/sec\n`);
  }

  /**
   * Run comprehensive analytics report.
   */
  async generateReport(): Promise<AnalyticsReport> {
    console.log('Generating analytics report...\n');

    const analytics = this.buffer.getAnalytics();
    const startTime = Date.now();

    // Run all analytics operations in parallel
    const [
      summary,
      topUsers,
      topEvents,
      percentiles,
      hourlyTrends,
      conversionFunnel
    ] = await Promise.all([
      analytics.getSummaryStats(['value']),
      analytics.topNByMetric('user_id', 'value', 10),
      analytics.topNByMetric('event_type', 'value', 10),
      analytics.calculatePercentiles('value', [0.25, 0.5, 0.75, 0.95, 0.99]),
      analytics.windowedAggregation({
        windowSize: '1h',
        groupBy: 'event_type',
        metric: 'value',
        aggFunc: 'sum'
      }),
      analytics.conversionFunnel([
        'landing_page_view',
        'product_view',
        'add_to_cart',
        'checkout_start',
        'purchase_complete'
      ])
    ]);

    const queryTime = Date.now() - startTime;
    console.log(`Report generated in ${queryTime}ms\n`);

    return {
      summary,
      topUsers,
      topEvents,
      percentiles,
      hourlyTrends,
      conversionFunnel
    };
  }

  /**
   * Print detailed analytics report.
   */
  printReport(report: AnalyticsReport): void {
    console.log('='.repeat(70));
    console.log('BATCH ANALYTICS REPORT');
    console.log('='.repeat(70));

    // Summary Statistics
    console.log('\n📊 Summary Statistics:');
    console.log('-'.repeat(70));
    console.log(`Total Events:    ${report.summary.row_count?.toLocaleString() || 'N/A'}`);
    console.log(`Memory Usage:    ${((report.summary.memory_usage || report.summary.estimated_size || 0) / 1024 / 1024).toFixed(2)} MB`);
    console.log();

    // Percentiles
    console.log('📈 Value Percentiles:');
    console.log('-'.repeat(70));
    Object.entries(report.percentiles).forEach(([key, value]) => {
      console.log(`${key.toUpperCase()}: ${(value as number).toFixed(2)}`);
    });
    console.log();

    // Top Users
    console.log('👥 Top 10 Users by Total Value:');
    console.log('-'.repeat(70));
    report.topUsers.slice(0, 10).forEach((user: any, index: number) => {
      const userId = user.user_id || 'N/A';
      const value = (user.value_sum || 0).toLocaleString();
      console.log(`${String(index + 1).padStart(2)}. ${userId.padEnd(15)} ${value.padStart(10)}`);
    });
    console.log();

    // Top Events
    console.log('🎯 Top Events by Total Value:');
    console.log('-'.repeat(70));
    report.topEvents.forEach((event: any, index: number) => {
      const eventType = event.event_type || 'N/A';
      const value = (event.value_sum || 0).toLocaleString();
      console.log(`${String(index + 1).padStart(2)}. ${eventType.padEnd(25)} ${value.padStart(10)}`);
    });
    console.log();

    // Conversion Funnel
    console.log('🔄 Conversion Funnel:');
    console.log('-'.repeat(70));
    Object.entries(report.conversionFunnel).forEach(([step, data]: [string, any]) => {
      const count = data.count?.toLocaleString() || '0';
      const percentage = data.percentage?.toFixed(2) || '0.00';
      console.log(`${step.padEnd(25)} ${count.padStart(8)} (${percentage}%)`);
    });
    console.log();

    // Hourly Trends (sample)
    if (report.hourlyTrends.length > 0) {
      console.log('⏰ Hourly Trends (Last 6 Hours):');
      console.log('-'.repeat(70));
      report.hourlyTrends.slice(-6).forEach((trend: any) => {
        const timestamp = new Date(trend.timestamp).toLocaleTimeString() || 'N/A';
        const eventType = trend.event_type || 'N/A';
        const value = (trend.value_sum || 0).toLocaleString();
        console.log(`${timestamp.padEnd(15)} ${eventType.padEnd(25)} ${value.padStart(10)}`);
      });
      console.log();
    }

    console.log('='.repeat(70));
  }

  /**
   * Perform cohort analysis.
   */
  async cohortAnalysis(): Promise<void> {
    console.log('\n📊 Cohort Analysis:');
    console.log('-'.repeat(70));

    const analytics = this.buffer.getAnalytics();

    // Analyze by device type
    const deviceAnalysis = await analytics.computeAggregations(
      ['metadata'], // In real scenario, would extract device from metadata
      ['value']
    );

    console.log('Analysis complete (requires metadata extraction)\n');
  }

  /**
   * Compare performance: Pandas vs Polars.
   */
  static async compareEngines(eventCount: number): Promise<void> {
    console.log('\n🔬 Performance Comparison: Pandas vs Polars');
    console.log('='.repeat(70));

    for (const engine of ['pandas', 'polars'] as const) {
      console.log(`\nTesting ${engine.toUpperCase()}...`);

      const demo = new BatchAnalyticsDemo(engine);
      const startTime = Date.now();

      await demo.loadData(eventCount);
      const report = await demo.generateReport();

      const totalTime = Date.now() - startTime;
      console.log(`Total processing time: ${totalTime}ms`);

      demo.stop();
    }

    console.log('\n' + '='.repeat(70));
  }

  stop(): void {
    this.buffer.stop();
  }
}

// Example usage
async function main() {
  console.log('Batch Analytics Demo');
  console.log('Processing historical event data with pandas/polars\n');

  // Create demo with Polars (faster than pandas)
  const demo = new BatchAnalyticsDemo('polars');

  // Load 50,000 events
  await demo.loadData(50000);

  // Generate comprehensive report
  const report = await demo.generateReport();

  // Print the report
  demo.printReport(report);

  // Perform cohort analysis
  await demo.cohortAnalysis();

  // Compare pandas vs polars performance
  await BatchAnalyticsDemo.compareEngines(10000);

  demo.stop();

  console.log('\n✓ Batch analytics demo complete!');
}

// Run the demo
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { BatchAnalyticsDemo };
