/**
 * Batch Processor - Efficient Batch Inference Processing
 *
 * Handles batching of multiple inference requests for improved throughput,
 * automatic batching, dynamic batch sizing, and priority-based processing.
 */

export interface BatchRequest {
  id: string;
  modelId: string;
  input: any;
  priority: number;
  createdAt: Date;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface BatchResult {
  requestId: string;
  output: any;
  processingTime: number;
  tokensUsed: number;
  error?: string;
}

export interface BatchStats {
  totalBatches: number;
  totalRequests: number;
  averageBatchSize: number;
  averageProcessingTime: number;
  throughput: number; // requests per second
}

export class BatchProcessor {
  private queue: Map<string, BatchRequest[]> = new Map(); // Per-model queues
  private processing: boolean = false;
  private maxBatchSize: number;
  private maxWaitTimeMs: number;
  private stats: BatchStats;
  private processingCallbacks: Map<string, (result: BatchResult) => void> =
    new Map();

  constructor(maxBatchSize: number = 32, maxWaitTimeMs: number = 100) {
    this.maxBatchSize = maxBatchSize;
    this.maxWaitTimeMs = maxWaitTimeMs;
    this.stats = {
      totalBatches: 0,
      totalRequests: 0,
      averageBatchSize: 0,
      averageProcessingTime: 0,
      throughput: 0,
    };

    // Start the batch processor
    this.startBatchProcessor();
  }

  /**
   * Add a request to the batch queue
   */
  async addRequest(request: BatchRequest): Promise<BatchResult> {
    return new Promise((resolve, reject) => {
      // Add to queue
      if (!this.queue.has(request.modelId)) {
        this.queue.set(request.modelId, []);
      }

      const modelQueue = this.queue.get(request.modelId)!;
      modelQueue.push(request);

      // Sort by priority (higher priority first)
      modelQueue.sort((a, b) => b.priority - a.priority);

      // Register callback
      this.processingCallbacks.set(request.id, (result) => {
        if (result.error) {
          reject(new Error(result.error));
        } else {
          resolve(result);
        }
      });

      // If queue is large enough, trigger immediate processing
      if (modelQueue.length >= this.maxBatchSize) {
        this.processBatch(request.modelId);
      }
    });
  }

  /**
   * Start the automatic batch processor
   */
  private startBatchProcessor(): void {
    setInterval(() => {
      this.processAllQueues();
    }, this.maxWaitTimeMs);
  }

  /**
   * Process all queues
   */
  private async processAllQueues(): Promise<void> {
    if (this.processing) return;

    const modelIds = Array.from(this.queue.keys());
    for (const modelId of modelIds) {
      const queue = this.queue.get(modelId);
      if (queue && queue.length > 0) {
        await this.processBatch(modelId);
      }
    }
  }

  /**
   * Process a batch for a specific model
   */
  private async processBatch(modelId: string): Promise<void> {
    const queue = this.queue.get(modelId);
    if (!queue || queue.length === 0) return;

    this.processing = true;

    // Extract batch
    const batchSize = Math.min(this.maxBatchSize, queue.length);
    const batch = queue.splice(0, batchSize);

    const startTime = Date.now();

    try {
      // Process batch (simulate - in production, this would be actual inference)
      const results = await this.executeBatch(modelId, batch);

      const processingTime = Date.now() - startTime;

      // Update stats
      this.updateStats(batch.length, processingTime);

      // Deliver results
      for (const result of results) {
        const callback = this.processingCallbacks.get(result.requestId);
        if (callback) {
          callback(result);
          this.processingCallbacks.delete(result.requestId);
        }
      }
    } catch (error) {
      // Handle batch error
      console.error(`Batch processing error for model ${modelId}:`, error);

      // Send error to all requests in batch
      for (const request of batch) {
        const callback = this.processingCallbacks.get(request.id);
        if (callback) {
          callback({
            requestId: request.id,
            output: null,
            processingTime: 0,
            tokensUsed: 0,
            error: error instanceof Error ? error.message : "Batch processing failed",
          });
          this.processingCallbacks.delete(request.id);
        }
      }
    } finally {
      this.processing = false;
    }
  }

  /**
   * Execute a batch of requests (simulated)
   */
  private async executeBatch(
    modelId: string,
    batch: BatchRequest[]
  ): Promise<BatchResult[]> {
    // Simulate batch processing delay
    const baseDelay = 50;
    const perRequestDelay = 10;
    await new Promise((resolve) =>
      setTimeout(resolve, baseDelay + batch.length * perRequestDelay)
    );

    // Generate results
    const results: BatchResult[] = [];

    for (const request of batch) {
      const tokensUsed = Math.floor(Math.random() * 500) + 100;

      results.push({
        requestId: request.id,
        output: this.generateOutput(request),
        processingTime: perRequestDelay,
        tokensUsed,
      });
    }

    return results;
  }

