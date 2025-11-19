/**
 * Auto-Scaler
 *
 * Intelligent auto-scaling system for serverless functions.
 * Scales based on traffic patterns, cold start metrics, and resource utilization.
 */

import { FunctionRuntime } from "./function-runtime.ts";
import { MonitoringService } from "./monitoring.ts";

// =============================================================================
// Type Definitions
// =============================================================================

export interface ScalingPolicy {
  functionId: string;
  minInstances: number;
  maxInstances: number;
  targetConcurrency: number;
  scaleUpThreshold: number; // % of capacity
  scaleDownThreshold: number; // % of capacity
  cooldownPeriod: number; // ms
}

export interface ScalingMetrics {
  functionId: string;
  activeInstances: number;
  warmInstances: number;
  busyInstances: number;
  queuedRequests: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  requestRate: number; // requests per second
  errorRate: number;
  coldStartRate: number;
  lastScalingAction?: {
    action: "scale-up" | "scale-down";
    timestamp: number;
    reason: string;
  };
}

// =============================================================================
// Auto-Scaler
// =============================================================================

export class AutoScaler {
  private runtime: FunctionRuntime;
  private monitoring: MonitoringService;
  private policies = new Map<string, ScalingPolicy>();
  private metrics = new Map<string, ScalingMetrics>();
  private requestQueues = new Map<string, number>();

  // Default scaling policy
  private readonly defaultPolicy: Omit<ScalingPolicy, "functionId"> = {
    minInstances: 1,
    maxInstances: 100,
    targetConcurrency: 10,
    scaleUpThreshold: 0.7, // Scale up at 70% capacity
    scaleDownThreshold: 0.3, // Scale down at 30% capacity
    cooldownPeriod: 60000, // 1 minute cooldown
  };

  constructor(runtime: FunctionRuntime, monitoring: MonitoringService) {
    this.runtime = runtime;
    this.monitoring = monitoring;

    console.log("[AUTOSCALER] Initializing Auto-Scaler...");
    this.startScalingLoop();
  }

  // ==========================================================================
  // Policy Management
  // ==========================================================================

  setPolicy(functionId: string, policy: Partial<ScalingPolicy>): void {
    const fullPolicy: ScalingPolicy = {
      functionId,
      ...this.defaultPolicy,
      ...policy,
    };

    this.policies.set(functionId, fullPolicy);
    console.log(`[AUTOSCALER] Set scaling policy for ${functionId}:`, fullPolicy);
  }

  getPolicy(functionId: string): ScalingPolicy {
    return this.policies.get(functionId) || {
      functionId,
      ...this.defaultPolicy,
    };
  }

  // ==========================================================================
  // Metrics Management
  // ==========================================================================

  updateMetrics(functionId: string, updates: Partial<ScalingMetrics>): void {
    const current = this.metrics.get(functionId) || {
      functionId,
      activeInstances: 0,
      warmInstances: 0,
      busyInstances: 0,
      queuedRequests: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      requestRate: 0,
      errorRate: 0,
      coldStartRate: 0,
    };

    this.metrics.set(functionId, { ...current, ...updates });
  }

  getMetrics(functionId: string): ScalingMetrics | undefined {
    return this.metrics.get(functionId);
  }

  updateQueueLength(functionId: string, length: number): void {
    this.requestQueues.set(functionId, length);
    this.updateMetrics(functionId, { queuedRequests: length });
  }

  // ==========================================================================
  // Scaling Loop
  // ==========================================================================

  private startScalingLoop(): void {
    setInterval(() => {
      this.evaluateScaling();
    }, 5000); // Check every 5 seconds
  }

  private evaluateScaling(): void {
    const functions = Array.from(this.metrics.keys());

    for (const functionId of functions) {
      try {
        this.evaluateFunctionScaling(functionId);
      } catch (error) {
        console.error(`[AUTOSCALER] Error evaluating scaling for ${functionId}:`, error);
      }
    }
  }

