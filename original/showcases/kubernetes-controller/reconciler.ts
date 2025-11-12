/**
 * Reconciler - Advanced Reconciliation Logic
 *
 * Implements sophisticated reconciliation patterns with:
 * - Work queue with rate limiting
 * - Exponential backoff for retries
 * - Finalizer support for cleanup
 * - Status conditions management
 * - Drift detection and correction
 */

// ============================================================================
// Type Definitions
// ============================================================================

export interface CustomResource {
  apiVersion: string;
  kind: string;
  metadata: {
    name: string;
    namespace: string;
    uid: string;
    resourceVersion: string;
    generation: number;
    creationTimestamp: string;
    deletionTimestamp?: string;
    finalizers?: string[];
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
  spec: any;
  status?: any;
}

export interface ReconcileRequest {
  name: string;
  namespace: string;
  key: string;
}

export interface ReconcileResult {
  requeue: boolean;
  requeueAfter?: number;
  error?: Error;
}

export interface Condition {
  type: string;
  status: "True" | "False" | "Unknown";
  lastTransitionTime: string;
  lastUpdateTime?: string;
  reason: string;
  message: string;
  observedGeneration?: number;
}

export interface ReconcileContext {
  resource: CustomResource;
  isDeleting: boolean;
  hasFinalizer: boolean;
}

// ============================================================================
// Work Queue
// ============================================================================

class WorkQueue {
  private queue: ReconcileRequest[] = [];
  private processing = new Set<string>();
  private retryCount = new Map<string, number>();
  private maxRetries = 5;
  private baseDelay = 1000; // 1 second

  enqueue(req: ReconcileRequest): void {
    // Deduplicate - only add if not already queued or processing
    if (!this.processing.has(req.key) && !this.queue.some(r => r.key === req.key)) {
      this.queue.push(req);
    }
  }

  dequeue(): ReconcileRequest | undefined {
    const req = this.queue.shift();
    if (req) {
      this.processing.add(req.key);
    }
    return req;
  }

  done(key: string): void {
    this.processing.delete(key);
    this.retryCount.delete(key);
  }

  requeue(req: ReconcileRequest, error?: Error): number {
    const retries = (this.retryCount.get(req.key) || 0) + 1;
    this.retryCount.set(req.key, retries);
    this.processing.delete(req.key);

    if (retries > this.maxRetries) {
      console.error(`[RECONCILER] Max retries exceeded for ${req.key}:`, error);
      this.retryCount.delete(req.key);
      return -1; // Don't requeue
    }

    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    const delay = this.baseDelay * Math.pow(2, retries - 1);
    console.log(`[RECONCILER] Requeuing ${req.key} after ${delay}ms (attempt ${retries}/${this.maxRetries})`);

    return delay;
  }

  length(): number {
    return this.queue.length;
  }

  isProcessing(key: string): boolean {
    return this.processing.has(key);
  }
}

// ============================================================================
// Reconciler
// ============================================================================

export class Reconciler {
  private workQueue = new WorkQueue();
  private finalizerName = "cloudnative.elide.dev/finalizer";
  private running = false;
  private reconcileHandlers = new Map<string, ReconcileHandler>();

  /**
   * Register a reconcile handler for a specific resource kind
   */
  registerHandler(kind: string, handler: ReconcileHandler): void {
    this.reconcileHandlers.set(kind, handler);
    console.log(`[RECONCILER] Registered handler for ${kind}`);
  }

  /**
   * Start the reconciliation loop
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;
    console.log("[RECONCILER] Started reconciliation loop");
    this.processQueue();
  }

  /**
   * Stop the reconciliation loop
   */
  stop(): void {
    this.running = false;
    console.log("[RECONCILER] Stopped reconciliation loop");
  }

  /**
   * Enqueue a resource for reconciliation
   */
  enqueue(namespace: string, name: string): void {
    const key = this.getKey(namespace, name);
    this.workQueue.enqueue({ namespace, name, key });

    if (this.running) {
      this.processQueue();
    }
  }

