# Edge Compute Platform - API Reference

Complete API documentation for the Edge Compute Platform.

## Table of Contents

- [Platform API](#platform-api)
- [Control Plane API](#control-plane-api)
- [Runtime API](#runtime-api)
- [Router API](#router-api)
- [Storage API](#storage-api)
- [Monitoring API](#monitoring-api)

## Platform API

### EdgeComputePlatform

Main entry point for the platform.

#### Constructor

```typescript
constructor(config?: PlatformConfig)
```

**Config Options:**
```typescript
interface PlatformConfig {
  storageDir?: string;        // Function storage directory
  dataDir?: string;           // Data storage directory
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enableMetrics?: boolean;    // Enable metrics collection
  enableTracing?: boolean;    // Enable distributed tracing
  enableCaching?: boolean;    // Enable response caching
  poolConfig?: {
    minSize?: number;         // Min runtime pool size
    maxSize?: number;         // Max runtime pool size
  };
}
```

#### Methods

##### initialize()

Initialize the platform.

```typescript
async initialize(): Promise<void>
```

##### deploy(request)

Deploy a function.

```typescript
async deploy(request: DeployRequest): Promise<DeploymentResult>

interface DeployRequest {
  name: string;
  code: string;
  runtime: 'typescript' | 'python' | 'ruby';
  routes?: string[];
  env?: Record<string, string>;
  memory?: number;
  timeout?: number;
}
```

##### invoke(request)

Invoke a function via HTTP request.

```typescript
async invoke(request: InvokeRequest): Promise<InvokeResponse>

interface InvokeRequest {
  path: string;
  method: string;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  body?: any;
  ip?: string;
}

interface InvokeResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: any;
  cached?: boolean;
  executionTime?: number;
}
```

##### getStatus()

Get platform status.

```typescript
getStatus(): PlatformStatus

interface PlatformStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  uptime: number;
  components: Record<string, any>;
}
```

##### getKV(), getCache(), getMetrics(), getLogger(), getTracer()

Access platform components.

```typescript
getKV(): KVStore
getCache(): Cache
getMetrics(): MetricsService
getLogger(): Logger
getTracer(): Tracer
```

##### shutdown()

Shutdown the platform gracefully.

```typescript
async shutdown(): Promise<void>
```

## Control Plane API

### FunctionManager

Manages function lifecycle.

#### Methods

##### deploy(name, code, runtime, options)

Deploy or update a function.

```typescript
async deploy(
  name: string,
  code: string,
  runtime: 'typescript' | 'python' | 'ruby',
  options?: DeploymentOptions
): Promise<FunctionMetadata>

interface DeploymentOptions {
  version?: string;
  autoVersion?: boolean;
  activateImmediately?: boolean;
  validateCode?: boolean;
}
```

##### get(identifier)

Get function by ID or name.

```typescript
get(identifier: string): FunctionMetadata | undefined
```

##### list(filter)

List all functions.

```typescript
list(filter?: { runtime?: string; tag?: string }): FunctionMetadata[]
```

##### update(functionId, updates)

Update function metadata.

```typescript
async update(
  functionId: string,
  updates: Partial<FunctionMetadata>
): Promise<FunctionMetadata>
```

##### delete(functionId)

Delete a function.

```typescript
async delete(functionId: string): Promise<void>
```

##### rollback(functionId, targetVersion)

Rollback to a previous version.

```typescript
async rollback(
  functionId: string,
  targetVersion: string
): Promise<FunctionMetadata>
```

##### listVersions(functionId)

List all versions of a function.

```typescript
listVersions(functionId: string): FunctionVersion[]
```

### DeploymentService

Handles deployment orchestration.

#### Methods

##### deploy(request)

Deploy a function with validation and preprocessing.

```typescript
async deploy(request: DeploymentRequest): Promise<DeploymentResult>
```

##### rollback(functionId, targetVersion)

Rollback to a previous version.

```typescript
async rollback(
  functionId: string,
  targetVersion: string
): Promise<DeploymentResult>
```

##### getDeploymentHistory(filter)

Get deployment history.

```typescript
getDeploymentHistory(filter?: {
  functionId?: string;
  limit?: number;
}): DeploymentResult[]
```

##### getStats()

Get deployment statistics.

```typescript
getStats(): DeploymentStats
```

## Runtime API

### FunctionExecutor

Executes functions.

#### Methods

##### execute(request)

Execute a function.

```typescript
async execute(request: ExecutionRequest): Promise<ExecutionResult>

interface ExecutionRequest {
  functionId: string;
  version: string;
  event: any;
  context?: Partial<ExecutionContext>;
  timeout?: number;
  memory?: number;
}

interface ExecutionResult {
  success: boolean;
  result?: any;
  error?: string;
  logs: string[];
  metrics: {
    duration: number;
    memoryUsed: number;
    cpuTime: number;
  };
  context: ExecutionContext;
}
```

### RuntimePool

Manages executor pool.

#### Methods

##### execute(request)

Execute using the pool.

```typescript
async execute(request: ExecutionRequest): Promise<ExecutionResult>
```

##### getStats()

Get pool statistics.

```typescript
getStats(): PoolStats
```

##### shutdown()

Shutdown the pool.

```typescript
async shutdown(): Promise<void>
```

## Router API

### EdgeRouter

Routes requests to functions.

#### Methods

##### addRoute(config)

Add a route.

```typescript
addRoute(config: RouteConfig): void

interface RouteConfig {
  path: string;
  functionId: string;
  methods?: string[];
  priority?: number;
  region?: string;
  weight?: number;
  enabled?: boolean;
}
```

##### removeRoute(path)

Remove a route.

```typescript
removeRoute(path: string): boolean
```

##### match(request)

Match request to a route.

```typescript
match(request: RouterRequest): RouteMatch | null

interface RouterRequest {
  path: string;
  method: string;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: any;
  ip?: string;
  region?: string;
}
```

### LoadBalancer

Distributes load across instances.

#### Methods

##### registerInstance(instance)

Register an instance.

```typescript
registerInstance(instance: Instance): void
```

##### selectInstance(functionId, region?)

Select an instance.

```typescript
selectInstance(functionId: string, region?: string): Instance | null
```

##### setHealth(instanceId, healthy)

Update instance health.

```typescript
setHealth(instanceId: string, healthy: boolean): boolean
```

### GeolocationService

Provides geolocation services.

#### Methods

##### getLocation(ip)

Get location for IP.

```typescript
async getLocation(ip: string): Promise<GeoLocation | null>
```

##### findNearest(location, options?)

Find nearest edge location.

```typescript
findNearest(
  location: GeoLocation,
  options?: { minCapacity?: number; region?: string }
): EdgeLocation | null
```

##### registerEdge(location)

Register edge location.

```typescript
registerEdge(location: EdgeLocation): void
```

## Storage API

### KVStore

Key-value storage.

#### Methods

##### get(key)

Get value by key.

```typescript
async get(key: string): Promise<any | null>
```

##### set(key, value, options?)

Set a value.

```typescript
async set(
  key: string,
  value: any,
  options?: { ttl?: number; tags?: string[] }
): Promise<void>
```

##### delete(key)

Delete a key.

```typescript
async delete(key: string): Promise<boolean>
```

##### has(key)

Check if key exists.

```typescript
async has(key: string): Promise<boolean>
```

##### list(options?)

List keys.

```typescript
async list(options?: {
  prefix?: string;
  limit?: number;
  tags?: string[];
}): Promise<string[]>
```

##### getMany(keys)

Get multiple values.

```typescript
async getMany(keys: string[]): Promise<Record<string, any>>
```

##### setMany(entries)

Set multiple values.

```typescript
async setMany(
  entries: Array<{ key: string; value: any; options?: any }>
): Promise<void>
```

##### clear()

Clear all entries.

```typescript
async clear(): Promise<void>
```

### Cache

Response caching.

#### Methods

##### get(key, varyBy?)

Get cached value.

```typescript
get(key: string, varyBy?: Record<string, string>): any | null
```

##### set(key, value, options?)

Set cached value.

```typescript
set(key: string, value: any, options?: CacheOptions): void

interface CacheOptions {
  ttl?: number;
  tags?: string[];
  vary?: string[];
}
```

##### invalidateByTags(tags)

Invalidate by tags.

```typescript
invalidateByTags(tags: string[]): number
```

##### invalidateByPrefix(prefix)

Invalidate by prefix.

```typescript
invalidateByPrefix(prefix: string): number
```

##### getStats()

Get cache statistics.

```typescript
getStats(): CacheStats
```

## Monitoring API

### MetricsService

Collects and aggregates metrics.

#### Methods

##### record(name, value, labels?, unit?)

Record a metric.

```typescript
record(
  name: string,
  value: number,
  labels?: Record<string, string>,
  unit?: string
): void
```

##### increment(name, value?, labels?)

Increment a counter.

```typescript
increment(
  name: string,
  value?: number,
  labels?: Record<string, string>
): void
```

##### gauge(name, value, labels?)

Set a gauge value.

```typescript
gauge(
  name: string,
  value: number,
  labels?: Record<string, string>
): void
```

##### timing(name, duration, labels?)

Record timing.

```typescript
timing(
  name: string,
  duration: number,
  labels?: Record<string, string>
): void
```

##### getSummary()

Get metrics summary.

```typescript
getSummary(): MetricsSummary
```

##### exportPrometheus()

Export in Prometheus format.

```typescript
exportPrometheus(): string
```

### Logger

Structured logging.

#### Methods

##### debug|info|warn|error|fatal(message, metadata?)

Log messages at different levels.

```typescript
info(message: string, metadata?: Record<string, any>): void
error(message: string, error?: Error, metadata?: Record<string, any>): void
```

##### logRequest(method, path, statusCode, duration, metadata?)

Log HTTP request.

```typescript
logRequest(
  method: string,
  path: string,
  statusCode: number,
  duration: number,
  metadata?: Record<string, any>
): void
```

##### getRecent(limit?, filter?)

Get recent logs.

```typescript
getRecent(
  limit?: number,
  filter?: { level?: LogLevel; functionId?: string }
): LogEntry[]
```

##### search(query, options?)

Search logs.

```typescript
search(
  query: string,
  options?: { limit?: number; level?: LogLevel }
): LogEntry[]
```

### Tracer

Distributed tracing.

#### Methods

##### startTrace(name, tags?)

Start a new trace.

```typescript
startTrace(name: string, tags?: Record<string, string>): Span
```

##### startSpan(name, parentSpan, tags?)

Start a child span.

```typescript
startSpan(
  name: string,
  parentSpan: Span,
  tags?: Record<string, string>
): Span
```

##### finishSpan(span, error?)

Finish a span.

```typescript
finishSpan(span: Span, error?: Error): void
```

##### getTrace(traceId)

Get trace by ID.

```typescript
getTrace(traceId: string): Trace | undefined
```

##### getRecentTraces(limit?)

Get recent traces.

```typescript
getRecentTraces(limit?: number): Trace[]
```

##### exportJaeger(traceId)

Export in Jaeger format.

```typescript
exportJaeger(traceId: string): any
```

## Events

The platform emits various events for monitoring and debugging.

### Platform Events

```typescript
platform.on('ready', () => {});
platform.on('deployment:completed', (result) => {});
platform.on('deployment:failed', (result) => {});
platform.on('metric', (metric) => {});
platform.on('trace:finish', (trace) => {});
platform.on('shutdown', () => {});
```

### Deployment Events

```typescript
service.on('deployment:started', (status) => {});
service.on('deployment:progress', (status) => {});
service.on('deployment:completed', (result) => {});
service.on('deployment:failed', (result) => {});
```

### Router Events

```typescript
router.on('route:added', (route) => {});
router.on('route:removed', (path) => {});
router.on('route:updated', (route) => {});
```

## Error Handling

All async methods can throw errors. Wrap in try-catch:

```typescript
try {
  await platform.deploy({...});
} catch (error) {
  if (error.message.includes('exists')) {
    // Handle duplicate
  } else {
    // Handle other errors
  }
}
```

## Type Definitions

All TypeScript type definitions are exported from the main modules:

```typescript
import {
  FunctionMetadata,
  DeploymentResult,
  ExecutionResult,
  RouteConfig,
  MetricsSummary,
  // etc.
} from './platform';
```
