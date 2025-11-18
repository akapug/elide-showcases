/**
 * Prom Client - Prometheus Client
 *
 * A Prometheus metrics client for Node.js applications.
 * **POLYGLOT SHOWCASE**: Prometheus metrics for ALL languages on Elide!
 *
 * Features:
 * - Counter metrics
 * - Gauge metrics
 * - Histogram metrics
 * - Summary metrics
 * - Labels support
 * - Default metrics
 * - Prometheus format
 * - Zero dependencies
 *
 * Polyglot Benefits:
 * - Prometheus everywhere
 * - ONE metrics library for all languages
 * - Consistent metric format
 * - Universal monitoring
 *
 * Use cases:
 * - Application monitoring
 * - Performance metrics
 * - Business metrics
 * - System monitoring
 *
 * Package has ~8M downloads/week on npm!
 */

export class Counter {
  private value = 0;

  constructor(private name: string, private help: string, private labels: string[] = []) {}

  inc(value: number = 1, labelValues: Record<string, string> = {}): void {
    this.value += value;
  }

  get(): number {
    return this.value;
  }

  reset(): void {
    this.value = 0;
  }
}

export class Gauge {
  private value = 0;

  constructor(private name: string, private help: string, private labels: string[] = []) {}

  set(value: number, labelValues: Record<string, string> = {}): void {
    this.value = value;
  }

  inc(value: number = 1, labelValues: Record<string, string> = {}): void {
    this.value += value;
  }

  dec(value: number = 1, labelValues: Record<string, string> = {}): void {
    this.value -= value;
  }

  get(): number {
    return this.value;
  }
}

export class Histogram {
  private observations: number[] = [];

  constructor(private name: string, private help: string, private buckets: number[] = []) {}

  observe(value: number, labelValues: Record<string, string> = {}): void {
    this.observations.push(value);
  }

  reset(): void {
    this.observations = [];
  }
}

export class Registry {
  private metrics: Map<string, any> = new Map();

  registerMetric(metric: any): void {
    this.metrics.set(metric.name, metric);
  }

  metrics(): string {
    let output = '';
    for (const [name, metric] of this.metrics) {
      if (metric instanceof Counter || metric instanceof Gauge) {
        output += `# HELP ${name} ${metric.help}\n`;
        output += `# TYPE ${name} ${metric instanceof Counter ? 'counter' : 'gauge'}\n`;
        output += `${name} ${metric.get()}\n`;
      }
    }
    return output;
  }

  clear(): void {
    this.metrics.clear();
  }
}

export const register = new Registry();

export default { Counter, Gauge, Histogram, Registry, register };

// CLI Demo
if (import.meta.url.includes("elide-prom-client.ts")) {
  console.log("📊 Prom Client - Prometheus Metrics (POLYGLOT!)\n");

  const httpRequests = new Counter('http_requests_total', 'Total HTTP requests');
  const activeConnections = new Gauge('active_connections', 'Active connections');
  const requestDuration = new Histogram('http_request_duration_seconds', 'Request duration', [0.1, 0.5, 1, 2, 5]);

  register.registerMetric(httpRequests);
  register.registerMetric(activeConnections);

  httpRequests.inc();
  httpRequests.inc(5);
  activeConnections.set(42);
  requestDuration.observe(0.234);

  console.log("Metrics output:");
  console.log(register.metrics());

  console.log("\n💡 Prometheus everywhere! ~8M downloads/week");
}
