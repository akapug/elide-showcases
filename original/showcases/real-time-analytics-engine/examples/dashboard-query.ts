/**
 * Example: Dashboard query patterns.
 * Demonstrates efficient querying for real-time dashboards.
 */

import { EventBuffer } from '../src/event-buffer';
import { Event } from '../bridge/dataframe-bridge';

interface DashboardData {
  overview: {
    totalEvents: number;
    totalValue: number;
    avgValue: number;
    uniqueUsers: number;
  };
  timeSeries: Array<{
    timestamp: string;
    events: number;
    value: number;
  }>;
  topPerformers: {
    users: any[];
    eventTypes: any[];
  };
  realTimeMetrics: {
    eventsPerMinute: number;
    anomalyCount: number;
    percentiles: any;
  };
}

class DashboardQueryDemo {
  private buffer: EventBuffer;

  constructor() {
    this.buffer = new EventBuffer({
      maxSize: 20000,
      flushInterval: 5000,
      engine: 'polars'
    });
  }

  /**
   * Generate dashboard sample data.
   */
  private generateDashboardData(count: number = 10000): Event[] {
    const events: Event[] = [];
    const now = Date.now();
    const eventTypes = ['click', 'view', 'purchase', 'signup', 'share'];
    const users = Array.from({ length: 200 }, (_, i) => `user_${i}`);

    for (let i = 0; i < count; i++) {
      events.push({
        timestamp: now - Math.floor(Math.random() * 3600000), // Last hour
        event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
        user_id: users[Math.floor(Math.random() * users.length)],
        value: Math.floor(Math.random() * 1000),
        metadata: {
          page: `/page/${Math.floor(Math.random() * 10)}`,
          session: `session_${Math.floor(i / 50)}`
        }
      });
    }

    return events;
  }

  /**
   * Load sample data.
   */
  async loadSampleData(count: number = 10000): Promise<void> {
    console.log(`Loading ${count.toLocaleString()} sample events...`);
    const events = this.generateDashboardData(count);
    await this.buffer.addBatch(events);
    await this.buffer.flush();
    console.log('Data loaded!\n');
  }

  /**
   * Query all dashboard data efficiently.
   * Uses parallel queries to minimize total latency.
   */
  async queryDashboard(): Promise<DashboardData> {
    const startTime = Date.now();
    const analytics = this.buffer.getAnalytics();

    console.log('Querying dashboard data...');

    // Execute all queries in parallel for <100ms total latency
    const [
      summary,
      topUsers,
      topEvents,
      percentiles,
      anomalies,
      timeSeries
    ] = await Promise.all([
      analytics.getSummaryStats(['value']),
      analytics.topNByMetric('user_id', 'value', 5),
      analytics.topNByMetric('event_type', 'value', 5),
      analytics.calculatePercentiles('value', [0.5, 0.95, 0.99]),
      analytics.detectAnomalies('value', 3.0),
      analytics.windowedAggregation({
        windowSize: '5m',
        groupBy: 'event_type',
        metric: 'value',
        aggFunc: 'sum'
      })
    ]);

    const queryTime = Date.now() - startTime;

    // Construct dashboard data
    const dashboardData: DashboardData = {
      overview: {
        totalEvents: summary.row_count || 0,
        totalValue: 0, // Would be calculated from summary
        avgValue: 0,
        uniqueUsers: topUsers.length
      },
      timeSeries: timeSeries.map((ts: any) => ({
        timestamp: new Date(ts.timestamp).toISOString(),
        events: ts.value_count || 0,
        value: ts.value_sum || 0
      })),
      topPerformers: {
        users: topUsers,
        eventTypes: topEvents
      },
      realTimeMetrics: {
        eventsPerMinute: 0, // Would be calculated
        anomalyCount: anomalies.length,
        percentiles
      }
    };

    console.log(`✓ Dashboard data queried in ${queryTime}ms`);

    if (queryTime < 100) {
      console.log('✓ Target achieved: <100ms query latency\n');
    } else {
      console.log(`⚠ Target missed: ${queryTime}ms > 100ms\n`);
    }

    return dashboardData;
  }

