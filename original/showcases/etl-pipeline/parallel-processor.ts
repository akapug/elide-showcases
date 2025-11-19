/**
 * Parallel Processor
 *
 * High-performance parallel data processing:
 * - Worker pool management
 * - Batch processing
 * - Stream processing
 * - Load balancing
 * - Memory management
 * - Backpressure handling
 * - Performance monitoring
 * - Resource optimization
 */

export interface WorkerConfig {
  maxWorkers: number;
  batchSize: number;
  queueSize: number;
  timeout?: number;
}

export interface ProcessingTask<T, R> {
  id: string;
  data: T;
  processor: (data: T) => Promise<R> | R;
  priority?: number;
  retries?: number;
}

export interface ProcessingResult<R> {
  taskId: string;
  result?: R;
  error?: Error;
  duration: number;
  attempts: number;
}

export interface ProcessorMetrics {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  activeWorkers: number;
  queuedTasks: number;
  avgProcessingTime: number;
  throughput: number;
  memoryUsage: number;
}

// ==================== Parallel Processor ====================

export class ParallelProcessor<T, R> {
  private config: WorkerConfig;
  private queue: ProcessingTask<T, R>[] = [];
  private activeWorkers = 0;
  private results: ProcessingResult<R>[] = [];
  private metrics: ProcessorMetrics;
  private processingTimes: number[] = [];
  private startTime = 0;

  constructor(config: WorkerConfig) {
    this.config = config;
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      activeWorkers: 0,
      queuedTasks: 0,
      avgProcessingTime: 0,
      throughput: 0,
      memoryUsage: 0
    };
  }

  async processBatch(
    data: T[],
    processor: (item: T) => Promise<R> | R
  ): Promise<ProcessingResult<R>[]> {
    this.startTime = Date.now();
    this.results = [];

    // Create tasks
    const tasks: ProcessingTask<T, R>[] = data.map((item, index) => ({
      id: `task_${index}`,
      data: item,
      processor,
      retries: 3
    }));

    this.queue.push(...tasks);
    this.metrics.totalTasks = tasks.length;
    this.metrics.queuedTasks = this.queue.length;

    // Start workers
    const workers: Promise<void>[] = [];

    for (let i = 0; i < this.config.maxWorkers; i++) {
      workers.push(this.worker());
    }

    // Wait for all workers to finish
    await Promise.all(workers);

    this.updateMetrics();

    return this.results;
  }

  async processStream(
    stream: AsyncGenerator<T[], void>,
    processor: (item: T) => Promise<R> | R,
    onBatchComplete?: (results: ProcessingResult<R>[]) => void
  ): Promise<void> {
    this.startTime = Date.now();

    // Start workers
    const workers: Promise<void>[] = [];

    for (let i = 0; i < this.config.maxWorkers; i++) {
      workers.push(this.worker());
    }

    // Feed stream into queue
    const feeder = (async () => {
      for await (const batch of stream) {
        // Wait if queue is full (backpressure)
        while (this.queue.length >= this.config.queueSize) {
          await this.sleep(10);
        }

        const tasks: ProcessingTask<T, R>[] = batch.map((item, index) => ({
          id: `task_${this.metrics.totalTasks + index}`,
          data: item,
          processor,
          retries: 3
        }));

        this.queue.push(...tasks);
        this.metrics.totalTasks += tasks.length;
        this.metrics.queuedTasks = this.queue.length;

        if (onBatchComplete && this.results.length > 0) {
          const batchResults = this.results.splice(0, this.results.length);
          onBatchComplete(batchResults);
        }
      }
    })();

    await feeder;

    // Wait for queue to drain
    while (this.queue.length > 0 || this.activeWorkers > 0) {
      await this.sleep(10);
    }

    // Signal workers to stop
    await Promise.all(workers);

    if (onBatchComplete && this.results.length > 0) {
      onBatchComplete(this.results);
    }
  }

  private async worker(): Promise<void> {
    while (this.queue.length > 0 || this.activeWorkers > 0) {
      const task = this.queue.shift();

      if (!task) {
        await this.sleep(10);
        continue;
      }

      this.activeWorkers++;
      this.metrics.activeWorkers = this.activeWorkers;
      this.metrics.queuedTasks = this.queue.length;

      const result = await this.processTask(task);
      this.results.push(result);

      this.activeWorkers--;
      this.metrics.activeWorkers = this.activeWorkers;

      if (result.error) {
        this.metrics.failedTasks++;
      } else {
        this.metrics.completedTasks++;
      }

      this.processingTimes.push(result.duration);
    }
  }

  private async processTask(task: ProcessingTask<T, R>): Promise<ProcessingResult<R>> {
    const startTime = Date.now();
    let attempts = 0;
    let lastError: Error | undefined;

    while (attempts < (task.retries || 1)) {
      attempts++;

      try {
        const result = await this.executeWithTimeout(
          task.processor(task.data),
          this.config.timeout
        );

        return {
          taskId: task.id,
          result,
          duration: Date.now() - startTime,
          attempts
        };
      } catch (error) {
        lastError = error as Error;

        if (attempts < (task.retries || 1)) {
          await this.sleep(100 * attempts); // Exponential backoff
        }
      }
    }

    return {
      taskId: task.id,
      error: lastError,
      duration: Date.now() - startTime,
      attempts
    };
  }

  private async executeWithTimeout<T>(
    promise: Promise<T> | T,
    timeout?: number
  ): Promise<T> {
    if (!timeout) {
      return await promise;
    }

    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Task timeout')), timeout)
      )
    ]);
  }

  private updateMetrics(): void {
    const elapsed = (Date.now() - this.startTime) / 1000; // seconds

    this.metrics.avgProcessingTime = this.processingTimes.length > 0
      ? this.processingTimes.reduce((a, b) => a + b, 0) / this.processingTimes.length
      : 0;

    this.metrics.throughput = elapsed > 0
      ? this.metrics.completedTasks / elapsed
      : 0;

    // Estimate memory usage (rough approximation)
    this.metrics.memoryUsage = this.results.length * 1024; // ~1KB per result
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getMetrics(): ProcessorMetrics {
    this.updateMetrics();
    return { ...this.metrics };
  }

  reset(): void {
    this.queue = [];
    this.results = [];
    this.activeWorkers = 0;
    this.processingTimes = [];
    this.metrics = {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      activeWorkers: 0,
      queuedTasks: 0,
      avgProcessingTime: 0,
      throughput: 0,
      memoryUsage: 0
    };
  }
}

