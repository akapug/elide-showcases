/**
 * Prometheus Metrics Collection for API Gateway
 * Provides comprehensive observability:
 * - Request/response metrics
 * - Latency histograms
 * - Error rates
 * - Resource utilization
 * - Custom business metrics
 * - SLI/SLO tracking
 */

interface MetricLabels {
  [key: string]: string;
}

interface HistogramBucket {
  le: number;
  count: number;
}

interface Histogram {
  buckets: HistogramBucket[];
  sum: number;
  count: number;
}

interface SummaryQuantile {
  quantile: number;
  value: number;
}

interface Summary {
  quantiles: SummaryQuantile[];
  sum: number;
  count: number;
}

/**
 * Base Metric class
 */
abstract class Metric {
  protected name: string;
  protected help: string;
  protected labels: string[];

  constructor(config: { name: string; help: string; labels?: string[] }) {
    this.name = config.name;
    this.help = config.help;
    this.labels = config.labels || [];
  }

  abstract collect(): string;

  protected formatLabels(labelValues: MetricLabels): string {
    if (Object.keys(labelValues).length === 0) {
      return "";
    }

    const pairs = Object.entries(labelValues)
      .map(([key, value]) => `${key}="${value}"`)
      .join(",");

    return `{${pairs}}`;
  }
}

/**
 * Counter Metric
 * Monotonically increasing counter
 */
export class Counter extends Metric {
  private values = new Map<string, number>();

  inc(labels?: MetricLabels, value: number = 1): void {
    const key = this.getLabelKey(labels || {});
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  reset(): void {
    this.values.clear();
  }

  getValue(labels?: MetricLabels): number {
    const key = this.getLabelKey(labels || {});
    return this.values.get(key) || 0;
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} counter`);

    for (const [labelKey, value] of this.values.entries()) {
      const labels = this.parseLabelKey(labelKey);
      lines.push(`${this.name}${this.formatLabels(labels)} ${value}`);
    }

    return lines.join("\n");
  }

  private getLabelKey(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  private parseLabelKey(key: string): MetricLabels {
    return key ? JSON.parse(key) : {};
  }
}

/**
 * Gauge Metric
 * Value that can go up or down
 */
export class Gauge extends Metric {
  private values = new Map<string, number>();

  set(value: number, labels?: MetricLabels): void {
    const key = this.getLabelKey(labels || {});
    this.values.set(key, value);
  }

  inc(labels?: MetricLabels, value: number = 1): void {
    const key = this.getLabelKey(labels || {});
    const current = this.values.get(key) || 0;
    this.values.set(key, current + value);
  }

  dec(labels?: MetricLabels, value: number = 1): void {
    const key = this.getLabelKey(labels || {});
    const current = this.values.get(key) || 0;
    this.values.set(key, current - value);
  }

  getValue(labels?: MetricLabels): number {
    const key = this.getLabelKey(labels || {});
    return this.values.get(key) || 0;
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} gauge`);

    for (const [labelKey, value] of this.values.entries()) {
      const labels = this.parseLabelKey(labelKey);
      lines.push(`${this.name}${this.formatLabels(labels)} ${value}`);
    }

    return lines.join("\n");
  }

  private getLabelKey(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  private parseLabelKey(key: string): MetricLabels {
    return key ? JSON.parse(key) : {};
  }
}

/**
 * Histogram Metric
 * Tracks distribution of values
 */
export class HistogramMetric extends Metric {
  private buckets: number[];
  private histograms = new Map<string, Histogram>();

  constructor(config: {
    name: string;
    help: string;
    labels?: string[];
    buckets?: number[];
  }) {
    super(config);
    this.buckets = config.buckets || [
      0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10,
    ];
  }

