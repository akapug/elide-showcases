/**
 * Batch Image Processing System
 *
 * High-performance batch processing system for computer vision tasks with
 * parallel processing, job queuing, and progress tracking.
 *
 * Features:
 * - Parallel batch processing
 * - Job queue management
 * - Progress tracking
 * - Error handling and retry
 * - Resource management
 * - Task scheduling
 * - Result aggregation
 * - Memory optimization
 */

import { EventEmitter } from 'events';
import { readdir, stat } from 'fs/promises';
import { join, extname } from 'path';
import { cpus } from 'os';

/**
 * Processing task
 */
interface ProcessingTask {
  id: string;
  inputPath: string;
  outputPath?: string;
  operation: ProcessingOperation;
  priority: number;
  retries: number;
  metadata?: Record<string, any>;
}

/**
 * Processing operation type
 */
type ProcessingOperation =
  | 'object-detection'
  | 'face-recognition'
  | 'ocr'
  | 'segmentation'
  | 'classification'
  | 'custom';

/**
 * Task result
 */
interface TaskResult {
  taskId: string;
  success: boolean;
  result?: any;
  error?: Error;
  processingTime: number;
  retryCount: number;
}

/**
 * Batch configuration
 */
interface BatchConfig {
  maxConcurrent: number;
  maxRetries: number;
  retryDelay: number;
  timeoutPerTask: number;
  enableGPU: boolean;
  batchSize: number;
}

/**
 * Batch statistics
 */
interface BatchStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  inProgressTasks: number;
  averageProcessingTime: number;
  throughput: number;
  startTime: number;
  endTime?: number;
}

/**
 * Job queue item
 */
interface QueueItem {
  task: ProcessingTask;
  addedAt: number;
  startedAt?: number;
}

/**
 * Worker status
 */
interface WorkerStatus {
  id: number;
  busy: boolean;
  currentTask?: string;
  tasksCompleted: number;
}

/**
 * Batch processor for parallel image processing
 */
export class BatchProcessor extends EventEmitter {
  private config: BatchConfig;
  private queue: QueueItem[];
  private workers: WorkerStatus[];
  private results: Map<string, TaskResult>;
  private stats: BatchStats;
  private isProcessing: boolean;

  constructor(config: Partial<BatchConfig> = {}) {
    super();

    const numWorkers = cpus().length;

    this.config = {
      maxConcurrent: numWorkers,
      maxRetries: 3,
      retryDelay: 1000,
      timeoutPerTask: 30000,
      enableGPU: true,
      batchSize: 32,
      ...config
    };

    this.queue = [];
    this.workers = Array(this.config.maxConcurrent).fill(null).map((_, i) => ({
      id: i,
      busy: false,
      tasksCompleted: 0
    }));

    this.results = new Map();
    this.stats = this.initializeStats();
    this.isProcessing = false;
  }

  /**
   * Initialize statistics
   */
  private initializeStats(): BatchStats {
    return {
      totalTasks: 0,
      completedTasks: 0,
      failedTasks: 0,
      inProgressTasks: 0,
      averageProcessingTime: 0,
      throughput: 0,
      startTime: Date.now()
    };
  }

