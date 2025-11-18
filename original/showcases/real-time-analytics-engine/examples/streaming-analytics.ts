/**
 * Example: Streaming analytics with real-time event processing.
 * Demonstrates continuous event ingestion and live analytics queries.
 */

import { EventBuffer } from '../src/event-buffer';
import { Event } from '../bridge/dataframe-bridge';

interface StreamMetrics {
  totalEvents: number;
  eventsPerSecond: number;
  topUsers: any[];
  topEvents: any[];
  anomalies: any[];
}

class StreamingAnalyticsDemo {
  private buffer: EventBuffer;
  private isRunning = false;
  private eventCount = 0;
  private startTime = 0;

  constructor() {
    this.buffer = new EventBuffer({
      maxSize: 5000,
      flushInterval: 1000,
      engine: 'polars' // Use Polars for maximum performance
    });
  }

  /**
   * Generate realistic streaming events.
   */
  private generateStreamEvent(): Event {
    const eventTypes = [
      'page_view',
      'button_click',
      'form_submit',
      'purchase',
      'add_to_cart',
      'search',
      'video_play',
      'download'
    ];

    const users = Array.from({ length: 100 }, (_, i) => `user_${i}`);
    const values = [10, 25, 50, 75, 100, 250, 500, 1000];

    // Occasionally generate outliers for anomaly detection
    const isAnomaly = Math.random() < 0.01;
    const value = isAnomaly ? 10000 : values[Math.floor(Math.random() * values.length)];

    return {
      timestamp: Date.now(),
      event_type: eventTypes[Math.floor(Math.random() * eventTypes.length)],
      user_id: users[Math.floor(Math.random() * users.length)],
      value,
      metadata: {
        source: Math.random() > 0.5 ? 'web' : 'mobile',
        country: ['US', 'UK', 'CA', 'AU', 'DE'][Math.floor(Math.random() * 5)],
        anomaly: isAnomaly
      }
    };
  }

  /**
   * Start streaming event ingestion.
   */
  async startStreaming(eventsPerSecond: number = 1000): Promise<void> {
    this.isRunning = true;
    this.startTime = Date.now();

    console.log(`Starting streaming analytics at ${eventsPerSecond} events/sec...`);
    console.log('Press Ctrl+C to stop\n');

    const intervalMs = 1000 / eventsPerSecond;
    let batchSize = Math.max(1, Math.floor(eventsPerSecond / 10)); // Send in batches

    const streamInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(streamInterval);
        return;
      }

      const batch: Event[] = [];
      for (let i = 0; i < batchSize; i++) {
        batch.push(this.generateStreamEvent());
      }

      await this.buffer.addBatch(batch);
      this.eventCount += batch.length;
    }, intervalMs * batchSize);
  }

  /**
   * Query real-time analytics metrics.
   */
  async getMetrics(): Promise<StreamMetrics> {
    const analytics = this.buffer.getAnalytics();
    const uptime = (Date.now() - this.startTime) / 1000;
    const eventsPerSecond = uptime > 0 ? this.eventCount / uptime : 0;

    try {
      const [topUsers, topEvents, anomalies] = await Promise.all([
        analytics.topNByMetric('user_id', 'value', 5),
        analytics.topNByMetric('event_type', 'value', 5),
        analytics.detectAnomalies('value', 3.0)
      ]);

      return {
        totalEvents: this.eventCount,
        eventsPerSecond: Math.round(eventsPerSecond),
        topUsers: topUsers || [],
        topEvents: topEvents || [],
        anomalies: anomalies || []
      };
    } catch (error) {
      return {
        totalEvents: this.eventCount,
        eventsPerSecond: Math.round(eventsPerSecond),
        topUsers: [],
        topEvents: [],
        anomalies: []
      };
    }
  }

  /**
   * Start live metrics dashboard.
   */
  async startDashboard(updateInterval: number = 5000): Promise<void> {
    console.log('Real-Time Analytics Dashboard');
    console.log('='.repeat(60));

    const dashboardInterval = setInterval(async () => {
      if (!this.isRunning) {
        clearInterval(dashboardInterval);
        return;
      }

      const metrics = await this.getMetrics();

      console.clear();
      console.log('Real-Time Analytics Dashboard');
      console.log('='.repeat(60));
      console.log(`Total Events:       ${metrics.totalEvents.toLocaleString()}`);
      console.log(`Events/Second:      ${metrics.eventsPerSecond.toLocaleString()}`);
      console.log(`Buffer Size:        ${this.buffer.size()}`);
      console.log(`Anomalies Detected: ${metrics.anomalies.length}`);
      console.log();

      console.log('Top 5 Users by Value:');
      console.log('-'.repeat(60));
      metrics.topUsers.slice(0, 5).forEach((user: any, index: number) => {
        console.log(`${index + 1}. ${user.user_id || 'N/A'}: ${(user.value_sum || 0).toLocaleString()}`);
      });
      console.log();

      console.log('Top 5 Events by Value:');
      console.log('-'.repeat(60));
      metrics.topEvents.slice(0, 5).forEach((event: any, index: number) => {
        console.log(`${index + 1}. ${event.event_type || 'N/A'}: ${(event.value_sum || 0).toLocaleString()}`);
      });
      console.log();

      if (metrics.anomalies.length > 0) {
        console.log('Recent Anomalies:');
        console.log('-'.repeat(60));
        metrics.anomalies.slice(0, 3).forEach((anomaly: any) => {
          console.log(`- User: ${anomaly.user_id}, Value: ${anomaly.value}, Z-Score: ${anomaly.z_score?.toFixed(2)}`);
        });
        console.log();
      }

      console.log('='.repeat(60));
      console.log('Press Ctrl+C to stop');
    }, updateInterval);
  }

  /**
   * Perform windowed analysis.
   */
  async windowedAnalysis(): Promise<void> {
    const analytics = this.buffer.getAnalytics();

    console.log('\nPerforming windowed analysis...');

    const windows = await analytics.windowedAggregation({
      windowSize: '1m',
      groupBy: 'event_type',
      metric: 'value',
      aggFunc: 'sum'
    });

    console.log('\n1-Minute Window Aggregations:');
    console.log('-'.repeat(60));
    windows.forEach((window: any) => {
      console.log(`${window.timestamp || 'N/A'} | ${window.event_type || 'N/A'}: ${window.value_sum || 0}`);
    });
  }

  /**
   * Stop streaming.
   */
  stop(): void {
    this.isRunning = false;
    this.buffer.stop();
    console.log('\nStreaming stopped');
    console.log(`Total events processed: ${this.eventCount.toLocaleString()}`);
  }
}

// Example usage
async function main() {
  const demo = new StreamingAnalyticsDemo();

  // Start streaming at 1000 events/sec
  await demo.startStreaming(1000);

  // Start live dashboard (updates every 5 seconds)
  await demo.startDashboard(5000);

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down...');
    demo.stop();
    process.exit(0);
  });

  // Run for 60 seconds, then perform windowed analysis
  setTimeout(async () => {
    await demo.windowedAnalysis();
  }, 60000);
}

// Run the demo
if (require.main === module) {
  main().catch(error => {
    console.error('Error:', error);
    process.exit(1);
  });
}

export { StreamingAnalyticsDemo };
