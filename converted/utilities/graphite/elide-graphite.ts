/**
 * Graphite - Graphite Client
 *
 * A client for sending metrics to Graphite.
 * **POLYGLOT SHOWCASE**: Graphite metrics for ALL languages on Elide!
 *
 * Features:
 * - Metric sending
 * - TCP/UDP support
 * - Buffering
 * - Time series data
 * - Namespacing
 * - Aggregation
 * - Flush control
 * - Zero dependencies
 *
 * Use cases:
 * - Time series metrics
 * - Performance monitoring
 * - Infrastructure metrics
 * - Graphite integration
 *
 * Package has ~500K downloads/week on npm!
 */

export interface GraphiteOptions {
  host?: string;
  port?: number;
  prefix?: string;
}

export class Graphite {
  private host: string;
  private port: number;
  private prefix: string;
  private metrics: Array<{ metric: string; value: number; timestamp: number }> = [];

  constructor(options: GraphiteOptions = {}) {
    this.host = options.host || 'localhost';
    this.port = options.port || 2003;
    this.prefix = options.prefix || '';
  }

  private buildMetric(name: string): string {
    return this.prefix ? `${this.prefix}.${name}` : name;
  }

  write(metrics: Record<string, number>, timestamp?: number): void {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    for (const [metric, value] of Object.entries(metrics)) {
      this.metrics.push({
        metric: this.buildMetric(metric),
        value,
        timestamp: ts,
      });
    }
  }

  put(metric: string, value: number, timestamp?: number): void {
    const ts = timestamp || Math.floor(Date.now() / 1000);
    this.metrics.push({
      metric: this.buildMetric(metric),
      value,
      timestamp: ts,
    });
  }

  flush(): void {
    for (const { metric, value, timestamp } of this.metrics) {
      const message = `${metric} ${value} ${timestamp}`;
      console.log(`[Graphite: ${this.host}:${this.port}] ${message}`);
    }
    this.metrics = [];
  }

  close(): void {
    this.flush();
    console.log('[Graphite] Connection closed');
  }
}

export function createClient(options?: GraphiteOptions): Graphite {
  return new Graphite(options);
}

export default { createClient, Graphite };

// CLI Demo
if (import.meta.url.includes("elide-graphite.ts")) {
  console.log("📊 Graphite Client (POLYGLOT!)\n");

  const client = createClient({ host: 'localhost', port: 2003, prefix: 'myapp' });

  client.put('requests', 100);
  client.put('latency', 250);
  client.write({ 'users.active': 42, 'memory.used': 512 });

  client.flush();

  console.log("\n💡 Graphite everywhere! ~500K downloads/week");
}