  /**
   * Add task to queue
   */
  addTask(task: ProcessingTask): void {
    this.queue.push({
      task,
      addedAt: Date.now()
    });

    this.stats.totalTasks++;

    this.emit('task-added', task);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Add multiple tasks
   */
  addTasks(tasks: ProcessingTask[]): void {
    for (const task of tasks) {
      this.addTask(task);
    }
  }

  /**
   * Scan directory and create tasks
   */
  async scanDirectory(
    directory: string,
    operation: ProcessingOperation,
    outputDir?: string
  ): Promise<void> {
    const files = await this.findImageFiles(directory);

    for (const file of files) {
      const task: ProcessingTask = {
        id: this.generateTaskId(),
        inputPath: file,
        outputPath: outputDir ? join(outputDir, file.split('/').pop()!) : undefined,
        operation,
        priority: 0,
        retries: 0
      };

      this.addTask(task);
    }

    console.log(`Added ${files.length} tasks from directory: ${directory}`);
  }

  /**
   * Find image files in directory
   */
  private async findImageFiles(directory: string): Promise<string[]> {
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.webp'];
    const files: string[] = [];

    const entries = await readdir(directory, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = join(directory, entry.name);

      if (entry.isDirectory()) {
        // Recursively scan subdirectories
        const subFiles = await this.findImageFiles(fullPath);
        files.push(...subFiles);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (imageExtensions.includes(ext)) {
          files.push(fullPath);
        }
      }
    }

    return files;
  }

  /**
   * Start batch processing
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) return;

    this.isProcessing = true;
    this.stats.startTime = Date.now();

    this.emit('processing-started');

    // Process queue
    await this.processQueue();

    this.isProcessing = false;
    this.stats.endTime = Date.now();

    this.emit('processing-completed', this.getSummary());
  }

  /**
   * Process task queue
   */
  private async processQueue(): Promise<void> {
    while (this.queue.length > 0 || this.stats.inProgressTasks > 0) {
      // Find available workers
      const availableWorker = this.workers.find(w => !w.busy);

      if (availableWorker && this.queue.length > 0) {
        // Get next task (priority queue)
        const queueItem = this.dequeueTask();

        if (queueItem) {
          // Assign task to worker
          this.assignTaskToWorker(availableWorker, queueItem);
        }
      } else {
        // Wait a bit before checking again
        await this.sleep(100);
      }

      // Update throughput
      this.updateThroughput();
    }
  }

  /**
   * Dequeue next task (priority-based)
   */
  private dequeueTask(): QueueItem | null {
    if (this.queue.length === 0) return null;

    // Sort by priority (higher first), then by added time (earlier first)
    this.queue.sort((a, b) => {
      if (a.task.priority !== b.task.priority) {
        return b.task.priority - a.task.priority;
      }
      return a.addedAt - b.addedAt;
    });

    return this.queue.shift()!;
  }

  /**
   * Assign task to worker
   */
  private async assignTaskToWorker(
    worker: WorkerStatus,
    queueItem: QueueItem
  ): Promise<void> {
    worker.busy = true;
    worker.currentTask = queueItem.task.id;
    queueItem.startedAt = Date.now();
    this.stats.inProgressTasks++;

    this.emit('task-started', queueItem.task);

    // Process task
    try {
      const result = await this.processTask(queueItem.task);

      // Store result
      this.results.set(queueItem.task.id, result);

      if (result.success) {
        this.stats.completedTasks++;
        this.emit('task-completed', result);
      } else {
        // Retry if needed
        if (queueItem.task.retries < this.config.maxRetries) {
          await this.retryTask(queueItem.task);
        } else {
          this.stats.failedTasks++;
          this.emit('task-failed', result);
        }
      }
    } catch (error) {
      this.stats.failedTasks++;
      this.emit('task-error', { taskId: queueItem.task.id, error });
    } finally {
      // Release worker
      worker.busy = false;
      worker.currentTask = undefined;
      worker.tasksCompleted++;
      this.stats.inProgressTasks--;

      // Update average processing time
      if (queueItem.startedAt) {
        const processingTime = Date.now() - queueItem.startedAt;
        this.updateAverageProcessingTime(processingTime);
      }
    }
  }

  /**
   * Process single task
   */
  private async processTask(task: ProcessingTask): Promise<TaskResult> {
    const startTime = Date.now();

    try {
      // Set timeout
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(
          () => reject(new Error('Task timeout')),
          this.config.timeoutPerTask
        );
      });

      // Process with timeout
      const resultPromise = this.executeOperation(task);
      const result = await Promise.race([resultPromise, timeoutPromise]);

      const processingTime = Date.now() - startTime;

      return {
        taskId: task.id,
        success: true,
        result,
        processingTime,
        retryCount: task.retries
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;

      return {
        taskId: task.id,
        success: false,
        error: error as Error,
        processingTime,
        retryCount: task.retries
      };
    }
  }

  /**
   * Execute processing operation
   */
  private async executeOperation(task: ProcessingTask): Promise<any> {
    // Load image
    const imageData = await this.loadImage(task.inputPath);

    // Execute operation based on type
    switch (task.operation) {
      case 'object-detection':
        return await this.runObjectDetection(imageData);

      case 'face-recognition':
        return await this.runFaceRecognition(imageData);

      case 'ocr':
        return await this.runOCR(imageData);

      case 'segmentation':
        return await this.runSegmentation(imageData);

      case 'classification':
        return await this.runClassification(imageData);

      case 'custom':
        return await this.runCustomOperation(imageData, task.metadata);

      default:
        throw new Error(`Unknown operation: ${task.operation}`);
    }
  }

  /**
   * Load image
   */
  private async loadImage(path: string): Promise<Buffer> {
    const fs = await import('fs/promises');
    return await fs.readFile(path);
  }

  /**
   * Run object detection
   */
  private async runObjectDetection(imageData: Buffer): Promise<any> {
    // Mock object detection
    // In real implementation, would call YOLO detector
    await this.sleep(Math.random() * 100 + 50);

    return {
      objects: [
        { class: 'person', confidence: 0.95, bbox: [100, 150, 80, 200] },
        { class: 'car', confidence: 0.92, bbox: [500, 300, 150, 100] }
      ]
    };
  }

  /**
   * Run face recognition
   */
  private async runFaceRecognition(imageData: Buffer): Promise<any> {
    // Mock face recognition
    await this.sleep(Math.random() * 100 + 50);

    return {
      faces: [
        { identity: 'john_doe', confidence: 0.97, bbox: [200, 150, 100, 120] }
      ]
    };
  }

