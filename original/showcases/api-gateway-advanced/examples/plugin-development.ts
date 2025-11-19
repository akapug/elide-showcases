/**
 * Custom Plugin Development Examples for API Gateway
 * Demonstrates how to build custom plugins:
 * - Plugin lifecycle hooks
 * - Request/response interceptors
 * - Custom middleware
 * - Error handling plugins
 * - Logging and monitoring plugins
 * - Security plugins
 */

interface PluginContext {
  request: any;
  response: any;
  config: Record<string, any>;
  metadata: Map<string, any>;
}

interface PluginHooks {
  beforeRequest?: (context: PluginContext) => Promise<void> | void;
  afterRequest?: (context: PluginContext) => Promise<void> | void;
  onError?: (context: PluginContext, error: Error) => Promise<void> | void;
  onSuccess?: (context: PluginContext) => Promise<void> | void;
}

/**
 * Base Plugin Class
 * All custom plugins should extend this
 */
export abstract class BasePlugin {
  protected name: string;
  protected config: Record<string, any>;
  protected enabled: boolean = true;

  constructor(name: string, config: Record<string, any> = {}) {
    this.name = name;
    this.config = config;
  }

  abstract initialize(): Promise<void>;
  abstract execute(context: PluginContext): Promise<void>;
  abstract cleanup(): Promise<void>;

  getName(): string {
    return this.name;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  enable(): void {
    this.enabled = true;
  }

  disable(): void {
    this.enabled = false;
  }

  getConfig(): Record<string, any> {
    return { ...this.config };
  }

  updateConfig(config: Partial<Record<string, any>>): void {
    Object.assign(this.config, config);
  }
}

/**
 * Example 1: Request Logger Plugin
 * Logs detailed information about each request
 */
export class RequestLoggerPlugin extends BasePlugin {
  private logs: Array<{
    timestamp: number;
    method: string;
    path: string;
    duration: number;
    status: number;
  }> = [];

  constructor(config: {
    logLevel?: "info" | "debug" | "verbose";
    maxLogs?: number;
  } = {}) {
    super("request-logger", {
      logLevel: config.logLevel || "info",
      maxLogs: config.maxLogs || 1000,
    });
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initializing request logger...`);
  }

  async execute(context: PluginContext): Promise<void> {
    const startTime = Date.now();

    // Store original response end
    const originalEnd = context.response.end;

    context.response.end = (...args: any[]) => {
      const duration = Date.now() - startTime;

      // Log request details
      const logEntry = {
        timestamp: Date.now(),
        method: context.request.method,
        path: context.request.path,
        duration,
        status: context.response.statusCode,
      };

      this.logs.push(logEntry);

      // Trim logs if exceeding max size
      if (this.logs.length > this.config.maxLogs) {
        this.logs.shift();
      }

      if (this.config.logLevel === "verbose") {
        console.log(JSON.stringify(logEntry, null, 2));
      } else if (this.config.logLevel === "debug") {
        console.log(
          `[${new Date(logEntry.timestamp).toISOString()}] ` +
            `${logEntry.method} ${logEntry.path} - ` +
            `${logEntry.status} (${logEntry.duration}ms)`,
        );
      } else {
        console.log(
          `${logEntry.method} ${logEntry.path} - ${logEntry.status} (${logEntry.duration}ms)`,
        );
      }

      return originalEnd.apply(context.response, args);
    };
  }

  async cleanup(): Promise<void> {
    console.log(`[${this.name}] Cleaning up... Logged ${this.logs.length} requests`);
    this.logs = [];
  }

  getLogs(): typeof this.logs {
    return [...this.logs];
  }

  getStats(): {
    totalRequests: number;
    averageDuration: number;
    statusCodes: Record<number, number>;
  } {
    const statusCodes: Record<number, number> = {};
    let totalDuration = 0;

    for (const log of this.logs) {
      statusCodes[log.status] = (statusCodes[log.status] || 0) + 1;
      totalDuration += log.duration;
    }

    return {
      totalRequests: this.logs.length,
      averageDuration: this.logs.length > 0 ? totalDuration / this.logs.length : 0,
      statusCodes,
    };
  }
}

/**
 * Example 2: Request ID Plugin
 * Adds unique request IDs for tracing
 */
export class RequestIDPlugin extends BasePlugin {
  private counter: number = 0;
  private prefix: string;

  constructor(config: { prefix?: string } = {}) {
    super("request-id", config);
    this.prefix = config.prefix || "req";
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized with prefix: ${this.prefix}`);
  }