  observe(value: number, labels?: MetricLabels): void {
    const key = this.getLabelKey(labels || {});
    let histogram = this.histograms.get(key);

    if (!histogram) {
      histogram = {
        buckets: this.buckets.map((le) => ({ le, count: 0 })),
        sum: 0,
        count: 0,
      };
      this.histograms.set(key, histogram);
    }

    // Update buckets
    for (const bucket of histogram.buckets) {
      if (value <= bucket.le) {
        bucket.count++;
      }
    }

    histogram.sum += value;
    histogram.count++;
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} histogram`);

    for (const [labelKey, histogram] of this.histograms.entries()) {
      const labels = this.parseLabelKey(labelKey);
      const baseLabels = this.formatLabels(labels);

      // Buckets
      for (const bucket of histogram.buckets) {
        const bucketLabels = labels
          ? `${this.name}_bucket{${Object.entries(labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(",")},le="${bucket.le}"}`
          : `${this.name}_bucket{le="${bucket.le}"}`;
        lines.push(`${bucketLabels} ${bucket.count}`);
      }

      // +Inf bucket
      const infLabels = labels
        ? `${this.name}_bucket{${Object.entries(labels)
            .map(([k, v]) => `${k}="${v}"`)
            .join(",")},le="+Inf"}`
        : `${this.name}_bucket{le="+Inf"}`;
      lines.push(`${infLabels} ${histogram.count}`);

      // Sum and count
      lines.push(`${this.name}_sum${baseLabels} ${histogram.sum}`);
      lines.push(`${this.name}_count${baseLabels} ${histogram.count}`);
    }

    return lines.join("\n");
  }

  private getLabelKey(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  private parseLabelKey(key: string): MetricLabels {
    return key ? JSON.parse(key) : {};
  }
}

/**
 * Summary Metric
 * Tracks quantiles over a sliding window
 */
export class SummaryMetric extends Metric {
  private maxAge: number;
  private ageBuckets: number;
  private summaries = new Map<
    string,
    {
      values: Array<{ value: number; timestamp: number }>;
      sum: number;
      count: number;
    }
  >();
  private quantiles: number[];

  constructor(config: {
    name: string;
    help: string;
    labels?: string[];
    maxAge?: number;
    ageBuckets?: number;
    quantiles?: number[];
  }) {
    super(config);
    this.maxAge = config.maxAge || 600000; // 10 minutes
    this.ageBuckets = config.ageBuckets || 5;
    this.quantiles = config.quantiles || [0.5, 0.9, 0.95, 0.99];
  }

  observe(value: number, labels?: MetricLabels): void {
    const key = this.getLabelKey(labels || {});
    let summary = this.summaries.get(key);

    if (!summary) {
      summary = {
        values: [],
        sum: 0,
        count: 0,
      };
      this.summaries.set(key, summary);
    }

    const now = Date.now();
    summary.values.push({ value, timestamp: now });
    summary.sum += value;
    summary.count++;

    // Remove old values
    const cutoff = now - this.maxAge;
    while (summary.values.length > 0 && summary.values[0].timestamp < cutoff) {
      const removed = summary.values.shift()!;
      summary.sum -= removed.value;
      summary.count--;
    }
  }

  collect(): string {
    const lines: string[] = [];
    lines.push(`# HELP ${this.name} ${this.help}`);
    lines.push(`# TYPE ${this.name} summary`);

    for (const [labelKey, summary] of this.summaries.entries()) {
      const labels = this.parseLabelKey(labelKey);
      const baseLabels = this.formatLabels(labels);

      // Calculate quantiles
      const sortedValues = [...summary.values]
        .map((v) => v.value)
        .sort((a, b) => a - b);

      for (const quantile of this.quantiles) {
        const index = Math.ceil(sortedValues.length * quantile) - 1;
        const value = sortedValues[index] || 0;

        const quantileLabels = labels
          ? `${this.name}{${Object.entries(labels)
              .map(([k, v]) => `${k}="${v}"`)
              .join(",")},quantile="${quantile}"}`
          : `${this.name}{quantile="${quantile}"}`;

        lines.push(`${quantileLabels} ${value}`);
      }

      // Sum and count
      lines.push(`${this.name}_sum${baseLabels} ${summary.sum}`);
      lines.push(`${this.name}_count${baseLabels} ${summary.count}`);
    }

    return lines.join("\n");
  }

  private getLabelKey(labels: MetricLabels): string {
    return JSON.stringify(labels);
  }

  private parseLabelKey(key: string): MetricLabels {
    return key ? JSON.parse(key) : {};
  }
}

/**
 * Metrics Registry
 */
export class MetricsRegistry {
  private metrics = new Map<string, Metric>();

  register(metric: Metric): void {
    this.metrics.set((metric as any).name, metric);
  }

  unregister(name: string): void {
    this.metrics.delete(name);
  }