  private evaluateFunctionScaling(functionId: string): void {
    const policy = this.getPolicy(functionId);
    const metrics = this.metrics.get(functionId);
    const instanceMetrics = this.runtime.getInstanceMetrics(functionId);

    if (!metrics) {
      return;
    }

    // Update instance counts from runtime
    this.updateMetrics(functionId, {
      activeInstances: instanceMetrics.total,
      warmInstances: instanceMetrics.warm,
      busyInstances: instanceMetrics.busy,
    });

    // Check cooldown period
    if (metrics.lastScalingAction) {
      const timeSinceLastAction = Date.now() - metrics.lastScalingAction.timestamp;
      if (timeSinceLastAction < policy.cooldownPeriod) {
        return; // Still in cooldown
      }
    }

    // Calculate capacity utilization
    const totalCapacity = instanceMetrics.total * policy.targetConcurrency;
    const currentLoad = instanceMetrics.busy + metrics.queuedRequests;
    const utilization = totalCapacity > 0 ? currentLoad / totalCapacity : 0;

    // Decide scaling action
    if (this.shouldScaleUp(policy, metrics, utilization, instanceMetrics)) {
      this.scaleUp(functionId, policy, metrics, utilization);
    } else if (this.shouldScaleDown(policy, metrics, utilization, instanceMetrics)) {
      this.scaleDown(functionId, policy, metrics, utilization);
    }
  }

  // ==========================================================================
  // Scaling Decisions
  // ==========================================================================

  private shouldScaleUp(
    policy: ScalingPolicy,
    metrics: ScalingMetrics,
    utilization: number,
    instanceMetrics: { total: number; warm: number; busy: number; cold: number }
  ): boolean {
    // Scale up if we're at capacity
    if (instanceMetrics.total >= policy.maxInstances) {
      return false;
    }

    // Scale up if utilization is high
    if (utilization >= policy.scaleUpThreshold) {
      return true;
    }

    // Scale up if queue is building
    if (metrics.queuedRequests > 10) {
      return true;
    }

    // Scale up if we have cold starts and no warm instances
    if (metrics.coldStartRate > 0.1 && instanceMetrics.warm < 2) {
      return true;
    }

    // Scale up if response times are degrading
    if (metrics.p95ResponseTime > 1000 && instanceMetrics.warm < policy.maxInstances) {
      return true;
    }

    return false;
  }

  private shouldScaleDown(
    policy: ScalingPolicy,
    metrics: ScalingMetrics,
    utilization: number,
    instanceMetrics: { total: number; warm: number; busy: number; cold: number }
  ): boolean {
    // Don't scale below minimum
    if (instanceMetrics.total <= policy.minInstances) {
      return false;
    }

    // Scale down if utilization is low
    if (utilization <= policy.scaleDownThreshold) {
      return true;
    }

    // Scale down if we have too many idle instances
    if (instanceMetrics.warm > policy.minInstances * 2 && metrics.requestRate < 1) {
      return true;
    }

    return false;
  }

  // ==========================================================================
  // Scaling Actions
  // ==========================================================================

  private async scaleUp(
    functionId: string,
    policy: ScalingPolicy,
    metrics: ScalingMetrics,
    utilization: number
  ): Promise<void> {
    // Calculate how many instances to add
    const currentInstances = metrics.activeInstances;
    const targetInstances = Math.min(
      policy.maxInstances,
      Math.ceil(currentInstances * 1.5) // Scale by 50%
    );
    const instancesToAdd = targetInstances - currentInstances;

    if (instancesToAdd <= 0) {
      return;
    }

    const reason = this.getScaleUpReason(metrics, utilization);
    console.log(
      `[AUTOSCALER] Scaling UP ${functionId}: ${currentInstances} -> ${targetInstances} (${reason})`
    );

    try {
      // Pre-warm new instances
      await this.runtime.warmFunction(functionId, instancesToAdd);

      // Record scaling action
      this.updateMetrics(functionId, {
        lastScalingAction: {
          action: "scale-up",
          timestamp: Date.now(),
          reason,
        },
      });

      // Track in monitoring
      this.monitoring.recordScalingEvent(functionId, "scale-up", instancesToAdd, reason);

    } catch (error) {
      console.error(`[AUTOSCALER] Failed to scale up ${functionId}:`, error);
    }
  }

