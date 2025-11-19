/**
 * Load Balancer Module
 *
 * Provides load balancing and health checking:
 * - Round-robin algorithm
 * - Least connections algorithm
 * - Weighted round-robin
 * - IP hash (consistent routing)
 * - Health checking
 * - Circuit breaker pattern
 * - Failover support
 */

// ==================== Types & Interfaces ====================

export interface Backend {
  id: string;
  url: string;
  weight: number;
  healthy: boolean;
  activeConnections: number;
  totalRequests: number;
  totalErrors: number;
  lastHealthCheck?: number;
  responseTime: number[];
  metadata?: Record<string, any>;
}

export interface HealthCheckConfig {
  interval: number;
  timeout: number;
  healthyThreshold: number;
  unhealthyThreshold: number;
  path?: string;
  method?: string;
  expectedStatus?: number;
}

export interface LoadBalancerConfig {
  algorithm: 'round-robin' | 'least-connections' | 'weighted' | 'ip-hash' | 'random';
  healthCheck?: HealthCheckConfig;
  retries?: number;
  retryDelay?: number;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  resetTimeout: number;
  halfOpenMaxRequests: number;
}

export type CircuitState = 'closed' | 'open' | 'half-open';

export interface CircuitBreaker {
  state: CircuitState;
  failures: number;
  lastFailureTime?: number;
  nextRetryTime?: number;
  halfOpenRequests: number;
}

// ==================== Load Balancing Algorithms ====================

class RoundRobinBalancer {
  private currentIndex: number = 0;

  select(backends: Backend[]): Backend | null {
    const healthy = backends.filter(b => b.healthy);
    if (healthy.length === 0) return null;

    const selected = healthy[this.currentIndex % healthy.length];
    this.currentIndex = (this.currentIndex + 1) % healthy.length;

    return selected;
  }
}

class LeastConnectionsBalancer {
  select(backends: Backend[]): Backend | null {
    const healthy = backends.filter(b => b.healthy);
    if (healthy.length === 0) return null;

    return healthy.reduce((min, backend) =>
      backend.activeConnections < min.activeConnections ? backend : min
    );
  }
}

class WeightedRoundRobinBalancer {
  private currentIndex: number = 0;
  private currentWeight: number = 0;

  select(backends: Backend[]): Backend | null {
    const healthy = backends.filter(b => b.healthy);
    if (healthy.length === 0) return null;

    const maxWeight = Math.max(...healthy.map(b => b.weight));
    const gcd = this.getGCD(healthy.map(b => b.weight));

    while (true) {
      this.currentIndex = (this.currentIndex + 1) % healthy.length;

      if (this.currentIndex === 0) {
        this.currentWeight = this.currentWeight - gcd;
        if (this.currentWeight <= 0) {
          this.currentWeight = maxWeight;
        }
      }

      const backend = healthy[this.currentIndex];
      if (backend.weight >= this.currentWeight) {
        return backend;
      }
    }
  }

  private getGCD(numbers: number[]): number {
    const gcd2 = (a: number, b: number): number => (b === 0 ? a : gcd2(b, a % b));
    return numbers.reduce((acc, num) => gcd2(acc, num));
  }
}

class IPHashBalancer {
  select(backends: Backend[], ipAddress: string): Backend | null {
    const healthy = backends.filter(b => b.healthy);
    if (healthy.length === 0) return null;

    const hash = this.hashCode(ipAddress);
    const index = Math.abs(hash) % healthy.length;

    return healthy[index];
  }

  private hashCode(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash;
  }
}

class RandomBalancer {
  select(backends: Backend[]): Backend | null {
    const healthy = backends.filter(b => b.healthy);
    if (healthy.length === 0) return null;

    const index = Math.floor(Math.random() * healthy.length);
    return healthy[index];
  }
}

// ==================== Health Checker ====================

export class HealthChecker {
  private config: HealthCheckConfig;
  private healthStates: Map<string, { consecutive: number; healthy: boolean }> = new Map();
  private checkInterval: any;

  constructor(config?: HealthCheckConfig) {
    this.config = config || {
      interval: 10000,
      timeout: 5000,
      healthyThreshold: 2,
      unhealthyThreshold: 3,
      path: '/health',
      method: 'GET',
      expectedStatus: 200
    };
  }

  /**
   * Start health checking
   */
  start(backends: Backend[], onStatusChange?: (backend: Backend, healthy: boolean) => void): void {
    this.checkInterval = setInterval(async () => {
      for (const backend of backends) {
        await this.checkBackend(backend, onStatusChange);
      }
    }, this.config.interval);
  }