  /**
   * Process the work queue
   */
  private async processQueue(): Promise<void> {
    while (this.running && this.workQueue.length() > 0) {
      const req = this.workQueue.dequeue();
      if (!req) break;

      try {
        const result = await this.reconcile(req);

        if (result.requeue) {
          if (result.requeueAfter) {
            // Explicit requeue after delay
            setTimeout(() => this.workQueue.enqueue(req), result.requeueAfter);
          } else if (result.error) {
            // Exponential backoff for errors
            const delay = this.workQueue.requeue(req, result.error);
            if (delay > 0) {
              setTimeout(() => this.workQueue.enqueue(req), delay);
            }
          } else {
            // Immediate requeue
            this.workQueue.enqueue(req);
          }
        } else {
          this.workQueue.done(req.key);
        }
      } catch (error) {
        console.error(`[RECONCILER] Unexpected error for ${req.key}:`, error);
        const delay = this.workQueue.requeue(req, error as Error);
        if (delay > 0) {
          setTimeout(() => this.workQueue.enqueue(req), delay);
        }
      }
    }
  }

  /**
   * Reconcile a single resource
   */
  private async reconcile(req: ReconcileRequest): Promise<ReconcileResult> {
    console.log(`[RECONCILER] Reconciling ${req.namespace}/${req.name}`);

    // Get resource from cache (would be injected in real implementation)
    const resource = await this.getResource(req.namespace, req.name);
    if (!resource) {
      console.log(`[RECONCILER] Resource ${req.key} not found, skipping`);
      return { requeue: false };
    }

    // Create reconcile context
    const ctx: ReconcileContext = {
      resource,
      isDeleting: !!resource.metadata.deletionTimestamp,
      hasFinalizer: resource.metadata.finalizers?.includes(this.finalizerName) || false,
    };

    // Handle deletion
    if (ctx.isDeleting) {
      return await this.handleDeletion(ctx);
    }

    // Ensure finalizer is present
    if (!ctx.hasFinalizer) {
      await this.addFinalizer(resource);
      return { requeue: true };
    }

    // Get handler for this resource kind
    const handler = this.reconcileHandlers.get(resource.kind);
    if (!handler) {
      console.warn(`[RECONCILER] No handler registered for kind ${resource.kind}`);
      return { requeue: false };
    }

    try {
      // Execute reconciliation
      const result = await handler.reconcile(ctx);

      // Update status if needed
      if (result.status) {
        await this.updateStatus(resource, result.status);
      }

      return {
        requeue: result.requeue,
        requeueAfter: result.requeueAfter,
      };
    } catch (error) {
      console.error(`[RECONCILER] Reconciliation failed for ${req.key}:`, error);

      // Update status with error condition
      await this.updateErrorStatus(resource, error as Error);

      return {
        requeue: true,
        error: error as Error,
      };
    }
  }

  /**
   * Handle resource deletion with finalizer cleanup
   */
  private async handleDeletion(ctx: ReconcileContext): Promise<ReconcileResult> {
    console.log(`[RECONCILER] Handling deletion for ${ctx.resource.metadata.namespace}/${ctx.resource.metadata.name}`);

    if (!ctx.hasFinalizer) {
      // Finalizer already removed, nothing to do
      return { requeue: false };
    }

    // Get handler for cleanup
    const handler = this.reconcileHandlers.get(ctx.resource.kind);
    if (handler) {
      try {
        await handler.cleanup(ctx);
        console.log(`[RECONCILER] Cleanup completed for ${ctx.resource.metadata.name}`);
      } catch (error) {
        console.error(`[RECONCILER] Cleanup failed:`, error);
        return {
          requeue: true,
          error: error as Error,
        };
      }
    }

    // Remove finalizer to allow deletion
    await this.removeFinalizer(ctx.resource);
    return { requeue: false };
  }

  /**
   * Add finalizer to resource
   */
  private async addFinalizer(resource: CustomResource): Promise<void> {
    if (!resource.metadata.finalizers) {
      resource.metadata.finalizers = [];
    }

    if (!resource.metadata.finalizers.includes(this.finalizerName)) {
      resource.metadata.finalizers.push(this.finalizerName);
      await this.updateResource(resource);
      console.log(`[RECONCILER] Added finalizer to ${resource.metadata.name}`);
    }
  }

  /**
   * Remove finalizer from resource
   */
  private async removeFinalizer(resource: CustomResource): Promise<void> {
    if (resource.metadata.finalizers) {
      resource.metadata.finalizers = resource.metadata.finalizers.filter(
        f => f !== this.finalizerName
      );
      await this.updateResource(resource);
      console.log(`[RECONCILER] Removed finalizer from ${resource.metadata.name}`);
    }
  }