  getMetric(name: string): Metric | undefined {
    return this.metrics.get(name);
  }

  collect(): string {
    const lines: string[] = [];

    for (const metric of this.metrics.values()) {
      const output = metric.collect();
      if (output) {
        lines.push(output);
      }
    }

    return lines.join("\n\n");
  }
}

/**
 * API Gateway Metrics
 */
export class GatewayMetrics {
  private registry: MetricsRegistry;

  // Request metrics
  private requestsTotal: Counter;
  private requestDuration: HistogramMetric;
  private requestSize: HistogramMetric;
  private responseSize: HistogramMetric;

  // Error metrics
  private errorsTotal: Counter;
  private errorRate: Gauge;

  // Backend metrics
  private backendRequestsTotal: Counter;
  private backendRequestDuration: HistogramMetric;
  private backendFailures: Counter;

  // Rate limiting metrics
  private rateLimitHits: Counter;
  private rateLimitRemaining: Gauge;

  // Cache metrics
  private cacheHits: Counter;
  private cacheMisses: Counter;
  private cacheSize: Gauge;
  private cacheHitRate: Gauge;

  // Connection metrics
  private activeConnections: Gauge;
  private connectionErrors: Counter;

  // Circuit breaker metrics
  private circuitBreakerState: Gauge;
  private circuitBreakerTransitions: Counter;

  constructor() {
    this.registry = new MetricsRegistry();

    // Initialize metrics
    this.requestsTotal = new Counter({
      name: "gateway_requests_total",
      help: "Total number of requests",
      labels: ["method", "path", "status"],
    });
    this.registry.register(this.requestsTotal);

    this.requestDuration = new HistogramMetric({
      name: "gateway_request_duration_seconds",
      help: "Request duration in seconds",
      labels: ["method", "path"],
      buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    });
    this.registry.register(this.requestDuration);

    this.requestSize = new HistogramMetric({
      name: "gateway_request_size_bytes",
      help: "Request size in bytes",
      labels: ["method", "path"],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });
    this.registry.register(this.requestSize);

    this.responseSize = new HistogramMetric({
      name: "gateway_response_size_bytes",
      help: "Response size in bytes",
      labels: ["method", "path"],
      buckets: [100, 1000, 10000, 100000, 1000000],
    });
    this.registry.register(this.responseSize);

    this.errorsTotal = new Counter({
      name: "gateway_errors_total",
      help: "Total number of errors",
      labels: ["type", "code"],
    });
    this.registry.register(this.errorsTotal);

    this.errorRate = new Gauge({
      name: "gateway_error_rate",
      help: "Current error rate",
      labels: ["window"],
    });
    this.registry.register(this.errorRate);

    this.backendRequestsTotal = new Counter({
      name: "gateway_backend_requests_total",
      help: "Total backend requests",
      labels: ["backend", "method", "status"],
    });
    this.registry.register(this.backendRequestsTotal);

    this.backendRequestDuration = new HistogramMetric({
      name: "gateway_backend_request_duration_seconds",
      help: "Backend request duration",
      labels: ["backend", "method"],
    });
    this.registry.register(this.backendRequestDuration);

    this.backendFailures = new Counter({
      name: "gateway_backend_failures_total",
      help: "Total backend failures",
      labels: ["backend", "reason"],
    });
    this.registry.register(this.backendFailures);

    this.rateLimitHits = new Counter({
      name: "gateway_rate_limit_hits_total",
      help: "Rate limit hits",
      labels: ["limiter"],
    });
    this.registry.register(this.rateLimitHits);

    this.rateLimitRemaining = new Gauge({
      name: "gateway_rate_limit_remaining",
      help: "Remaining rate limit",
      labels: ["limiter", "key"],
    });
    this.registry.register(this.rateLimitRemaining);

    this.cacheHits = new Counter({
      name: "gateway_cache_hits_total",
      help: "Cache hits",
      labels: ["cache"],
    });
    this.registry.register(this.cacheHits);

    this.cacheMisses = new Counter({
      name: "gateway_cache_misses_total",
      help: "Cache misses",
      labels: ["cache"],
    });
    this.registry.register(this.cacheMisses);

    this.cacheSize = new Gauge({
      name: "gateway_cache_size",
      help: "Cache size",
      labels: ["cache"],
    });
    this.registry.register(this.cacheSize);

    this.cacheHitRate = new Gauge({
      name: "gateway_cache_hit_rate",
      help: "Cache hit rate",
      labels: ["cache"],
    });
    this.registry.register(this.cacheHitRate);

    this.activeConnections = new Gauge({
      name: "gateway_active_connections",
      help: "Active connections",
    });
    this.registry.register(this.activeConnections);

    this.connectionErrors = new Counter({
      name: "gateway_connection_errors_total",
      help: "Connection errors",
      labels: ["type"],
    });
    this.registry.register(this.connectionErrors);

    this.circuitBreakerState = new Gauge({
      name: "gateway_circuit_breaker_state",
      help: "Circuit breaker state (0=closed, 1=open, 2=half-open)",
      labels: ["backend"],
    });
    this.registry.register(this.circuitBreakerState);

    this.circuitBreakerTransitions = new Counter({
      name: "gateway_circuit_breaker_transitions_total",
      help: "Circuit breaker state transitions",
      labels: ["backend", "from", "to"],
    });
    this.registry.register(this.circuitBreakerTransitions);
  }