// ==================== Batch Processor ====================

export class BatchProcessor<T, R> {
  private batchSize: number;
  private processor: (batch: T[]) => Promise<R[]>;

  constructor(batchSize: number, processor: (batch: T[]) => Promise<R[]>) {
    this.batchSize = batchSize;
    this.processor = processor;
  }

  async process(data: T[]): Promise<R[]> {
    const results: R[] = [];

    for (let i = 0; i < data.length; i += this.batchSize) {
      const batch = data.slice(i, i + this.batchSize);
      const batchResults = await this.processor(batch);
      results.push(...batchResults);

      console.log(`Processed batch ${Math.floor(i / this.batchSize) + 1}/${Math.ceil(data.length / this.batchSize)}`);
    }

    return results;
  }

  async *processStream(stream: AsyncGenerator<T[], void>): AsyncGenerator<R[], void> {
    let buffer: T[] = [];

    for await (const chunk of stream) {
      buffer.push(...chunk);

      while (buffer.length >= this.batchSize) {
        const batch = buffer.splice(0, this.batchSize);
        const results = await this.processor(batch);
        yield results;
      }
    }

    // Process remaining items
    if (buffer.length > 0) {
      const results = await this.processor(buffer);
      yield results;
    }
  }
}

// ==================== Pipeline Executor ====================

export class PipelineExecutor<T> {
  private stages: ((data: T[]) => Promise<T[]>)[] = [];

  addStage(stage: (data: T[]) => Promise<T[]>): this {
    this.stages.push(stage);
    return this;
  }

  async execute(data: T[]): Promise<T[]> {
    let result = data;

    for (let i = 0; i < this.stages.length; i++) {
      console.log(`Executing stage ${i + 1}/${this.stages.length}...`);
      const startTime = Date.now();

      result = await this.stages[i](result);

      const duration = Date.now() - startTime;
      console.log(`Stage ${i + 1} completed in ${duration}ms (${result.length} records)`);
    }

    return result;
  }

  async executeParallel(data: T[], parallelism: number): Promise<T[]> {
    let result = data;

    for (let i = 0; i < this.stages.length; i++) {
      console.log(`Executing stage ${i + 1}/${this.stages.length} with parallelism ${parallelism}...`);
      const startTime = Date.now();

      // Split data into chunks for parallel processing
      const chunkSize = Math.ceil(result.length / parallelism);
      const chunks: T[][] = [];

      for (let j = 0; j < result.length; j += chunkSize) {
        chunks.push(result.slice(j, j + chunkSize));
      }

      // Process chunks in parallel
      const processedChunks = await Promise.all(
        chunks.map(chunk => this.stages[i](chunk))
      );

      result = processedChunks.flat();

      const duration = Date.now() - startTime;
      console.log(`Stage ${i + 1} completed in ${duration}ms (${result.length} records)`);
    }

    return result;
  }
}

