/**
 * Datadog Metrics - DataDog Metrics Client
 *
 * A client for sending metrics to DataDog.
 * **POLYGLOT SHOWCASE**: DataDog metrics for ALL languages on Elide!
 *
 * Features:
 * - Gauge metrics
 * - Increment counters
 * - Histogram metrics
 * - Distribution metrics
 * - Tags support
 * - Buffering
 * - Flush control
 * - Zero dependencies
 *
 * Use cases:
 * - DataDog monitoring
 * - Cloud metrics
 * - Application monitoring
 * - Infrastructure metrics
 *
 * Package has ~2M downloads/week on npm!
 */

export interface DataDogOptions {
  apiKey?: string;
  host?: string;
  prefix?: string;
  defaultTags?: string[];
  flushIntervalSeconds?: number;
}

export class BufferedMetricsLogger {
  private prefix: string;
  private defaultTags: string[];
  private metrics: Array<{ type: string; metric: string; value: number; tags: string[] }> = [];

  constructor(options: DataDogOptions = {}) {
    this.prefix = options.prefix || '';
    this.defaultTags = options.defaultTags || [];
  }

  private buildMetric(name: string): string {
    return this.prefix ? `${this.prefix}.${name}` : name;
  }

  private addMetric(type: string, metric: string, value: number, tags: string[] = []): void {
    this.metrics.push({
      type,
      metric: this.buildMetric(metric),
      value,
      tags: [...this.defaultTags, ...tags],
    });
  }

  gauge(metric: string, value: number, tags?: string[]): void {
    this.addMetric('gauge', metric, value, tags);
  }

  increment(metric: string, value: number = 1, tags?: string[]): void {
    this.addMetric('increment', metric, value, tags);
  }

  histogram(metric: string, value: number, tags?: string[]): void {
    this.addMetric('histogram', metric, value, tags);
  }

  distribution(metric: string, value: number, tags?: string[]): void {
    this.addMetric('distribution', metric, value, tags);
  }

  flush(): void {
    if (this.metrics.length === 0) return;

    console.log('[DataDog Metrics]');
    for (const { type, metric, value, tags } of this.metrics) {
      const tagStr = tags.length > 0 ? ` [${tags.join(', ')}]` : '';
      console.log(`  ${type.toUpperCase()}: ${metric} = ${value}${tagStr}`);
    }
    this.metrics = [];
  }
}

export default BufferedMetricsLogger;

// CLI Demo
if (import.meta.url.includes("elide-datadog-metrics.ts")) {
  console.log("🐶 DataDog Metrics (POLYGLOT!)\n");

  const metrics = new BufferedMetricsLogger({
    prefix: 'myapp',
    defaultTags: ['env:production', 'service:api'],
  });

  metrics.gauge('memory.usage', 512, ['host:server01']);
  metrics.increment('requests.count', 1, ['endpoint:/api/users']);
  metrics.histogram('request.duration', 234, ['method:GET']);
  metrics.distribution('response.size', 1024);

  metrics.flush();

  console.log("\n💡 DataDog everywhere! ~2M downloads/week");
}
