/**
 * Function Runtime Manager
 *
 * Manages function execution environments with blazing-fast cold starts.
 * Showcases Elide's <20ms cold start performance.
 */

// =============================================================================
// Type Definitions
// =============================================================================

export interface FunctionDefinition {
  id: string;
  name: string;
  runtime: "typescript" | "python" | "ruby";
  handler: string;
  code: string;
  environment?: Record<string, string>;
  secrets?: string[];
  memory: number;
  timeout: number;
}

export interface RuntimeInstance {
  id: string;
  functionId: string;
  status: "cold" | "warming" | "warm" | "busy" | "terminating";
  runtime: "typescript" | "python" | "ruby";
  startedAt: number;
  lastUsed: number;
  invocations: number;
  memoryUsed: number;
}

export interface InvocationResult {
  requestId: string;
  statusCode: number;
  body: any;
  headers?: Record<string, string>;
  duration: number;
  memoryUsed: number;
  coldStart: boolean;
  logs: string[];
}

export interface RuntimeContext {
  functionId: string;
  requestId: string;
  timestamp: number;
  memory: number;
  timeout: number;
  environment: Record<string, string>;
}

// =============================================================================
// Function Runtime
// =============================================================================

export class FunctionRuntime {
  private instances = new Map<string, RuntimeInstance[]>();
  private functions = new Map<string, FunctionDefinition>();
  private instanceCounter = 0;

  // Configuration
  private readonly maxInstanceAge = 5 * 60 * 1000; // 5 minutes
  private readonly maxIdleTime = 60 * 1000; // 1 minute
  private readonly warmPoolSize = 2; // Keep 2 warm instances per function

  constructor() {
    console.log("[RUNTIME] Initializing Function Runtime...");
    this.startCleanupTask();
  }

  // ==========================================================================
  // Function Registration
  // ==========================================================================

  registerFunction(func: FunctionDefinition): void {
    this.functions.set(func.id, func);
    console.log(`[RUNTIME] Registered function: ${func.name} (${func.id})`);
  }

  unregisterFunction(functionId: string): void {
    this.functions.delete(functionId);

    // Terminate all instances
    const instances = this.instances.get(functionId) || [];
    for (const instance of instances) {
      this.terminateInstance(instance.id);
    }
    this.instances.delete(functionId);

    console.log(`[RUNTIME] Unregistered function: ${functionId}`);
  }

  getFunction(functionId: string): FunctionDefinition | undefined {
    return this.functions.get(functionId);
  }

  // ==========================================================================
  // Instance Management
  // ==========================================================================

  private createInstance(functionId: string): RuntimeInstance {
    const func = this.functions.get(functionId);
    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    const instance: RuntimeInstance = {
      id: `inst-${this.instanceCounter++}`,
      functionId,
      status: "cold",
      runtime: func.runtime,
      startedAt: Date.now(),
      lastUsed: Date.now(),
      invocations: 0,
      memoryUsed: 0,
    };

    const pool = this.instances.get(functionId) || [];
    pool.push(instance);
    this.instances.set(functionId, pool);

    console.log(`[RUNTIME] Created instance ${instance.id} for ${functionId} (${func.runtime})`);
    return instance;
  }

  private getAvailableInstance(functionId: string): RuntimeInstance | undefined {
    const pool = this.instances.get(functionId) || [];
    return pool.find((inst) => inst.status === "warm");
  }

  private getOrCreateInstance(functionId: string): RuntimeInstance {
    const available = this.getAvailableInstance(functionId);
    if (available) {
      return available;
    }
    return this.createInstance(functionId);
  }

  private updateInstanceStatus(instanceId: string, status: RuntimeInstance["status"]): void {
    for (const pool of this.instances.values()) {
      const instance = pool.find((inst) => inst.id === instanceId);
      if (instance) {
        instance.status = status;
        instance.lastUsed = Date.now();
        return;
      }
    }
  }

  private terminateInstance(instanceId: string): void {
    for (const [functionId, pool] of this.instances.entries()) {
      const index = pool.findIndex((inst) => inst.id === instanceId);
      if (index !== -1) {
        pool[index].status = "terminating";
        console.log(`[RUNTIME] Terminating instance ${instanceId}`);
        pool.splice(index, 1);

        if (pool.length === 0) {
          this.instances.delete(functionId);
        } else {
          this.instances.set(functionId, pool);
        }
        return;
      }
    }
  }

  // ==========================================================================
  // Cold Start Optimization
  // ==========================================================================

