/**
 * IoT Platform Throughput Benchmark
 *
 * Performance benchmarking for the IoT platform:
 * - Message throughput testing
 * - Latency measurement
 * - Connection scalability
 * - Resource utilization
 * - Load testing scenarios
 */

import mqtt from 'mqtt';
import { nanoid } from 'nanoid';
import pino from 'pino';
import { EventEmitter } from 'events';

const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: { colorize: true },
  },
});

// Configuration
const CONFIG = {
  mqttBroker: process.env.MQTT_BROKER || 'mqtt://localhost:1883',
  deviceCount: parseInt(process.env.DEVICE_COUNT || '1000'),
  duration: parseInt(process.env.DURATION || '60'), // seconds
  messageRate: parseInt(process.env.MESSAGE_RATE || '10'), // messages per second per device
  payloadSize: parseInt(process.env.PAYLOAD_SIZE || '256'), // bytes
  rampUpTime: parseInt(process.env.RAMP_UP_TIME || '10'), // seconds
};

interface BenchmarkResult {
  deviceCount: number;
  duration: number;
  totalMessages: number;
  successfulMessages: number;
  failedMessages: number;
  throughput: number;
  avgLatency: number;
  p50Latency: number;
  p95Latency: number;
  p99Latency: number;
  maxLatency: number;
  minLatency: number;
  errorsPerSecond: number;
}

/**
 * Benchmark device
 */
class BenchmarkDevice extends EventEmitter {
  private id: string;
  private client: mqtt.MqttClient | null = null;
  private messagesSent = 0;
  private messagesAcked = 0;
  private messagesFailed = 0;
  private latencies: number[] = [];
  private running = false;

  constructor(id: string) {
    super();
    this.id = id;
  }

  /**
   * Connect to broker
   */
  async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Connection timeout'));
      }, 10000);

      this.client = mqtt.connect(CONFIG.mqttBroker, {
        clientId: this.id,
        clean: true,
        keepalive: 60,
        reconnectPeriod: 0, // Disable auto-reconnect for benchmarking
        username: this.id,
        password: 'benchmark-password',
      });

      this.client.on('connect', () => {
        clearTimeout(timeout);
        resolve();
      });

      this.client.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      this.client.on('close', () => {
        this.emit('disconnected');
      });
    });
  }

  /**
   * Start sending messages
   */
  start(): void {
    this.running = true;
    const interval = 1000 / CONFIG.messageRate;

    const sendMessage = () => {
      if (!this.running || !this.client?.connected) {
        return;
      }

      const startTime = Date.now();
      const payload = this.generatePayload();

      this.client.publish(
        `devices/${this.id}/telemetry`,
        JSON.stringify(payload),
        { qos: 1 },
        (err) => {
          const latency = Date.now() - startTime;

          if (err) {
            this.messagesFailed++;
            this.emit('error', err);
          } else {
            this.messagesAcked++;
            this.latencies.push(latency);
            this.emit('message', latency);
          }
        }
      );

      this.messagesSent++;

      if (this.running) {
        setTimeout(sendMessage, interval);
      }
    };

    sendMessage();
  }

  /**
   * Stop sending messages
   */
  stop(): void {
    this.running = false;

    if (this.client) {
      this.client.end(true);
      this.client = null;
    }
  }

  /**
   * Generate payload
   */
  private generatePayload(): any {
    const data: any = {
      timestamp: Date.now(),
      deviceId: this.id,
      metrics: {
        temperature: 20 + Math.random() * 10,
        humidity: 40 + Math.random() * 20,
        pressure: 1000 + Math.random() * 20,
      },
    };

    // Pad to desired size
    const currentSize = JSON.stringify(data).length;
    if (currentSize < CONFIG.payloadSize) {
      data.padding = 'x'.repeat(CONFIG.payloadSize - currentSize - 20);
    }

    return data;
  }

  /**
   * Get statistics
   */
  getStats(): any {
    return {
      deviceId: this.id,
      messagesSent: this.messagesSent,
      messagesAcked: this.messagesAcked,
      messagesFailed: this.messagesFailed,
      avgLatency: this.calculateAvgLatency(),
      latencies: this.latencies,
    };
  }

  /**
   * Calculate average latency
   */
  private calculateAvgLatency(): number {
    if (this.latencies.length === 0) return 0;
    return this.latencies.reduce((a, b) => a + b, 0) / this.latencies.length;
  }
}

/**
 * Throughput Benchmark
 */
class ThroughputBenchmark {
  private devices: BenchmarkDevice[] = [];
  private startTime = 0;
  private endTime = 0;
  private allLatencies: number[] = [];
  private totalMessages = 0;
  private totalErrors = 0;

  /**
   * Run benchmark
   */
  async run(): Promise<BenchmarkResult> {
    logger.info(CONFIG, 'Starting throughput benchmark');

    // Create devices
    logger.info({ count: CONFIG.deviceCount }, 'Creating devices');
    for (let i = 0; i < CONFIG.deviceCount; i++) {
      const device = new BenchmarkDevice(`bench-${String(i).padStart(6, '0')}`);

      device.on('message', (latency: number) => {
        this.allLatencies.push(latency);
        this.totalMessages++;
      });

      device.on('error', (error: Error) => {
        this.totalErrors++;
      });

      this.devices.push(device);
    }

    // Connect devices (with ramp-up)
    logger.info({ rampUpTime: CONFIG.rampUpTime }, 'Connecting devices');
    await this.connectDevices();

    // Start benchmark
    logger.info({ duration: CONFIG.duration }, 'Starting message transmission');
    this.startTime = Date.now();

    // Start all devices
    for (const device of this.devices) {
      device.start();
    }

    // Run for specified duration
    await this.sleep(CONFIG.duration * 1000);

    // Stop all devices
    this.endTime = Date.now();
    logger.info('Stopping devices');
    for (const device of this.devices) {
      device.stop();
    }

    // Calculate results
    const results = this.calculateResults();

    // Print results
    this.printResults(results);

    return results;
  }