// ==================== Memory-Efficient Stream Processor ====================

export class StreamProcessor<T, R> {
  private processor: (item: T) => Promise<R> | R;
  private batchSize: number;
  private maxMemory: number;

  constructor(
    processor: (item: T) => Promise<R> | R,
    batchSize = 1000,
    maxMemoryMB = 512
  ) {
    this.processor = processor;
    this.batchSize = batchSize;
    this.maxMemory = maxMemoryMB * 1024 * 1024;
  }

  async *process(stream: AsyncGenerator<T[], void>): AsyncGenerator<R[], void> {
    let buffer: T[] = [];
    let estimatedMemory = 0;

    for await (const chunk of stream) {
      buffer.push(...chunk);
      estimatedMemory += this.estimateSize(chunk);

      // Process when buffer is full or memory limit reached
      while (buffer.length >= this.batchSize || estimatedMemory >= this.maxMemory) {
        const batch = buffer.splice(0, this.batchSize);
        const results = await this.processBatch(batch);

        estimatedMemory = this.estimateSize(buffer);

        yield results;
      }
    }

    // Process remaining items
    if (buffer.length > 0) {
      const results = await this.processBatch(buffer);
      yield results;
    }
  }

  private async processBatch(batch: T[]): Promise<R[]> {
    const results: R[] = [];

    for (const item of batch) {
      try {
        const result = await this.processor(item);
        results.push(result);
      } catch (error) {
        console.error('Processing error:', error);
      }
    }

    return results;
  }

  private estimateSize(data: any): number {
    // Rough estimation: 1KB per object
    return Array.isArray(data) ? data.length * 1024 : 1024;
  }
}

// ==================== Load Balancer ====================

export class LoadBalancer<T, R> {
  private processors: ((data: T) => Promise<R>)[];
  private currentIndex = 0;
  private loads: number[];

  constructor(processors: ((data: T) => Promise<R>)[]) {
    this.processors = processors;
    this.loads = new Array(processors.length).fill(0);
  }

  async process(data: T): Promise<R> {
    // Round-robin load balancing
    const processorIndex = this.currentIndex;
    this.currentIndex = (this.currentIndex + 1) % this.processors.length;

    this.loads[processorIndex]++;

    try {
      const result = await this.processors[processorIndex](data);
      this.loads[processorIndex]--;
      return result;
    } catch (error) {
      this.loads[processorIndex]--;
      throw error;
    }
  }

  async processLeastLoaded(data: T): Promise<R> {
    // Find processor with least load
    const processorIndex = this.loads.indexOf(Math.min(...this.loads));

    this.loads[processorIndex]++;

    try {
      const result = await this.processors[processorIndex](data);
      this.loads[processorIndex]--;
      return result;
    } catch (error) {
      this.loads[processorIndex]--;
      throw error;
    }
  }

  getLoads(): number[] {
    return [...this.loads];
  }
}

// ==================== Rate Limiter ====================

export class RateLimiter {
  private maxRequests: number;
  private windowMs: number;
  private requests: number[] = [];

  constructor(maxRequests: number, windowMs: number) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  async acquire(): Promise<void> {
    const now = Date.now();

    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);

    if (this.requests.length >= this.maxRequests) {
      const oldestRequest = this.requests[0];
      const waitTime = this.windowMs - (now - oldestRequest);

      console.log(`Rate limit reached, waiting ${waitTime}ms`);
      await this.sleep(waitTime);

      return this.acquire();
    }

    this.requests.push(now);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// ==================== Circuit Breaker ====================

export class CircuitBreaker<T, R> {
  private processor: (data: T) => Promise<R>;
  private failureThreshold: number;
  private resetTimeout: number;
  private failures = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';
  private lastFailureTime = 0;

  constructor(
    processor: (data: T) => Promise<R>,
    failureThreshold = 5,
    resetTimeout = 60000
  ) {
    this.processor = processor;
    this.failureThreshold = failureThreshold;
    this.resetTimeout = resetTimeout;
  }

