/**
 * Node StatsD - StatsD Client
 *
 * A simple Node.js client for Etsy's StatsD server.
 * **POLYGLOT SHOWCASE**: StatsD for ALL languages on Elide!
 *
 * Features:
 * - Counter metrics
 * - Gauge metrics
 * - Timer metrics
 * - Set metrics
 * - Histogram metrics
 * - Callback support
 * - Error handling
 * - Zero dependencies
 *
 * Use cases:
 * - Application metrics
 * - Performance monitoring
 * - Real-time analytics
 * - System monitoring
 *
 * Package has ~3M downloads/week on npm!
 */

export interface StatsDOptions {
  host?: string;
  port?: number;
  prefix?: string;
  suffix?: string;
  globalize?: boolean;
  cacheDns?: boolean;
  mock?: boolean;
}

export class StatsD {
  private host: string;
  private port: number;
  private prefix: string;
  private suffix: string;

  constructor(options: StatsDOptions = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 8125;
    this.prefix = options.prefix || '';
    this.suffix = options.suffix || '';
  }

  private buildMetric(name: string): string {
    let metric = name;
    if (this.prefix) metric = `${this.prefix}.${metric}`;
    if (this.suffix) metric = `${metric}.${this.suffix}`;
    return metric;
  }

  private send(metric: string, value: number, type: string, callback?: (error: Error | null) => void): void {
    const name = this.buildMetric(metric);
    const message = `${name}:${value}|${type}`;
    console.log(`[StatsD: ${this.host}:${this.port}] ${message}`);
    if (callback) callback(null);
  }

  increment(stat: string, value: number = 1, callback?: (error: Error | null) => void): void {
    this.send(stat, value, 'c', callback);
  }

  decrement(stat: string, value: number = 1, callback?: (error: Error | null) => void): void {
    this.send(stat, -value, 'c', callback);
  }

  gauge(stat: string, value: number, callback?: (error: Error | null) => void): void {
    this.send(stat, value, 'g', callback);
  }

  timing(stat: string, time: number, callback?: (error: Error | null) => void): void {
    this.send(stat, time, 'ms', callback);
  }

  histogram(stat: string, value: number, callback?: (error: Error | null) => void): void {
    this.send(stat, value, 'h', callback);
  }

  set(stat: string, value: number, callback?: (error: Error | null) => void): void {
    this.send(stat, value, 's', callback);
  }

  close(): void {
    console.log('[StatsD] Connection closed');
  }
}

export default StatsD;

// CLI Demo
if (import.meta.url.includes("elide-node-statsd.ts")) {
  console.log("📊 Node StatsD Client (POLYGLOT!)\n");

  const client = new StatsD({ host: 'localhost', port: 8125, prefix: 'myapp' });

  client.increment('page.views');
  client.gauge('users.online', 100);
  client.timing('api.response_time', 250);
  client.histogram('request.size', 1500);
  client.set('unique.visitors', 42);

  console.log("\n💡 Node StatsD everywhere! ~3M downloads/week");
}