  /**
   * Generate simulated output
   */
  private generateOutput(request: BatchRequest): any {
    return {
      model: request.modelId,
      result: `Processed batch request: ${JSON.stringify(request.input).substring(0, 100)}`,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Update statistics
   */
  private updateStats(batchSize: number, processingTime: number): void {
    this.stats.totalBatches++;
    this.stats.totalRequests += batchSize;

    // Update rolling averages
    this.stats.averageBatchSize =
      (this.stats.averageBatchSize * (this.stats.totalBatches - 1) + batchSize) /
      this.stats.totalBatches;

    this.stats.averageProcessingTime =
      (this.stats.averageProcessingTime * (this.stats.totalBatches - 1) +
        processingTime) /
      this.stats.totalBatches;

    // Calculate throughput (requests per second)
    if (this.stats.averageProcessingTime > 0) {
      this.stats.throughput =
        (this.stats.averageBatchSize / this.stats.averageProcessingTime) * 1000;
    }
  }

  /**
   * Get current queue sizes
   */
  getQueueSizes(): Record<string, number> {
    const sizes: Record<string, number> = {};
    for (const [modelId, queue] of this.queue.entries()) {
      sizes[modelId] = queue.length;
    }
    return sizes;
  }

  /**
   * Get batch statistics
   */
  getStats(): BatchStats {
    return { ...this.stats };
  }

  /**
   * Clear all queues (use with caution)
   */
  clearQueues(): void {
    for (const [modelId, queue] of this.queue.entries()) {
      for (const request of queue) {
        const callback = this.processingCallbacks.get(request.id);
        if (callback) {
          callback({
            requestId: request.id,
            output: null,
            processingTime: 0,
            tokensUsed: 0,
            error: "Queue cleared",
          });
          this.processingCallbacks.delete(request.id);
        }
      }
      queue.length = 0;
    }
  }

  /**
   * Get pending request count
   */
  getPendingCount(): number {
    let count = 0;
    for (const queue of this.queue.values()) {
      count += queue.length;
    }
    return count;
  }

  /**
   * Set maximum batch size
   */
  setMaxBatchSize(size: number): void {
    this.maxBatchSize = Math.max(1, size);
  }

  /**
   * Set maximum wait time
   */
  setMaxWaitTime(ms: number): void {
    this.maxWaitTimeMs = Math.max(10, ms);
  }
}

/**
 * Batch Job Manager - For long-running batch jobs
 */
export interface BatchJob {
  id: string;
  modelId: string;
  requests: BatchRequest[];
  status: "pending" | "processing" | "completed" | "failed";
  progress: number; // 0-100
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  results?: BatchResult[];
  error?: string;
}

export class BatchJobManager {
  private jobs: Map<string, BatchJob> = new Map();
  private batchProcessor: BatchProcessor;

  constructor(batchProcessor: BatchProcessor) {
    this.batchProcessor = batchProcessor;
  }

  /**
   * Create a new batch job
   */
  createJob(modelId: string, requests: BatchRequest[]): string {
    const jobId = this.generateJobId();

    const job: BatchJob = {
      id: jobId,
      modelId,
      requests,
      status: "pending",
      progress: 0,
      createdAt: new Date(),
    };

    this.jobs.set(jobId, job);
    this.processJob(jobId);

    return jobId;
  }

  /**
   * Process a batch job
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    job.status = "processing";
    job.startedAt = new Date();
    job.results = [];

    try {
      const total = job.requests.length;
      let completed = 0;

      for (const request of job.requests) {
        const result = await this.batchProcessor.addRequest(request);
        job.results.push(result);

        completed++;
        job.progress = Math.floor((completed / total) * 100);
      }

      job.status = "completed";
      job.completedAt = new Date();
      job.progress = 100;
    } catch (error) {
      job.status = "failed";
      job.error = error instanceof Error ? error.message : "Job processing failed";
      job.completedAt = new Date();
    }
  }

  /**
   * Get job status
   */
  getJob(jobId: string): BatchJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * List all jobs
   */
  listJobs(): BatchJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== "pending") return false;

    job.status = "failed";
    job.error = "Job cancelled";
    job.completedAt = new Date();

    return true;
  }

  /**
   * Delete a job
   */
  deleteJob(jobId: string): boolean {
    return this.jobs.delete(jobId);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
  }
}