  /**
   * Display dashboard in console.
   */
  displayDashboard(data: DashboardData): void {
    console.log('╔' + '═'.repeat(68) + '╗');
    console.log('║' + ' '.repeat(20) + 'REAL-TIME ANALYTICS DASHBOARD' + ' '.repeat(19) + '║');
    console.log('╚' + '═'.repeat(68) + '╝');

    // Overview
    console.log('\n📊 Overview');
    console.log('─'.repeat(70));
    console.log(`Total Events:    ${data.overview.totalEvents.toLocaleString()}`);
    console.log(`Unique Users:    ${data.overview.uniqueUsers}`);
    console.log(`Anomalies:       ${data.realTimeMetrics.anomalyCount}`);

    // Percentiles
    console.log('\n📈 Value Distribution');
    console.log('─'.repeat(70));
    console.log(`P50 (Median):    ${data.realTimeMetrics.percentiles.p50?.toFixed(2) || 'N/A'}`);
    console.log(`P95:             ${data.realTimeMetrics.percentiles.p95?.toFixed(2) || 'N/A'}`);
    console.log(`P99:             ${data.realTimeMetrics.percentiles.p99?.toFixed(2) || 'N/A'}`);

    // Top Users
    console.log('\n👥 Top 5 Users');
    console.log('─'.repeat(70));
    data.topPerformers.users.forEach((user: any, index: number) => {
      const userId = user.user_id || 'N/A';
      const value = (user.value_sum || 0).toFixed(0);
      console.log(`${index + 1}. ${userId.padEnd(20)} ${value.padStart(10)}`);
    });

    // Top Events
    console.log('\n🎯 Top Event Types');
    console.log('─'.repeat(70));
    data.topPerformers.eventTypes.forEach((event: any, index: number) => {
      const eventType = event.event_type || 'N/A';
      const value = (event.value_sum || 0).toFixed(0);
      console.log(`${index + 1}. ${eventType.padEnd(20)} ${value.padStart(10)}`);
    });

    // Time Series (recent)
    if (data.timeSeries.length > 0) {
      console.log('\n⏰ Recent Activity (5-min windows)');
      console.log('─'.repeat(70));
      data.timeSeries.slice(-6).forEach(ts => {
        const time = new Date(ts.timestamp).toLocaleTimeString();
        const value = ts.value.toFixed(0);
        console.log(`${time.padEnd(20)} ${value.padStart(10)}`);
      });
    }

    console.log('\n' + '═'.repeat(70));
    console.log('Dashboard refresh: Every 5 seconds');
    console.log('Zero-copy DataFrame queries via Elide polyglot bridge');
    console.log('═'.repeat(70) + '\n');
  }

  /**
   * Run live dashboard with periodic updates.
   */
  async runLiveDashboard(updateInterval: number = 5000, durationMs: number = 60000): Promise<void> {
    console.log('Starting live dashboard...');
    console.log(`Update interval: ${updateInterval}ms`);
    console.log(`Duration: ${durationMs}ms\n`);

    // Load initial data
    await this.loadSampleData(10000);

    // Continuously add new events
    const eventGenerator = setInterval(async () => {
      const newEvents = this.generateDashboardData(100);
      await this.buffer.addBatch(newEvents);
    }, 1000);

    // Update dashboard periodically
    const updateDashboard = setInterval(async () => {
      const data = await this.queryDashboard();
      console.clear();
      this.displayDashboard(data);
    }, updateInterval);

    // Stop after duration
    setTimeout(() => {
      clearInterval(eventGenerator);
      clearInterval(updateDashboard);
      console.log('Live dashboard stopped');
      this.stop();
    }, durationMs);
  }

  /**
   * Demonstrate query optimization.
   */
  async demonstrateQueryOptimization(): Promise<void> {
    console.log('\n🔬 Query Optimization Demo');
    console.log('='.repeat(70));

    await this.loadSampleData(50000);

    // Test 1: Sequential queries (slower)
    console.log('\n1. Sequential Queries (Traditional Approach):');
    const seq1 = Date.now();
    await this.buffer.getAnalytics().getSummaryStats();
    await this.buffer.getAnalytics().topNByMetric('user_id', 'value', 5);
    await this.buffer.getAnalytics().calculatePercentiles('value');
    const seqTime = Date.now() - seq1;
    console.log(`   Time: ${seqTime}ms`);

    // Test 2: Parallel queries (faster with Elide)
    console.log('\n2. Parallel Queries (Elide Polyglot Approach):');
    const par1 = Date.now();
    await Promise.all([
      this.buffer.getAnalytics().getSummaryStats(),
      this.buffer.getAnalytics().topNByMetric('user_id', 'value', 5),
      this.buffer.getAnalytics().calculatePercentiles('value')
    ]);
    const parTime = Date.now() - par1;
    console.log(`   Time: ${parTime}ms`);

    console.log(`\n✓ Speedup: ${(seqTime / parTime).toFixed(2)}x faster with parallel queries`);
    console.log('\nElide Advantage:');
    console.log('  - Zero-copy DataFrame access');
    console.log('  - No serialization overhead');
    console.log('  - Efficient parallel query execution');
    console.log('  - Direct memory sharing between TypeScript and Python');
    console.log('='.repeat(70) + '\n');
  }

  stop(): void {
    this.buffer.stop();
  }
}

// Example usage
async function main() {
  const demo = new DashboardQueryDemo();

  // Demo 1: Single dashboard query
  await demo.loadSampleData(10000);
  const data = await demo.queryDashboard();
  demo.displayDashboard(data);

  // Demo 2: Query optimization comparison
  await demo.demonstrateQueryOptimization();

  // Demo 3: Live dashboard (uncomment to run)
  // await demo.runLiveDashboard(5000, 60000);

  demo.stop();
}

// Run the demo
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { DashboardQueryDemo };
