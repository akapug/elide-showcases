/**
 * Service Mesh Implementation with Elide
 *
 * Demonstrates enterprise-grade service mesh patterns including:
 * - Service registry and discovery
 * - Intelligent load balancing
 * - Circuit breaker pattern
 * - Automatic retry logic
 * - Comprehensive metrics collection
 */

interface ServiceInstance {
  id: string;
  name: string;
  host: string;
  port: number;
  healthCheckUrl: string;
  metadata: Record<string, string>;
  lastHealthCheck: number;
  healthy: boolean;
  failureCount: number;
  requestCount: number;
  avgResponseTime: number;
}

interface CircuitBreakerState {
  status: 'CLOSED' | 'OPEN' | 'HALF_OPEN';
  failureCount: number;
  lastFailureTime: number;
  successCount: number;
  nextRetryTime: number;
}

interface MetricsData {
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalLatency: number;
  circuitBreakers: Map<string, CircuitBreakerState>;
  serviceHealth: Map<string, boolean>;
}

class ServiceRegistry {
  private services: Map<string, ServiceInstance[]> = new Map();
  private roundRobinIndex: Map<string, number> = new Map();

  register(service: ServiceInstance): void {
    const instances = this.services.get(service.name) || [];
    const existingIndex = instances.findIndex(s => s.id === service.id);

    if (existingIndex >= 0) {
      instances[existingIndex] = service;
    } else {
      instances.push(service);
    }

    this.services.set(service.name, instances);
    console.log(`Service registered: ${service.name} (${service.id})`);
}

  deregister(serviceName: string, instanceId: string): void {
    const instances = this.services.get(serviceName);
    if (instances) {
      const filtered = instances.filter(s => s.id !== instanceId);
      this.services.set(serviceName, filtered);
      console.log(`Service deregistered: ${serviceName} (${instanceId})`);
    }
}

  getHealthyInstances(serviceName: string): ServiceInstance[] {
    const instances = this.services.get(serviceName) || [];
    return instances.filter(s => s.healthy);
}

  getAllServices(): Map<string, ServiceInstance[]> {
    return new Map(this.services);
}

  getServiceInstance(serviceName: string, strategy: 'round-robin' | 'least-conn' = 'round-robin'): ServiceInstance | null {
    const instances = this.getHealthyInstances(serviceName);
    if (instances.length === 0) return null;

    if (strategy === 'round-robin') {
      const index = this.roundRobinIndex.get(serviceName) || 0;
      const instance = instances[index % instances.length];
      this.roundRobinIndex.set(serviceName, (index + 1) % instances.length);
      return instance;
    } else {
      return instances.reduce((prev, curr) =>
        curr.requestCount < prev.requestCount ? curr : prev
      );
    }
}
}

class CircuitBreaker {
  private state: CircuitBreakerState;
  private readonly failureThreshold: number = 5;
  private readonly successThreshold: number = 2;
  private readonly timeout: number = 60000; // 60 seconds

  constructor(private serviceName: string) {
    this.state = {
      status: 'CLOSED',
      failureCount: 0,
      lastFailureTime: 0,
      successCount: 0,
      nextRetryTime: 0
    };
}

  getState(): CircuitBreakerState {
    return { ...this.state };
}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.status === 'OPEN') {
      if (Date.now() < this.state.nextRetryTime) {
        throw new Error(`Circuit breaker is OPEN for ${this.serviceName}`);
      }
      this.state.status = 'HALF_OPEN';
      console.log(`Circuit breaker transitioning to HALF_OPEN for ${this.serviceName}`);
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
}

  private onSuccess(): void {
    if (this.state.status === 'HALF_OPEN') {
      this.state.successCount++;
      if (this.state.successCount >= this.successThreshold) {
        this.state.status = 'CLOSED';
        this.state.failureCount = 0;
        this.state.successCount = 0;
        console.log(`Circuit breaker CLOSED for ${this.serviceName}`);
      }
    } else {
      this.state.failureCount = 0;
    }
}

  private onFailure(): void {
    this.state.failureCount++;
    this.state.lastFailureTime = Date.now();

    if (this.state.failureCount >= this.failureThreshold) {
      this.state.status = 'OPEN';
      this.state.nextRetryTime = Date.now() + this.timeout;
      this.state.successCount = 0;
      console.log(`Circuit breaker OPEN for ${this.serviceName}`);
    }
}
}

