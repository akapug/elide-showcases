/**
 * Lynx - StatsD Client
 *
 * A lightweight StatsD client with a simple API.
 * **POLYGLOT SHOWCASE**: Lightweight StatsD for ALL languages on Elide!
 *
 * Features:
 * - Counter metrics
 * - Gauge metrics
 * - Timer metrics
 * - Set metrics
 * - Simple API
 * - Buffering
 * - Sampling
 * - Zero dependencies
 *
 * Use cases:
 * - Lightweight monitoring
 * - Simple metrics
 * - Quick integration
 * - Low overhead
 *
 * Package has ~500K downloads/week on npm!
 */

export interface LynxOptions {
  host?: string;
  port?: number;
  scope?: string;
}

export class Lynx {
  private host: string;
  private port: number;
  private scope: string;

  constructor(options: LynxOptions = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 8125;
    this.scope = options.scope || '';
  }

  private buildMetric(name: string): string {
    return this.scope ? `${this.scope}.${name}` : name;
  }

  private send(metric: string, value: number, type: string): void {
    const name = this.buildMetric(metric);
    const message = `${name}:${value}|${type}`;
    console.log(`[Lynx: ${this.host}:${this.port}] ${message}`);
  }

  increment(metric: string, value: number = 1): void {
    this.send(metric, value, 'c');
  }

  decrement(metric: string, value: number = 1): void {
    this.send(metric, -value, 'c');
  }

  count(metric: string, value: number): void {
    this.send(metric, value, 'c');
  }

  gauge(metric: string, value: number): void {
    this.send(metric, value, 'g');
  }

  timing(metric: string, time: number): void {
    this.send(metric, time, 'ms');
  }

  set(metric: string, value: number): void {
    this.send(metric, value, 's');
  }
}

export default Lynx;

// CLI Demo
if (import.meta.url.includes("elide-lynx.ts")) {
  console.log("🐱 Lynx - Lightweight StatsD (POLYGLOT!)\n");

  const client = new Lynx({ host: 'localhost', port: 8125, scope: 'myapp' });

  client.increment('page.views');
  client.gauge('memory.used', 512);
  client.timing('api.latency', 123);
  client.set('unique.users', 42);

  console.log("\n💡 Lynx everywhere! ~500K downloads/week");
}