  /**
   * Update resource status
   */
  private async updateStatus(resource: CustomResource, status: any): Promise<void> {
    resource.status = {
      ...resource.status,
      ...status,
      observedGeneration: resource.metadata.generation,
    };

    // Would update via API in real implementation
    console.log(`[RECONCILER] Updated status for ${resource.metadata.name}`);
  }

  /**
   * Update status with error condition
   */
  private async updateErrorStatus(resource: CustomResource, error: Error): Promise<void> {
    const condition: Condition = {
      type: "Ready",
      status: "False",
      lastTransitionTime: new Date().toISOString(),
      reason: "ReconciliationFailed",
      message: error.message,
      observedGeneration: resource.metadata.generation,
    };

    await this.updateStatus(resource, {
      phase: "Failed",
      conditions: this.updateConditions(resource.status?.conditions || [], condition),
    });
  }

  /**
   * Update conditions array, replacing existing condition of same type
   */
  private updateConditions(conditions: Condition[], newCondition: Condition): Condition[] {
    const existing = conditions.find(c => c.type === newCondition.type);

    if (existing) {
      // Update existing condition
      if (existing.status !== newCondition.status) {
        newCondition.lastTransitionTime = new Date().toISOString();
      } else {
        newCondition.lastTransitionTime = existing.lastTransitionTime;
      }

      newCondition.lastUpdateTime = new Date().toISOString();

      return conditions.map(c => c.type === newCondition.type ? newCondition : c);
    } else {
      // Add new condition
      return [...conditions, newCondition];
    }
  }

  /**
   * Get resource key
   */
  private getKey(namespace: string, name: string): string {
    return `${namespace}/${name}`;
  }

  /**
   * Get resource from cache/API (stub - would be implemented by controller)
   */
  private async getResource(namespace: string, name: string): Promise<CustomResource | undefined> {
    // This would be implemented by the controller
    return undefined;
  }

  /**
   * Update resource (stub - would be implemented by controller)
   */
  private async updateResource(resource: CustomResource): Promise<void> {
    // This would be implemented by the controller
  }
}

// ============================================================================
// Reconcile Handler Interface
// ============================================================================

export interface ReconcileHandler {
  /**
   * Reconcile the resource to desired state
   */
  reconcile(ctx: ReconcileContext): Promise<ReconcileHandlerResult>;

  /**
   * Cleanup resources before deletion
   */
  cleanup(ctx: ReconcileContext): Promise<void>;
}

export interface ReconcileHandlerResult {
  requeue: boolean;
  requeueAfter?: number;
  status?: any;
}

// ============================================================================
// Example Application Reconcile Handler
// ============================================================================

export class ApplicationReconcileHandler implements ReconcileHandler {
  async reconcile(ctx: ReconcileContext): Promise<ReconcileHandlerResult> {
    const resource = ctx.resource;
    const spec = resource.spec;

    console.log(`[HANDLER] Reconciling Application ${resource.metadata.name}`);

    // Check if status needs update
    const needsUpdate = !resource.status ||
      resource.status.observedGeneration !== resource.metadata.generation;

    if (needsUpdate) {
      console.log(`[HANDLER] Applying desired state: ${spec.replicas} replicas of ${spec.image}`);

      // Simulate deployment logic
      const status = {
        observedGeneration: resource.metadata.generation,
        replicas: spec.replicas,
        readyReplicas: spec.replicas,
        phase: "Running",
        conditions: [
          {
            type: "Ready",
            status: "True" as const,
            lastTransitionTime: new Date().toISOString(),
            reason: "ReconciliationSucceeded",
            message: "All replicas are ready",
            observedGeneration: resource.metadata.generation,
          },
          {
            type: "Progressing",
            status: "False" as const,
            lastTransitionTime: new Date().toISOString(),
            reason: "NewReplicaSetAvailable",
            message: "ReplicaSet is up to date",
            observedGeneration: resource.metadata.generation,
          },
        ],
      };

      return {
        requeue: false,
        status,
      };
    }

    console.log(`[HANDLER] Application ${resource.metadata.name} is in sync`);
    return { requeue: false };
  }

  async cleanup(ctx: ReconcileContext): Promise<void> {
    console.log(`[HANDLER] Cleaning up Application ${ctx.resource.metadata.name}`);
    // Perform cleanup: delete deployments, services, etc.
    // Simulate cleanup
    await new Promise(resolve => setTimeout(resolve, 100));
    console.log(`[HANDLER] Cleanup completed`);
  }
}