class MetricsCollector {
  private metrics: MetricsData = {
    totalRequests: 0,
    successfulRequests: 0,
    failedRequests: 0,
    totalLatency: 0,
    circuitBreakers: new Map(),
    serviceHealth: new Map()
  };

  recordRequest(serviceName: string, success: boolean, latency: number): void {
    this.metrics.totalRequests++;
    this.metrics.totalLatency += latency;

    if (success) {
      this.metrics.successfulRequests++;
    } else {
      this.metrics.failedRequests++;
    }
}

  updateCircuitBreakerState(serviceName: string, state: CircuitBreakerState): void {
    this.metrics.circuitBreakers.set(serviceName, state);
}

  updateServiceHealth(serviceName: string, healthy: boolean): void {
    this.metrics.serviceHealth.set(serviceName, healthy);
}

  getMetrics(): any {
    const avgLatency = this.metrics.totalRequests > 0
      ? this.metrics.totalLatency / this.metrics.totalRequests
      : 0;

    return {
      totalRequests: this.metrics.totalRequests,
      successfulRequests: this.metrics.successfulRequests,
      failedRequests: this.metrics.failedRequests,
      successRate: this.metrics.totalRequests > 0
        ? (this.metrics.successfulRequests / this.metrics.totalRequests * 100).toFixed(2) + '%'
        : '0%',
      averageLatency: Math.round(avgLatency) + 'ms',
      circuitBreakers: Object.fromEntries(this.metrics.circuitBreakers),
      serviceHealth: Object.fromEntries(this.metrics.serviceHealth)
    };
}
}

class ServiceMesh {
  private registry: ServiceRegistry;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private metricsCollector: MetricsCollector;
  private healthCheckInterval: Timer | null = null;

  constructor() {
    this.registry = new ServiceRegistry();
    this.circuitBreakers = new Map();
    this.metricsCollector = new MetricsCollector();
}

  registerService(service: ServiceInstance): void {
    this.registry.register(service);
    if (!this.circuitBreakers.has(service.name)) {
      this.circuitBreakers.set(service.name, new CircuitBreaker(service.name));
    }
}