  async execute(context: PluginContext): Promise<void> {
    // Check if request already has an ID
    let requestId = context.request.headers["x-request-id"];

    if (!requestId) {
      // Generate new request ID
      requestId = `${this.prefix}-${Date.now()}-${this.counter++}`;
      context.request.headers["x-request-id"] = requestId;
    }

    // Add to response headers
    context.response.setHeader("X-Request-ID", requestId);

    // Store in context metadata
    context.metadata.set("requestId", requestId);
  }

  async cleanup(): Promise<void> {
    console.log(`[${this.name}] Generated ${this.counter} request IDs`);
  }
}

/**
 * Example 3: Response Time Plugin
 * Adds response time headers and metrics
 */
export class ResponseTimePlugin extends BasePlugin {
  private measurements: number[] = [];

  constructor(config: { headerName?: string } = {}) {
    super("response-time", {
      headerName: config.headerName || "X-Response-Time",
    });
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Initialized`);
  }

  async execute(context: PluginContext): Promise<void> {
    const startTime = process.hrtime.bigint();

    const originalEnd = context.response.end;

    context.response.end = (...args: any[]) => {
      const endTime = process.hrtime.bigint();
      const duration = Number(endTime - startTime) / 1000000; // Convert to ms

      this.measurements.push(duration);

      // Add header
      context.response.setHeader(
        this.config.headerName,
        `${duration.toFixed(3)}ms`,
      );

      return originalEnd.apply(context.response, args);
    };
  }

  async cleanup(): Promise<void> {
    console.log(`[${this.name}] Recorded ${this.measurements.length} measurements`);
  }

  getMetrics(): {
    count: number;
    min: number;
    max: number;
    average: number;
    median: number;
    p95: number;
    p99: number;
  } {
    if (this.measurements.length === 0) {
      return {
        count: 0,
        min: 0,
        max: 0,
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
      };
    }

    const sorted = [...this.measurements].sort((a, b) => a - b);

    return {
      count: this.measurements.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      average: this.measurements.reduce((a, b) => a + b, 0) / this.measurements.length,
      median: sorted[Math.floor(sorted.length / 2)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)],
    };
  }
}

/**
 * Example 4: Request Size Limiter Plugin
 * Limits request body size
 */
export class RequestSizeLimiterPlugin extends BasePlugin {
  constructor(config: { maxSize?: number; unit?: "bytes" | "kb" | "mb" } = {}) {
    super("request-size-limiter", {
      maxSize: config.maxSize || 1,
      unit: config.unit || "mb",
    });
  }

  async initialize(): Promise<void> {
    console.log(
      `[${this.name}] Max request size: ${this.config.maxSize}${this.config.unit}`,
    );
  }

  async execute(context: PluginContext): Promise<void> {
    const contentLength = context.request.headers["content-length"];

    if (!contentLength) {
      return; // No content length, skip check
    }

    const sizeInBytes = parseInt(contentLength, 10);
    const maxSizeInBytes = this.convertToBytes(
      this.config.maxSize,
      this.config.unit,
    );

    if (sizeInBytes > maxSizeInBytes) {
      context.response.status(413).json({
        error: "Payload Too Large",
        maxSize: `${this.config.maxSize}${this.config.unit}`,
        receivedSize: this.formatSize(sizeInBytes),
      });
      throw new Error("Request size limit exceeded");
    }
  }

  async cleanup(): Promise<void> {
    console.log(`[${this.name}] Cleanup complete`);
  }

  private convertToBytes(size: number, unit: string): number {
    const units: Record<string, number> = {
      bytes: 1,
      kb: 1024,
      mb: 1024 * 1024,
    };
    return size * (units[unit] || 1);
  }

  private formatSize(bytes: number): string {
    if (bytes < 1024) return `${bytes}bytes`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)}kb`;
    return `${(bytes / (1024 * 1024)).toFixed(2)}mb`;
  }
}