  async process(data: T): Promise<R> {
    // Check if circuit should be reset
    if (this.state === 'open' && Date.now() - this.lastFailureTime >= this.resetTimeout) {
      this.state = 'half-open';
      this.failures = 0;
      console.log('Circuit breaker: half-open');
    }

    if (this.state === 'open') {
      throw new Error('Circuit breaker is open');
    }

    try {
      const result = await this.processor(data);

      if (this.state === 'half-open') {
        this.state = 'closed';
        this.failures = 0;
        console.log('Circuit breaker: closed');
      }

      return result;
    } catch (error) {
      this.failures++;
      this.lastFailureTime = Date.now();

      if (this.failures >= this.failureThreshold) {
        this.state = 'open';
        console.log('Circuit breaker: open');
      }

      throw error;
    }
  }

  getState(): 'closed' | 'open' | 'half-open' {
    return this.state;
  }

  reset(): void {
    this.state = 'closed';
    this.failures = 0;
    this.lastFailureTime = 0;
  }
}

// ==================== Performance Monitor ====================

export class PerformanceMonitor {
  private samples: Map<string, number[]> = new Map();
  private startTimes: Map<string, number> = new Map();

  start(label: string): void {
    this.startTimes.set(label, Date.now());
  }

  end(label: string): number {
    const startTime = this.startTimes.get(label);

    if (!startTime) {
      throw new Error(`No start time for label: ${label}`);
    }

    const duration = Date.now() - startTime;
    this.startTimes.delete(label);

    if (!this.samples.has(label)) {
      this.samples.set(label, []);
    }

    this.samples.get(label)!.push(duration);

    return duration;
  }

  getStats(label: string): {
    count: number;
    total: number;
    avg: number;
    min: number;
    max: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const samples = this.samples.get(label);

    if (!samples || samples.length === 0) {
      return null;
    }

    const sorted = [...samples].sort((a, b) => a - b);

    return {
      count: samples.length,
      total: samples.reduce((a, b) => a + b, 0),
      avg: samples.reduce((a, b) => a + b, 0) / samples.length,
      min: sorted[0],
      max: sorted[sorted.length - 1],
      p50: sorted[Math.floor(sorted.length * 0.5)],
      p95: sorted[Math.floor(sorted.length * 0.95)],
      p99: sorted[Math.floor(sorted.length * 0.99)]
    };
  }

  printStats(): void {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          PERFORMANCE STATISTICS                        ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    for (const [label, _] of this.samples) {
      const stats = this.getStats(label);

      if (!stats) continue;

      console.log(`${label}:`);
      console.log(`  Count: ${stats.count}`);
      console.log(`  Total: ${stats.total.toFixed(2)}ms`);
      console.log(`  Average: ${stats.avg.toFixed(2)}ms`);
      console.log(`  Min: ${stats.min.toFixed(2)}ms`);
      console.log(`  Max: ${stats.max.toFixed(2)}ms`);
      console.log(`  P50: ${stats.p50.toFixed(2)}ms`);
      console.log(`  P95: ${stats.p95.toFixed(2)}ms`);
      console.log(`  P99: ${stats.p99.toFixed(2)}ms`);
      console.log();
    }

    console.log('═'.repeat(80) + '\n');
  }

  reset(): void {
    this.samples.clear();
    this.startTimes.clear();
  }
}

// ==================== Resource Manager ====================

export class ResourceManager {
  private maxMemoryMB: number;
  private checkIntervalMs: number;
  private callbacks: (() => void)[] = [];
  private monitoring = false;

  constructor(maxMemoryMB = 1024, checkIntervalMs = 1000) {
    this.maxMemoryMB = maxMemoryMB;
    this.checkIntervalMs = checkIntervalMs;
  }

  startMonitoring(): void {
    if (this.monitoring) return;

    this.monitoring = true;

    const check = () => {
      if (!this.monitoring) return;

      const usage = this.getMemoryUsage();

      if (usage > this.maxMemoryMB) {
        console.warn(`Memory usage (${usage.toFixed(2)}MB) exceeded limit (${this.maxMemoryMB}MB)`);
        this.triggerCallbacks();
      }

      setTimeout(check, this.checkIntervalMs);
    };

    check();
  }

  stopMonitoring(): void {
    this.monitoring = false;
  }

  onMemoryPressure(callback: () => void): void {
    this.callbacks.push(callback);
  }

  private triggerCallbacks(): void {
    for (const callback of this.callbacks) {
      try {
        callback();
      } catch (error) {
        console.error('Error in memory pressure callback:', error);
      }
    }
  }

  private getMemoryUsage(): number {
    // Rough estimation - in production use actual memory APIs
    return 100; // MB
  }
}