  async callService(
    serviceName: string,
    endpoint: string,
    options: RequestInit = {},
    retries: number = 3
  ): Promise<any> {
    const circuitBreaker = this.circuitBreakers.get(serviceName);
    if (!circuitBreaker) {
      throw new Error(`No circuit breaker found for service: ${serviceName}`);
    }

    let lastError: Error | null = null;
    const startTime = Date.now();

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        const result = await circuitBreaker.execute(async () => {
          const instance = this.registry.getServiceInstance(serviceName);
          if (!instance) {
            throw new Error(`No healthy instance available for service: ${serviceName}`);
          }

          const url = `http://${instance.host}:${instance.port}${endpoint}`;
          const response = await fetch(url, {
            ...options,
            headers: {
              'X-Request-ID': String(crypto.randomUUID()),
              'X-Service-Mesh': 'true',
              ...options.headers
            }
          });

          if (!response.ok) {
            throw new Error(`Service returned status ${response.status}`);
          }

          instance.requestCount++;
          const responseTime = Date.now() - startTime;
          instance.avgResponseTime = (instance.avgResponseTime + responseTime) / 2;

          return await response.json();
        });

        const latency = Date.now() - startTime;
        this.metricsCollector.recordRequest(serviceName, true, latency);
        this.metricsCollector.updateCircuitBreakerState(serviceName, circuitBreaker.getState());

        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt + 1} failed for ${serviceName}: ${lastError.message}`);

        if (attempt < retries) {
          const backoff = Math.pow(2, attempt) * 100;
          await new Promise(resolve => setTimeout(resolve, backoff));
        }
      }
    }

    const latency = Date.now() - startTime;
    this.metricsCollector.recordRequest(serviceName, false, latency);
    this.metricsCollector.updateCircuitBreakerState(serviceName, circuitBreaker.getState());

    throw new Error(`Failed to call ${serviceName} after ${retries + 1} attempts: ${lastError?.message}`);
}

  startHealthChecks(intervalMs: number = 10000): void {
    this.healthCheckInterval = setInterval(async () => {
      const services = this.registry.getAllServices();

      for (const [serviceName, instances] of services) {
        for (const instance of instances) {
          try {
            const response = await fetch(instance.healthCheckUrl, {
              method: 'GET',
              signal: AbortSignal.timeout(5000)
            });

            const wasHealthy = instance.healthy;
            instance.healthy = response.ok;
            instance.lastHealthCheck = Date.now();

            if (response.ok) {
              instance.failureCount = 0;
            } else {
              instance.failureCount++;
            }

            if (wasHealthy !== instance.healthy) {
              console.log(`Service ${serviceName} (${instance.id}) health changed: ${instance.healthy}`);
            }

            this.metricsCollector.updateServiceHealth(`${serviceName}:${instance.id}`, instance.healthy);
          } catch (error) {
            instance.healthy = false;
            instance.failureCount++;
            instance.lastHealthCheck = Date.now();
            this.metricsCollector.updateServiceHealth(`${serviceName}:${instance.id}`, false);
          }
        }
      }
    }, intervalMs);

    console.log(`Health checks started (interval: ${intervalMs}ms)`);
}

  stopHealthChecks(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('Health checks stopped');
    }
}

  getMetrics(): any {
    return this.metricsCollector.getMetrics();
}

  getServiceRegistry(): Map<string, ServiceInstance[]> {
    return this.registry.getAllServices();
}
}

// Create service mesh instance
const serviceMesh = new ServiceMesh();

// Elide server implementation
export default async function fetch(request: Request): Promise<Response> {
  const url = new URL(request.url);

    // Service registration endpoint
    if (url.pathname === '/register' && request.method === 'POST') {
      try {
        const service = await request.json() as ServiceInstance;
        serviceMesh.registerService(service);
        return new Response(JSON.stringify({ success: true, serviceId: service.id }), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Service invocation endpoint
    if (url.pathname === '/invoke' && request.method === 'POST') {
      try {
        const { serviceName, endpoint, method = 'GET', body } = await request.json();
        const result = await serviceMesh.callService(serviceName, endpoint, { method, body });
        return new Response(JSON.stringify(result), {
          headers: { 'Content-Type': 'application/json' }
        });
      } catch (error) {
        return new Response(JSON.stringify({ error: (error as Error).message }), {
          status: 503,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    }

    // Metrics endpoint
    if (url.pathname === '/metrics') {
      const metrics = serviceMesh.getMetrics();
      return new Response(JSON.stringify(metrics, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Service registry endpoint
    if (url.pathname === '/services') {
      const services = Array.from(serviceMesh.getServiceRegistry().entries()).map(([name, instances]) => ({
        name,
        instances: instances.map(i => ({
          id: i.id,
          host: i.host,
          port: i.port,
          healthy: i.healthy,
          requestCount: i.requestCount,
          avgResponseTime: Math.round(i.avgResponseTime) + 'ms'
        }))
      }));

      return new Response(JSON.stringify(services, null, 2), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Health check endpoint
    if (url.pathname === '/health') {
      return new Response(JSON.stringify({ status: 'healthy', timestamp: Date.now() }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response('Service Mesh - Not Found', { status: 404 });
}


// Start health checks
if (import.meta.url.includes("server.ts")) {
  serviceMesh.startHealthChecks(10000);

  console.log('🕸️  Service Mesh running on http://localhost:3000');
  console.log('Endpoints:');
  console.log('  POST /register - Register a service instance');
  console.log('  POST /invoke - Invoke a service through the mesh');
  console.log('  GET /metrics - View service mesh metrics');
  console.log('🕸️  Service Mesh ready on port 3000');
  console.log('Features: Service Discovery | Circuit Breaker | Load Balancing');
}