/**
 * Example 5: CORS Plugin
 * Handles Cross-Origin Resource Sharing
 */
export class CORSPlugin extends BasePlugin {
  constructor(config: {
    origin?: string | string[];
    methods?: string[];
    allowedHeaders?: string[];
    exposedHeaders?: string[];
    credentials?: boolean;
    maxAge?: number;
  } = {}) {
    super("cors", {
      origin: config.origin || "*",
      methods: config.methods || ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: config.allowedHeaders || ["Content-Type", "Authorization"],
      exposedHeaders: config.exposedHeaders || [],
      credentials: config.credentials || false,
      maxAge: config.maxAge || 86400,
    });
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] CORS enabled`);
  }

  async execute(context: PluginContext): Promise<void> {
    const origin = context.request.headers.origin;

    // Check if origin is allowed
    if (this.isOriginAllowed(origin)) {
      context.response.setHeader(
        "Access-Control-Allow-Origin",
        Array.isArray(this.config.origin) ? origin : this.config.origin,
      );
    }

    context.response.setHeader(
      "Access-Control-Allow-Methods",
      this.config.methods.join(", "),
    );

    context.response.setHeader(
      "Access-Control-Allow-Headers",
      this.config.allowedHeaders.join(", "),
    );

    if (this.config.exposedHeaders.length > 0) {
      context.response.setHeader(
        "Access-Control-Expose-Headers",
        this.config.exposedHeaders.join(", "),
      );
    }

    if (this.config.credentials) {
      context.response.setHeader("Access-Control-Allow-Credentials", "true");
    }

    context.response.setHeader("Access-Control-Max-Age", this.config.maxAge);

    // Handle preflight requests
    if (context.request.method === "OPTIONS") {
      context.response.status(204).end();
    }
  }

  async cleanup(): Promise<void> {
    console.log(`[${this.name}] Cleanup complete`);
  }

  private isOriginAllowed(origin: string): boolean {
    if (this.config.origin === "*") {
      return true;
    }

    if (Array.isArray(this.config.origin)) {
      return this.config.origin.includes(origin);
    }

    return this.config.origin === origin;
  }
}

/**
 * Example 6: Circuit Breaker Plugin
 * Implements circuit breaker pattern
 */
export class CircuitBreakerPlugin extends BasePlugin {
  private failures: number = 0;
  private successes: number = 0;
  private state: "closed" | "open" | "half-open" = "closed";
  private lastFailureTime: number = 0;

  constructor(config: {
    failureThreshold?: number;
    successThreshold?: number;
    timeout?: number;
  } = {}) {
    super("circuit-breaker", {
      failureThreshold: config.failureThreshold || 5,
      successThreshold: config.successThreshold || 2,
      timeout: config.timeout || 60000,
    });
  }

  async initialize(): Promise<void> {
    console.log(`[${this.name}] Circuit breaker initialized`);
  }

  async execute(context: PluginContext): Promise<void> {
    // Check state
    if (this.state === "open") {
      // Check if timeout has passed
      if (Date.now() - this.lastFailureTime > this.config.timeout) {
        this.state = "half-open";
        this.successes = 0;
        console.log(`[${this.name}] Circuit half-open`);
      } else {
        // Circuit is open, reject request
        context.response.status(503).json({
          error: "Service Unavailable",
          message: "Circuit breaker is open",
        });
        throw new Error("Circuit breaker open");
      }
    }

    // Track response
    const originalEnd = context.response.end;

    context.response.end = (...args: any[]) => {
      if (context.response.statusCode >= 500) {
        this.recordFailure();
      } else {
        this.recordSuccess();
      }

      return originalEnd.apply(context.response, args);
    };
  }

  async cleanup(): Promise<void> {
    console.log(
      `[${this.name}] Final state: ${this.state} ` +
        `(failures: ${this.failures}, successes: ${this.successes})`,
    );
  }

  private recordFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();

    if (this.failures >= this.config.failureThreshold) {
      this.state = "open";
      this.failures = 0;
      console.log(`[${this.name}] Circuit opened`);
    }
  }

  private recordSuccess(): void {
    if (this.state === "half-open") {
      this.successes++;

      if (this.successes >= this.config.successThreshold) {
        this.state = "closed";
        this.successes = 0;
        this.failures = 0;
        console.log(`[${this.name}] Circuit closed`);
      }
    } else if (this.state === "closed") {
      this.failures = Math.max(0, this.failures - 1);
    }
  }

  getState(): string {
    return this.state;
  }
}

/**
 * Plugin Manager
 * Manages plugin lifecycle and execution
 */
export class PluginManager {
  private plugins: BasePlugin[] = [];
  private initialized: boolean = false;

  async registerPlugin(plugin: BasePlugin): Promise<void> {
    this.plugins.push(plugin);

    if (this.initialized) {
      await plugin.initialize();
    }
  }

  async unregisterPlugin(name: string): Promise<void> {
    const index = this.plugins.findIndex((p) => p.getName() === name);

    if (index !== -1) {
      await this.plugins[index].cleanup();
      this.plugins.splice(index, 1);
    }
  }

  async initialize(): Promise<void> {
    console.log(`Initializing ${this.plugins.length} plugins...`);

    for (const plugin of this.plugins) {
      await plugin.initialize();
    }

    this.initialized = true;
  }

  async executePlugins(context: PluginContext): Promise<void> {
    for (const plugin of this.plugins) {
      if (plugin.isEnabled()) {
        try {
          await plugin.execute(context);
        } catch (error) {
          console.error(`Plugin ${plugin.getName()} failed:`, error);
          throw error;
        }
      }
    }
  }

  async cleanup(): Promise<void> {
    console.log("Cleaning up plugins...");

    for (const plugin of this.plugins) {
      await plugin.cleanup();
    }

    this.plugins = [];
    this.initialized = false;
  }

  getPlugin(name: string): BasePlugin | undefined {
    return this.plugins.find((p) => p.getName() === name);
  }

  listPlugins(): Array<{ name: string; enabled: boolean }> {
    return this.plugins.map((p) => ({
      name: p.getName(),
      enabled: p.isEnabled(),
    }));
  }
}

/**
 * Example usage
 */
async function exampleUsage() {
  const manager = new PluginManager();

  // Register plugins
  await manager.registerPlugin(new RequestLoggerPlugin({ logLevel: "debug" }));
  await manager.registerPlugin(new RequestIDPlugin({ prefix: "gw" }));
  await manager.registerPlugin(new ResponseTimePlugin());
  await manager.registerPlugin(
    new RequestSizeLimiterPlugin({ maxSize: 10, unit: "mb" }),
  );
  await manager.registerPlugin(
    new CORSPlugin({
      origin: ["http://localhost:3000", "https://example.com"],
      credentials: true,
    }),
  );
  await manager.registerPlugin(new CircuitBreakerPlugin());

  // Initialize all plugins
  await manager.initialize();

  console.log("Registered plugins:", manager.listPlugins());

  // Simulate request execution
  const context: PluginContext = {
    request: {
      method: "GET",
      path: "/api/users",
      headers: {},
    },
    response: {
      statusCode: 200,
      setHeader: (name: string, value: string) => {
        console.log(`Setting header: ${name} = ${value}`);
      },
      status: (code: number) => ({ json: (data: any) => console.log(code, data) }),
      end: () => console.log("Response ended"),
    },
    config: {},
    metadata: new Map(),
  };

  await manager.executePlugins(context);

  // Cleanup
  await manager.cleanup();
}

// Run example if this file is executed directly
if (require.main === module) {
  exampleUsage().catch(console.error);
}

export default PluginManager;