  /**
   * Stop health checking
   */
  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
  }

  /**
   * Check a single backend
   */
  async checkBackend(
    backend: Backend,
    onStatusChange?: (backend: Backend, healthy: boolean) => void
  ): Promise<boolean> {
    const healthUrl = backend.url + (this.config.path || '/health');

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

      const response = await fetch(healthUrl, {
        method: this.config.method || 'GET',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      const isHealthy = response.status === (this.config.expectedStatus || 200);

      this.updateHealthState(backend, isHealthy, onStatusChange);

      backend.lastHealthCheck = Date.now();

      return isHealthy;
    } catch (error) {
      console.error(`Health check failed for ${backend.url}:`, error);
      this.updateHealthState(backend, false, onStatusChange);
      backend.lastHealthCheck = Date.now();
      return false;
    }
  }

  private updateHealthState(
    backend: Backend,
    isHealthy: boolean,
    onStatusChange?: (backend: Backend, healthy: boolean) => void
  ): void {
    let state = this.healthStates.get(backend.id);

    if (!state) {
      state = { consecutive: 0, healthy: backend.healthy };
      this.healthStates.set(backend.id, state);
    }

    if (isHealthy) {
      state.consecutive = state.healthy ? 0 : state.consecutive + 1;

      if (!state.healthy && state.consecutive >= this.config.healthyThreshold) {
        state.healthy = true;
        backend.healthy = true;
        state.consecutive = 0;

        if (onStatusChange) {
          onStatusChange(backend, true);
        }
      }
    } else {
      state.consecutive = !state.healthy ? 0 : state.consecutive + 1;

      if (state.healthy && state.consecutive >= this.config.unhealthyThreshold) {
        state.healthy = false;
        backend.healthy = false;
        state.consecutive = 0;

        if (onStatusChange) {
          onStatusChange(backend, false);
        }
      }
    }
  }
}

// ==================== Circuit Breaker ====================

export class CircuitBreakerManager {
  private breakers: Map<string, CircuitBreaker> = new Map();
  private config: CircuitBreakerConfig;

  constructor(config?: CircuitBreakerConfig) {
    this.config = config || {
      failureThreshold: 5,
      resetTimeout: 60000,
      halfOpenMaxRequests: 3
    };
  }

  /**
   * Get or create circuit breaker for backend
   */
  getBreaker(backendId: string): CircuitBreaker {
    let breaker = this.breakers.get(backendId);

    if (!breaker) {
      breaker = {
        state: 'closed',
        failures: 0,
        halfOpenRequests: 0
      };
      this.breakers.set(backendId, breaker);
    }

    return breaker;
  }

  /**
   * Check if request is allowed
   */
  allowRequest(backendId: string): boolean {
    const breaker = this.getBreaker(backendId);

    switch (breaker.state) {
      case 'closed':
        return true;

      case 'open':
        if (breaker.nextRetryTime && Date.now() >= breaker.nextRetryTime) {
          breaker.state = 'half-open';
          breaker.halfOpenRequests = 0;
          return true;
        }
        return false;

      case 'half-open':
        return breaker.halfOpenRequests < this.config.halfOpenMaxRequests;
    }
  }

  /**
   * Record successful request
   */
  recordSuccess(backendId: string): void {
    const breaker = this.getBreaker(backendId);

    if (breaker.state === 'half-open') {
      breaker.halfOpenRequests++;

      if (breaker.halfOpenRequests >= this.config.halfOpenMaxRequests) {
        breaker.state = 'closed';
        breaker.failures = 0;
        breaker.halfOpenRequests = 0;
      }
    } else {
      breaker.failures = 0;
    }
  }

  /**
   * Record failed request
   */
  recordFailure(backendId: string): void {
    const breaker = this.getBreaker(backendId);

    breaker.failures++;
    breaker.lastFailureTime = Date.now();

    if (breaker.state === 'half-open') {
      this.openCircuit(breaker);
    } else if (breaker.failures >= this.config.failureThreshold) {
      this.openCircuit(breaker);
    }
  }

  /**
   * Reset circuit breaker
   */
  reset(backendId: string): void {
    const breaker = this.getBreaker(backendId);
    breaker.state = 'closed';
    breaker.failures = 0;
    breaker.halfOpenRequests = 0;
    delete breaker.nextRetryTime;
  }

  private openCircuit(breaker: CircuitBreaker): void {
    breaker.state = 'open';
    breaker.nextRetryTime = Date.now() + this.config.resetTimeout;
  }

  /**
   * Get circuit state
   */
  getState(backendId: string): CircuitState {
    return this.getBreaker(backendId).state;
  }
}

// ==================== Load Balancer ====================

export class LoadBalancer {
  private backends: Map<string, Backend> = new Map();
  private config: LoadBalancerConfig;
  private balancer: any;
  private healthChecker: HealthChecker;
  private circuitBreaker: CircuitBreakerManager;