  async warmFunction(functionId: string, count: number = this.warmPoolSize): Promise<void> {
    console.log(`[RUNTIME] Pre-warming ${count} instances for function ${functionId}`);

    const promises = [];
    for (let i = 0; i < count; i++) {
      const instance = this.createInstance(functionId);
      promises.push(this.warmInstance(instance));
    }

    await Promise.all(promises);
    console.log(`[RUNTIME] Pre-warming complete for ${functionId}`);
  }

  private async warmInstance(instance: RuntimeInstance): Promise<void> {
    const startTime = Date.now();
    console.log(`[RUNTIME] Warming instance ${instance.id}...`);

    this.updateInstanceStatus(instance.id, "warming");

    // Elide's blazing-fast cold start - typically <20ms
    const func = this.functions.get(instance.functionId);
    if (!func) {
      throw new Error(`Function not found: ${instance.functionId}`);
    }

    // Simulate runtime initialization
    // In production, this would:
    // 1. Load the runtime (TypeScript/Python/Ruby)
    // 2. Parse and compile the function code
    // 3. Initialize the execution environment
    // 4. Set up environment variables and secrets
    await this.initializeRuntime(instance.runtime);

    // Compile the function code
    await this.compileFunction(func);

    this.updateInstanceStatus(instance.id, "warm");

    const duration = Date.now() - startTime;
    console.log(`[RUNTIME] Instance ${instance.id} warmed in ${duration}ms`);

    // Track this as a cold start metric
    return;
  }

  private async initializeRuntime(runtime: "typescript" | "python" | "ruby"): Promise<void> {
    // Elide's native TypeScript runtime is instant
    if (runtime === "typescript") {
      // Near-instant initialization thanks to Elide
      await new Promise((resolve) => setTimeout(resolve, 5));
      return;
    }

    // Python and Ruby runtimes are also fast with Elide
    if (runtime === "python") {
      await new Promise((resolve) => setTimeout(resolve, 15));
      return;
    }

    if (runtime === "ruby") {
      await new Promise((resolve) => setTimeout(resolve, 12));
      return;
    }
  }

  private async compileFunction(func: FunctionDefinition): Promise<void> {
    // Simulate function compilation
    // Elide compiles TypeScript instantly
    if (func.runtime === "typescript") {
      await new Promise((resolve) => setTimeout(resolve, 5));
    } else {
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
  }

  // ==========================================================================
  // Function Invocation
  // ==========================================================================

  async invoke(functionId: string, payload: any, headers?: Record<string, string>): Promise<InvocationResult> {
    const startTime = Date.now();
    const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const func = this.functions.get(functionId);
    if (!func) {
      throw new Error(`Function not found: ${functionId}`);
    }

    // Get or create instance
    const instance = this.getOrCreateInstance(functionId);
    let coldStart = false;

    // Warm up if needed (Elide's <20ms cold start!)
    if (instance.status === "cold") {
      coldStart = true;
      await this.warmInstance(instance);
    } else if (instance.status === "warming") {
      // Wait for warm-up to complete
      await this.waitForWarm(instance.id);
    }

    // Mark instance as busy
    this.updateInstanceStatus(instance.id, "busy");

    try {
      // Execute the function
      const result = await this.executeFunction(func, instance, {
        functionId,
        requestId,
        timestamp: Date.now(),
        memory: func.memory,
        timeout: func.timeout,
        environment: func.environment || {},
      }, payload, headers);

      // Update instance stats
      instance.invocations++;
      instance.memoryUsed = result.memoryUsed;

      const duration = Date.now() - startTime;

      return {
        ...result,
        requestId,
        duration,
        coldStart,
      };

    } finally {
      // Return instance to warm pool
      this.updateInstanceStatus(instance.id, "warm");
    }
  }

  private async waitForWarm(instanceId: string, maxWait = 5000): Promise<void> {
    const start = Date.now();
    while (Date.now() - start < maxWait) {
      for (const pool of this.instances.values()) {
        const instance = pool.find((i) => i.id === instanceId);
        if (instance && instance.status === "warm") {
          return;
        }
      }
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`Instance ${instanceId} failed to warm up in time`);
  }

  private async executeFunction(
    func: FunctionDefinition,
    instance: RuntimeInstance,
    context: RuntimeContext,
    payload: any,
    headers?: Record<string, string>
  ): Promise<Omit<InvocationResult, "requestId" | "duration" | "coldStart">> {
    const logs: string[] = [];

    logs.push(`[${new Date().toISOString()}] START RequestId: ${context.requestId}`);
    logs.push(`[${new Date().toISOString()}] Function: ${func.name}`);
    logs.push(`[${new Date().toISOString()}] Runtime: ${func.runtime}`);
    logs.push(`[${new Date().toISOString()}] Instance: ${instance.id}`);

    try {
      // Execute function based on runtime
      let result: any;

      switch (func.runtime) {
        case "typescript":
          result = await this.executeTypeScript(func, payload, context, logs);
          break;
        case "python":
          result = await this.executePython(func, payload, context, logs);
          break;
        case "ruby":
          result = await this.executeRuby(func, payload, context, logs);
          break;
        default:
          throw new Error(`Unsupported runtime: ${func.runtime}`);
      }

      logs.push(`[${new Date().toISOString()}] END RequestId: ${context.requestId}`);

      return {
        statusCode: result.statusCode || 200,
        body: result.body,
        headers: result.headers,
        memoryUsed: Math.floor(Math.random() * func.memory),
        logs,
      };

    } catch (error) {
      logs.push(`[${new Date().toISOString()}] ERROR: ${error}`);
      logs.push(`[${new Date().toISOString()}] END RequestId: ${context.requestId}`);

      return {
        statusCode: 500,
        body: {
          error: error instanceof Error ? error.message : "Function execution failed",
        },
        memoryUsed: Math.floor(Math.random() * func.memory),
        logs,
      };
    }
  }

  // ==========================================================================
  // Runtime Executors
  // ==========================================================================

  private async executeTypeScript(
    func: FunctionDefinition,
    payload: any,
    context: RuntimeContext,
    logs: string[]
  ): Promise<any> {
    logs.push(`[${new Date().toISOString()}] Executing TypeScript function...`);

    // Simulate TypeScript execution
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 50 + 10));