  /**
   * Connect devices with ramp-up
   */
  private async connectDevices(): Promise<void> {
    const batchSize = Math.ceil(CONFIG.deviceCount / (CONFIG.rampUpTime * 10));
    const batchDelay = 100; // 100ms between batches

    for (let i = 0; i < this.devices.length; i += batchSize) {
      const batch = this.devices.slice(i, i + batchSize);
      const promises = batch.map((device) => device.connect());

      try {
        await Promise.all(promises);
        logger.debug({ connected: i + batch.length }, 'Devices connected');
      } catch (error) {
        logger.error({ error }, 'Failed to connect device batch');
      }

      if (i + batchSize < this.devices.length) {
        await this.sleep(batchDelay);
      }
    }

    logger.info({ total: this.devices.length }, 'All devices connected');
  }

  /**
   * Calculate benchmark results
   */
  private calculateResults(): BenchmarkResult {
    const duration = (this.endTime - this.startTime) / 1000; // seconds

    // Aggregate stats from all devices
    let totalSent = 0;
    let totalAcked = 0;
    let totalFailed = 0;

    for (const device of this.devices) {
      const stats = device.getStats();
      totalSent += stats.messagesSent;
      totalAcked += stats.messagesAcked;
      totalFailed += stats.messagesFailed;
    }

    // Calculate latency percentiles
    const sortedLatencies = this.allLatencies.sort((a, b) => a - b);
    const p50Index = Math.floor(sortedLatencies.length * 0.5);
    const p95Index = Math.floor(sortedLatencies.length * 0.95);
    const p99Index = Math.floor(sortedLatencies.length * 0.99);

    const avgLatency =
      sortedLatencies.length > 0
        ? sortedLatencies.reduce((a, b) => a + b, 0) / sortedLatencies.length
        : 0;

    return {
      deviceCount: CONFIG.deviceCount,
      duration,
      totalMessages: totalSent,
      successfulMessages: totalAcked,
      failedMessages: totalFailed,
      throughput: totalAcked / duration,
      avgLatency,
      p50Latency: sortedLatencies[p50Index] || 0,
      p95Latency: sortedLatencies[p95Index] || 0,
      p99Latency: sortedLatencies[p99Index] || 0,
      maxLatency: sortedLatencies[sortedLatencies.length - 1] || 0,
      minLatency: sortedLatencies[0] || 0,
      errorsPerSecond: totalFailed / duration,
    };
  }

  /**
   * Print results
   */
  private printResults(results: BenchmarkResult): void {
    console.log('\n' + '='.repeat(80));
    console.log('THROUGHPUT BENCHMARK RESULTS');
    console.log('='.repeat(80));

    console.log('\nConfiguration:');
    console.log(`  Devices: ${results.deviceCount}`);
    console.log(`  Duration: ${results.duration.toFixed(2)}s`);
    console.log(`  Message Rate per Device: ${CONFIG.messageRate} msg/s`);
    console.log(`  Payload Size: ${CONFIG.payloadSize} bytes`);

    console.log('\nThroughput:');
    console.log(`  Total Messages Sent: ${results.totalMessages.toLocaleString()}`);
    console.log(`  Successful Messages: ${results.successfulMessages.toLocaleString()}`);
    console.log(`  Failed Messages: ${results.failedMessages.toLocaleString()}`);
    console.log(`  Success Rate: ${((results.successfulMessages / results.totalMessages) * 100).toFixed(2)}%`);
    console.log(`  Throughput: ${results.throughput.toFixed(2)} msg/s`);

    console.log('\nLatency (milliseconds):');
    console.log(`  Average: ${results.avgLatency.toFixed(2)} ms`);
    console.log(`  Minimum: ${results.minLatency.toFixed(2)} ms`);
    console.log(`  P50 (Median): ${results.p50Latency.toFixed(2)} ms`);
    console.log(`  P95: ${results.p95Latency.toFixed(2)} ms`);
    console.log(`  P99: ${results.p99Latency.toFixed(2)} ms`);
    console.log(`  Maximum: ${results.maxLatency.toFixed(2)} ms`);

    console.log('\nError Rate:');
    console.log(`  Errors per Second: ${results.errorsPerSecond.toFixed(2)}`);

    console.log('\n' + '='.repeat(80) + '\n');

    // Save results to file
    const filename = `benchmark-results-${Date.now()}.json`;
    const fs = require('fs');
    fs.writeFileSync(filename, JSON.stringify(results, null, 2));
    logger.info({ filename }, 'Results saved to file');
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Main execution
 */
async function main() {
  const benchmark = new ThroughputBenchmark();

  try {
    await benchmark.run();
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Benchmark failed');
    process.exit(1);
  }
}

// Handle signals
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, exiting');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT received, exiting');
  process.exit(0);
});

main();
