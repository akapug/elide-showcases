/**
 * Load Balancer - Distributes requests across multiple instances
 *
 * Supports round-robin, least-connections, and weighted load balancing.
 */

export interface Instance {
  id: string;
  functionId: string;
  region: string;
  healthy: boolean;
  weight: number;
  connections: number;
  lastHealthCheck: Date;
  metadata?: Record<string, any>;
}

export interface LoadBalancerConfig {
  strategy: 'round-robin' | 'least-connections' | 'weighted' | 'random';
  healthCheckInterval: number; // milliseconds
  maxConnections: number;
}

export class LoadBalancer {
  private config: LoadBalancerConfig;
  private instances: Map<string, Instance>;
  private roundRobinIndex: number;

  constructor(config: Partial<LoadBalancerConfig> = {}) {
    this.config = {
      strategy: config.strategy || 'round-robin',
      healthCheckInterval: config.healthCheckInterval || 30000,
      maxConnections: config.maxConnections || 1000,
    };

    this.instances = new Map();
    this.roundRobinIndex = 0;
  }

  /**
   * Register an instance
   */
  registerInstance(instance: Omit<Instance, 'connections' | 'lastHealthCheck'>): void {
    const fullInstance: Instance = {
      ...instance,
      connections: 0,
      lastHealthCheck: new Date(),
    };

    this.instances.set(instance.id, fullInstance);
  }

  /**
   * Unregister an instance
   */
  unregisterInstance(instanceId: string): boolean {
    return this.instances.delete(instanceId);
  }

  /**
   * Mark instance as healthy or unhealthy
   */
  setHealth(instanceId: string, healthy: boolean): boolean {
    const instance = this.instances.get(instanceId);
    if (!instance) return false;

    instance.healthy = healthy;
    instance.lastHealthCheck = new Date();
    return true;
  }

  /**
   * Select an instance for a request
   */
  selectInstance(functionId: string, region?: string): Instance | null {
    // Get healthy instances
    const candidates = Array.from(this.instances.values()).filter(
      (i) =>
        i.healthy &&
        i.functionId === functionId &&
        (!region || i.region === region) &&
        i.connections < this.config.maxConnections
    );

    if (candidates.length === 0) return null;

    // Select based on strategy
    switch (this.config.strategy) {
      case 'round-robin':
        return this.selectRoundRobin(candidates);
      case 'least-connections':
        return this.selectLeastConnections(candidates);
      case 'weighted':
        return this.selectWeighted(candidates);
      case 'random':
        return this.selectRandom(candidates);
      default:
        return candidates[0];
    }
  }

  /**
   * Increment connection count for an instance
   */
  incrementConnections(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance) {
      instance.connections++;
    }
  }

  /**
   * Decrement connection count for an instance
   */
  decrementConnections(instanceId: string): void {
    const instance = this.instances.get(instanceId);
    if (instance && instance.connections > 0) {
      instance.connections--;
    }
  }

  /**
   * Get all instances
   */
  getInstances(): Instance[] {
    return Array.from(this.instances.values());
  }

  /**
   * Get instance by ID
   */
  getInstance(instanceId: string): Instance | undefined {
    return this.instances.get(instanceId);
  }

  /**
   * Get statistics
   */
  getStats(): {
    total: number;
    healthy: number;
    unhealthy: number;
    totalConnections: number;
    byRegion: Record<string, number>;
  } {
    const instances = Array.from(this.instances.values());
    const byRegion: Record<string, number> = {};

    let healthy = 0;
    let unhealthy = 0;
    let totalConnections = 0;

    for (const instance of instances) {
      if (instance.healthy) {
        healthy++;
      } else {
        unhealthy++;
      }

      totalConnections += instance.connections;
      byRegion[instance.region] = (byRegion[instance.region] || 0) + 1;
    }

    return {
      total: instances.length,
      healthy,
      unhealthy,
      totalConnections,
      byRegion,
    };
  }

  // Private load balancing strategies

  private selectRoundRobin(instances: Instance[]): Instance {
    const instance = instances[this.roundRobinIndex % instances.length];
    this.roundRobinIndex++;
    return instance;
  }

  private selectLeastConnections(instances: Instance[]): Instance {
    return instances.reduce((min, current) =>
      current.connections < min.connections ? current : min
    );
  }

  private selectWeighted(instances: Instance[]): Instance {
    const totalWeight = instances.reduce((sum, i) => sum + i.weight, 0);
    let random = Math.random() * totalWeight;

    for (const instance of instances) {
      random -= instance.weight;
      if (random <= 0) {
        return instance;
      }
    }

    return instances[0];
  }

  private selectRandom(instances: Instance[]): Instance {
    return instances[Math.floor(Math.random() * instances.length)];
  }
}

export default LoadBalancer;