    // Mock response
    return {
      statusCode: 200,
      body: {
        message: "Function executed successfully",
        function: func.name,
        runtime: "typescript",
        payload,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async executePython(
    func: FunctionDefinition,
    payload: any,
    context: RuntimeContext,
    logs: string[]
  ): Promise<any> {
    logs.push(`[${new Date().toISOString()}] Executing Python function...`);

    // Simulate Python execution
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 80 + 20));

    return {
      statusCode: 200,
      body: {
        message: "Python function executed successfully",
        function: func.name,
        runtime: "python",
        payload,
        timestamp: new Date().toISOString(),
      },
    };
  }

  private async executeRuby(
    func: FunctionDefinition,
    payload: any,
    context: RuntimeContext,
    logs: string[]
  ): Promise<any> {
    logs.push(`[${new Date().toISOString()}] Executing Ruby function...`);

    // Simulate Ruby execution
    await new Promise((resolve) => setTimeout(resolve, Math.random() * 70 + 15));

    return {
      statusCode: 200,
      body: {
        message: "Ruby function executed successfully",
        function: func.name,
        runtime: "ruby",
        payload,
        timestamp: new Date().toISOString(),
      },
    };
  }

  // ==========================================================================
  // Metrics
  // ==========================================================================

  getInstanceMetrics(functionId: string): {
    total: number;
    warm: number;
    busy: number;
    cold: number;
  } {
    const pool = this.instances.get(functionId) || [];
    return {
      total: pool.length,
      warm: pool.filter((i) => i.status === "warm").length,
      busy: pool.filter((i) => i.status === "busy").length,
      cold: pool.filter((i) => i.status === "cold").length,
    };
  }

  getTotalInvocations(functionId: string): number {
    const pool = this.instances.get(functionId) || [];
    return pool.reduce((sum, inst) => sum + inst.invocations, 0);
  }

  // ==========================================================================
  // Cleanup
  // ==========================================================================

  private startCleanupTask(): void {
    setInterval(() => {
      this.cleanup();
    }, 30000); // Run every 30 seconds
  }

  private cleanup(): void {
    const now = Date.now();
    let terminated = 0;

    for (const [functionId, pool] of this.instances.entries()) {
      const kept: RuntimeInstance[] = [];

      for (const instance of pool) {
        const age = now - instance.startedAt;
        const idle = now - instance.lastUsed;

        // Remove old or idle instances, but keep minimum warm pool
        const shouldRemove =
          age > this.maxInstanceAge ||
          (instance.status === "warm" && idle > this.maxIdleTime);

        if (shouldRemove && kept.length >= this.warmPoolSize) {
          console.log(
            `[RUNTIME] Removing instance ${instance.id} (age: ${age}ms, idle: ${idle}ms)`
          );
          terminated++;
        } else {
          kept.push(instance);
        }
      }

      if (kept.length === 0) {
        this.instances.delete(functionId);
      } else {
        this.instances.set(functionId, kept);
      }
    }

    if (terminated > 0) {
      console.log(`[RUNTIME] Cleanup: terminated ${terminated} instances`);
    }
  }
}
