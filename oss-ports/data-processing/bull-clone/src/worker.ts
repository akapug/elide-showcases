/**
 * Elide Bull Clone - Worker Implementation
 * Job processor worker
 */

import { Worker as IWorker, Processor, WorkerOptions, BullError } from './types';
import type { QueueImpl } from './queue';
import type { JobImpl } from './job';

export class Worker<T = any> implements IWorker<T> {
  private stopped = false;
  private paused_ = false;
  private processing = 0;
  private processingJobs = new Set<JobImpl<T>>();

  constructor(
    private queue: QueueImpl<T>,
    private jobName: string,
    private processor: Processor<T>,
    private options: WorkerOptions = {}
  ) {}

  /**
   * Start processing jobs
   */
  async run(): Promise<void> {
    if (this.stopped) {
      throw new BullError('Worker is stopped');
    }

    // Process jobs in a loop
    this.processLoop();
  }

  /**
   * Pause the worker
   */
  async pause(): Promise<void> {
    this.paused_ = true;
  }

  /**
   * Resume the worker
   */
  async resume(): Promise<void> {
    this.paused_ = false;

    // Restart processing loop
    setImmediate(() => this.processLoop());
  }

  /**
   * Close the worker
   */
  async close(): Promise<void> {
    this.stopped = true;

    // Wait for active jobs to complete
    while (this.processingJobs.size > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  /**
   * Check if worker is stopped
   */
  isStopped(): boolean {
    return this.stopped;
  }

  /**
   * Check if worker is paused
   */
  isPaused(): boolean {
    return this.paused_;
  }

  // Internal methods

  private async processLoop(): Promise<void> {
    while (!this.stopped && !this.paused_) {
      const concurrency = this.options.concurrency || 1;

      if (this.processing >= concurrency) {
        // Wait for a job to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      const job = await this.queue.getNextJob();

      if (!job) {
        // No jobs available, wait
        await new Promise(resolve => setTimeout(resolve, 100));
        continue;
      }

      // Check if job matches this worker's name
      if (this.jobName !== '__default__' && job.name !== this.jobName) {
        // Put it back
        await this.queue.enqueueJob(job);
        await new Promise(resolve => setTimeout(resolve, 10));
        continue;
      }

      // Process the job
      this.processJob(job);
    }
  }

  private async processJob(job: JobImpl<T>): Promise<void> {
    this.processing++;
    this.processingJobs.add(job);

    try {
      // Take lock
      const lockToken = await job.takeLock();

      job.setState('active');

      // Emit active event
      const jobPromise = this.executeJob(job);
      this.queue.emit('active', job, jobPromise);

      // Execute processor
      const result = await jobPromise;

      // Complete job
      await job.moveToCompleted(result, false);
      await job.releaseLock(lockToken);

      await this.queue.completeJob(job, result);
    } catch (error) {
      // Handle job failure
      await this.handleJobFailure(job, error as Error);
    } finally {
      this.processing--;
      this.processingJobs.delete(job);
    }
  }

  private async executeJob(job: JobImpl<T>): Promise<any> {
    const timeout = job.opts.timeout;

    if (timeout) {
      return Promise.race([
        this.processor(job),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Job timeout')), timeout)
        ),
      ]);
    }

    return this.processor(job);
  }

  private async handleJobFailure(job: JobImpl<T>, error: Error): Promise<void> {
    try {
      await job.moveToFailed({ message: error.message }, true);

      // Add to stacktrace
      if (error.stack) {
        job.stacktrace.push(error.stack);
      }

      await this.queue.failJob(job, error);
    } catch (failError) {
      console.error('Error handling job failure:', failError);
    }
  }
}