  constructor(config?: LoadBalancerConfig) {
    this.config = config || {
      algorithm: 'round-robin',
      retries: 3,
      retryDelay: 100
    };

    this.balancer = this.createBalancer(this.config.algorithm);
    this.healthChecker = new HealthChecker(this.config.healthCheck);
    this.circuitBreaker = new CircuitBreakerManager();
  }

  /**
   * Add backend server
   */
  addBackend(backend: Omit<Backend, 'activeConnections' | 'totalRequests' | 'totalErrors' | 'responseTime'>): void {
    const fullBackend: Backend = {
      ...backend,
      activeConnections: 0,
      totalRequests: 0,
      totalErrors: 0,
      responseTime: []
    };

    this.backends.set(backend.id, fullBackend);
  }

  /**
   * Remove backend server
   */
  removeBackend(backendId: string): boolean {
    return this.backends.delete(backendId);
  }

  /**
   * Get backend for request
   */
  getBackend(ipAddress?: string): Backend | null {
    const backendList = Array.from(this.backends.values());

    // Filter out backends with open circuits
    const available = backendList.filter(b =>
      b.healthy && this.circuitBreaker.allowRequest(b.id)
    );

    if (available.length === 0) {
      return null;
    }

    if (this.config.algorithm === 'ip-hash' && ipAddress) {
      return (this.balancer as IPHashBalancer).select(available, ipAddress);
    }

    return this.balancer.select(available);
  }

  /**
   * Forward request to backend
   */
  async forwardRequest(
    request: Request,
    ipAddress?: string
  ): Promise<Response | null> {
    const startTime = Date.now();
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < (this.config.retries || 1); attempt++) {
      if (attempt > 0 && this.config.retryDelay) {
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay));
      }

      const backend = this.getBackend(ipAddress);
      if (!backend) {
        return null;
      }

      backend.activeConnections++;
      backend.totalRequests++;

      try {
        const targetUrl = backend.url + new URL(request.url).pathname;

        const response = await fetch(targetUrl, {
          method: request.method,
          headers: request.headers,
          body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined
        });

        const duration = Date.now() - startTime;
        backend.responseTime.push(duration);

        // Keep only last 100 response times
        if (backend.responseTime.length > 100) {
          backend.responseTime = backend.responseTime.slice(-100);
        }

        backend.activeConnections--;

        if (response.ok) {
          this.circuitBreaker.recordSuccess(backend.id);
        } else if (response.status >= 500) {
          backend.totalErrors++;
          this.circuitBreaker.recordFailure(backend.id);
        }

        return response;
      } catch (error) {
        console.error(`Request to ${backend.url} failed:`, error);
        backend.activeConnections--;
        backend.totalErrors++;
        this.circuitBreaker.recordFailure(backend.id);
        lastError = error as Error;
      }
    }

    return null;
  }

  /**
   * Start health checking
   */
  startHealthChecks(): void {
    this.healthChecker.start(
      Array.from(this.backends.values()),
      (backend, healthy) => {
        console.log(`Backend ${backend.url} is now ${healthy ? 'healthy' : 'unhealthy'}`);

        if (healthy) {
          this.circuitBreaker.reset(backend.id);
        }
      }
    );
  }

  /**
   * Stop health checking
   */
  stopHealthChecks(): void {
    this.healthChecker.stop();
  }

  /**
   * Get backend statistics
   */
  getStats(): Array<{
    id: string;
    url: string;
    healthy: boolean;
    circuitState: CircuitState;
    activeConnections: number;
    totalRequests: number;
    totalErrors: number;
    errorRate: number;
    avgResponseTime: number;
  }> {
    return Array.from(this.backends.values()).map(backend => ({
      id: backend.id,
      url: backend.url,
      healthy: backend.healthy,
      circuitState: this.circuitBreaker.getState(backend.id),
      activeConnections: backend.activeConnections,
      totalRequests: backend.totalRequests,
      totalErrors: backend.totalErrors,
      errorRate: backend.totalRequests > 0 ? backend.totalErrors / backend.totalRequests : 0,
      avgResponseTime: backend.responseTime.length > 0
        ? backend.responseTime.reduce((a, b) => a + b, 0) / backend.responseTime.length
        : 0
    }));
  }

  /**
   * Get all backends
   */
  getBackends(): Backend[] {
    return Array.from(this.backends.values());
  }

  private createBalancer(algorithm: string): any {
    switch (algorithm) {
      case 'round-robin':
        return new RoundRobinBalancer();

      case 'least-connections':
        return new LeastConnectionsBalancer();

      case 'weighted':
        return new WeightedRoundRobinBalancer();

      case 'ip-hash':
        return new IPHashBalancer();

      case 'random':
        return new RandomBalancer();

      default:
        return new RoundRobinBalancer();
    }
  }
}