  private async scaleDown(
    functionId: string,
    policy: ScalingPolicy,
    metrics: ScalingMetrics,
    utilization: number
  ): Promise<void> {
    const currentInstances = metrics.activeInstances;
    const targetInstances = Math.max(
      policy.minInstances,
      Math.floor(currentInstances * 0.7) // Scale down by 30%
    );
    const instancesToRemove = currentInstances - targetInstances;

    if (instancesToRemove <= 0) {
      return;
    }

    const reason = this.getScaleDownReason(metrics, utilization);
    console.log(
      `[AUTOSCALER] Scaling DOWN ${functionId}: ${currentInstances} -> ${targetInstances} (${reason})`
    );

    // Record scaling action
    this.updateMetrics(functionId, {
      lastScalingAction: {
        action: "scale-down",
        timestamp: Date.now(),
        reason,
      },
    });

    // Track in monitoring
    this.monitoring.recordScalingEvent(functionId, "scale-down", instancesToRemove, reason);

    // Note: Actual instance removal happens in runtime cleanup
  }

  // ==========================================================================
  // Helpers
  // ==========================================================================

  private getScaleUpReason(metrics: ScalingMetrics, utilization: number): string {
    if (utilization >= 0.9) {
      return `High utilization (${Math.round(utilization * 100)}%)`;
    }
    if (metrics.queuedRequests > 10) {
      return `Queue buildup (${metrics.queuedRequests} requests)`;
    }
    if (metrics.coldStartRate > 0.1) {
      return `High cold start rate (${Math.round(metrics.coldStartRate * 100)}%)`;
    }
    if (metrics.p95ResponseTime > 1000) {
      return `Slow response times (p95: ${metrics.p95ResponseTime}ms)`;
    }
    return `Capacity threshold reached (${Math.round(utilization * 100)}%)`;
  }

  private getScaleDownReason(metrics: ScalingMetrics, utilization: number): string {
    if (utilization <= 0.3) {
      return `Low utilization (${Math.round(utilization * 100)}%)`;
    }
    if (metrics.requestRate < 1) {
      return `Low request rate (${metrics.requestRate.toFixed(2)} req/s)`;
    }
    return `Under capacity (${Math.round(utilization * 100)}%)`;
  }

  // ==========================================================================
  // Predictive Scaling
  // ==========================================================================

  enablePredictiveScaling(functionId: string, enabled: boolean): void {
    // TODO: Implement ML-based predictive scaling
    console.log(`[AUTOSCALER] Predictive scaling ${enabled ? "enabled" : "disabled"} for ${functionId}`);
  }

  // ==========================================================================
  // Scheduled Scaling
  // ==========================================================================

  scheduleScaling(functionId: string, schedule: {
    cron: string;
    minInstances: number;
    maxInstances: number;
  }): void {
    // TODO: Implement scheduled scaling for known traffic patterns
    console.log(`[AUTOSCALER] Scheduled scaling configured for ${functionId}:`, schedule);
  }

  // ==========================================================================
  // Burst Handling
  // ==========================================================================

  async handleBurst(functionId: string, estimatedRequests: number): Promise<void> {
    const policy = this.getPolicy(functionId);
    const requiredInstances = Math.ceil(estimatedRequests / policy.targetConcurrency);
    const instancesNeeded = Math.min(policy.maxInstances, requiredInstances);

    console.log(`[AUTOSCALER] Handling burst for ${functionId}: warming ${instancesNeeded} instances`);

    await this.runtime.warmFunction(functionId, instancesNeeded);
  }

  // ==========================================================================
  // Cost Optimization
  // ==========================================================================

  optimizeForCost(functionId: string): void {
    const policy = this.getPolicy(functionId);

    // More aggressive scale-down for cost optimization
    this.setPolicy(functionId, {
      ...policy,
      scaleDownThreshold: 0.5, // Scale down earlier
      cooldownPeriod: 30000, // Faster scale-down
      minInstances: 0, // Allow scaling to zero
    });

    console.log(`[AUTOSCALER] Cost optimization enabled for ${functionId}`);
  }

  optimizeForPerformance(functionId: string): void {
    const policy = this.getPolicy(functionId);

    // More aggressive scale-up for performance
    this.setPolicy(functionId, {
      ...policy,
      scaleUpThreshold: 0.5, // Scale up earlier
      minInstances: 2, // Keep warm instances
      targetConcurrency: 5, // Lower concurrency per instance
    });

    console.log(`[AUTOSCALER] Performance optimization enabled for ${functionId}`);
  }
}