  /**
   * Run OCR
   */
  private async runOCR(imageData: Buffer): Promise<any> {
    // Mock OCR
    await this.sleep(Math.random() * 150 + 100);

    return {
      text: 'Sample extracted text from document',
      confidence: 0.89
    };
  }

  /**
   * Run segmentation
   */
  private async runSegmentation(imageData: Buffer): Promise<any> {
    // Mock segmentation
    await this.sleep(Math.random() * 200 + 150);

    return {
      segmentation: 'mask_data',
      classes: ['person', 'car', 'road']
    };
  }

  /**
   * Run classification
   */
  private async runClassification(imageData: Buffer): Promise<any> {
    // Mock classification
    await this.sleep(Math.random() * 50 + 25);

    return {
      class: 'dog',
      confidence: 0.93,
      top5: [
        { class: 'dog', confidence: 0.93 },
        { class: 'cat', confidence: 0.05 },
        { class: 'wolf', confidence: 0.01 }
      ]
    };
  }

  /**
   * Run custom operation
   */
  private async runCustomOperation(
    imageData: Buffer,
    metadata?: Record<string, any>
  ): Promise<any> {
    // Custom operation implementation
    await this.sleep(Math.random() * 100 + 50);

    return {
      result: 'custom_result',
      metadata
    };
  }

  /**
   * Retry failed task
   */
  private async retryTask(task: ProcessingTask): Promise<void> {
    await this.sleep(this.config.retryDelay);

    task.retries++;
    this.addTask(task);

    this.emit('task-retry', task);
  }

  /**
   * Update average processing time
   */
  private updateAverageProcessingTime(newTime: number): void {
    const totalCompleted = this.stats.completedTasks + this.stats.failedTasks;

    if (totalCompleted === 0) {
      this.stats.averageProcessingTime = newTime;
    } else {
      const alpha = 1 / (totalCompleted + 1);
      this.stats.averageProcessingTime =
        alpha * newTime + (1 - alpha) * this.stats.averageProcessingTime;
    }
  }

  /**
   * Update throughput
   */
  private updateThroughput(): void {
    const elapsedTime = (Date.now() - this.stats.startTime) / 1000; // seconds

    if (elapsedTime > 0) {
      this.stats.throughput = this.stats.completedTasks / elapsedTime;
    }
  }

  /**
   * Get processing progress
   */
  getProgress(): number {
    if (this.stats.totalTasks === 0) return 0;

    return (this.stats.completedTasks + this.stats.failedTasks) / this.stats.totalTasks;
  }

  /**
   * Get processing summary
   */
  getSummary(): ProcessingSummary {
    const totalProcessed = this.stats.completedTasks + this.stats.failedTasks;
    const successRate = totalProcessed > 0
      ? this.stats.completedTasks / totalProcessed
      : 0;

    const elapsedTime = this.stats.endTime
      ? this.stats.endTime - this.stats.startTime
      : Date.now() - this.stats.startTime;

    return {
      stats: { ...this.stats },
      progress: this.getProgress(),
      successRate,
      elapsedTime,
      estimatedTimeRemaining: this.estimateTimeRemaining(),
      workers: this.workers.map(w => ({ ...w }))
    };
  }

  /**
   * Estimate time remaining
   */
  private estimateTimeRemaining(): number {
    if (this.stats.averageProcessingTime === 0 || this.stats.inProgressTasks === 0) {
      return 0;
    }

    const remainingTasks = this.queue.length;
    const tasksPerWorker = Math.ceil(remainingTasks / this.config.maxConcurrent);

    return tasksPerWorker * this.stats.averageProcessingTime;
  }

  /**
   * Get task result
   */
  getResult(taskId: string): TaskResult | undefined {
    return this.results.get(taskId);
  }

  /**
   * Get all results
   */
  getAllResults(): TaskResult[] {
    return Array.from(this.results.values());
  }

  /**
   * Get failed tasks
   */
  getFailedTasks(): TaskResult[] {
    return Array.from(this.results.values()).filter(r => !r.success);
  }

  /**
   * Clear results
   */
  clearResults(): void {
    this.results.clear();
  }

  /**
   * Pause processing
   */
  pause(): void {
    this.isProcessing = false;
    this.emit('processing-paused');
  }

  /**
   * Resume processing
   */
  resume(): void {
    if (!this.isProcessing && this.queue.length > 0) {
      this.startProcessing();
      this.emit('processing-resumed');
    }
  }

  /**
   * Cancel all pending tasks
   */
  cancel(): void {
    this.queue = [];
    this.emit('processing-cancelled');
  }

  /**
   * Generate unique task ID
   */
  private generateTaskId(): string {
    return `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Processing summary
 */
interface ProcessingSummary {
  stats: BatchStats;
  progress: number;
  successRate: number;
  elapsedTime: number;
  estimatedTimeRemaining: number;
  workers: WorkerStatus[];
}

export {
  ProcessingTask,
  ProcessingOperation,
  TaskResult,
  BatchConfig,
  BatchStats,
  ProcessingSummary,
  WorkerStatus
};