  recordRequest(
    method: string,
    path: string,
    status: number,
    duration: number,
    requestSize: number,
    responseSize: number,
  ): void {
    this.requestsTotal.inc({ method, path, status: status.toString() });
    this.requestDuration.observe(duration / 1000, { method, path });
    this.requestSize.observe(requestSize, { method, path });
    this.responseSize.observe(responseSize, { method, path });

    if (status >= 400) {
      this.errorsTotal.inc({
        type: status >= 500 ? "server" : "client",
        code: status.toString(),
      });
    }
  }

  recordBackendRequest(
    backend: string,
    method: string,
    status: number,
    duration: number,
  ): void {
    this.backendRequestsTotal.inc({ backend, method, status: status.toString() });
    this.backendRequestDuration.observe(duration / 1000, { backend, method });
  }

  recordBackendFailure(backend: string, reason: string): void {
    this.backendFailures.inc({ backend, reason });
  }

  recordRateLimitHit(limiter: string): void {
    this.rateLimitHits.inc({ limiter });
  }

  updateRateLimitRemaining(limiter: string, key: string, remaining: number): void {
    this.rateLimitRemaining.set(remaining, { limiter, key });
  }

  recordCacheHit(cache: string): void {
    this.cacheHits.inc({ cache });
  }

  recordCacheMiss(cache: string): void {
    this.cacheMisses.inc({ cache });
  }

  updateCacheStats(cache: string, size: number, hitRate: number): void {
    this.cacheSize.set(size, { cache });
    this.cacheHitRate.set(hitRate, { cache });
  }

  updateActiveConnections(count: number): void {
    this.activeConnections.set(count);
  }

  recordConnectionError(type: string): void {
    this.connectionErrors.inc({ type });
  }

  updateCircuitBreakerState(backend: string, state: number): void {
    this.circuitBreakerState.set(state, { backend });
  }

  recordCircuitBreakerTransition(
    backend: string,
    from: string,
    to: string,
  ): void {
    this.circuitBreakerTransitions.inc({ backend, from, to });
  }

  getRegistry(): MetricsRegistry {
    return this.registry;
  }

  collect(): string {
    return this.registry.collect();
  }

  /**
   * Middleware for automatic metric collection
   */
  middleware() {
    return (req: any, res: any, next: any) => {
      const startTime = Date.now();
      let requestSize = 0;

      // Capture request size
      if (req.headers["content-length"]) {
        requestSize = parseInt(req.headers["content-length"], 10);
      }

      // Increment active connections
      this.activeConnections.inc();

      // Capture response
      const originalEnd = res.end.bind(res);
      res.end = (...args: any[]) => {
        const duration = Date.now() - startTime;
        let responseSize = 0;

        if (res.getHeader("content-length")) {
          responseSize = parseInt(res.getHeader("content-length") as string, 10);
        }

        this.recordRequest(
          req.method,
          req.path || req.url,
          res.statusCode,
          duration,
          requestSize,
          responseSize,
        );

        this.activeConnections.dec();

        return originalEnd(...args);
      };

      next();
    };
  }
}

export default GatewayMetrics;
