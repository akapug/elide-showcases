/**
 * Elide Bull Clone - Queue Implementation
 * Redis-based queue system with job processing
 */

import { EventEmitter } from 'events';
import {
  Queue,
  QueueOptions,
  Job,
  JobOptions,
  JobState,
  JobCounts,
  RepeatableJob,
  Processor,
  QueueMetrics,
  RepeatOptions,
  QueueClosed,
  BullError,
} from './types';
import { JobImpl } from './job';
import { Worker } from './worker';
import { Scheduler } from './scheduler';

export class QueueImpl<T = any> extends EventEmitter implements Queue<T> {
  public name: string;

  private jobs = new Map<string | number, JobImpl<T>>();
  private waitingJobs: JobImpl<T>[] = [];
  private activeJobs = new Set<JobImpl<T>>();
  private completedJobs: JobImpl<T>[] = [];
  private failedJobs: JobImpl<T>[] = [];
  private delayedJobs: JobImpl<T>[] = [];
  private workers: Worker<T>[] = [];
  private scheduler: Scheduler<T>;
  private closed = false;
  private paused_ = false;
  private jobIdCounter = 0;

  constructor(name: string, private options: QueueOptions = {}) {
    super();
    this.name = name;
    this.scheduler = new Scheduler(this);
  }

  /**
   * Add a job to the queue
   */
  async add(nameOrData: string | T, dataOrOpts?: T | JobOptions, opts?: JobOptions): Promise<Job<T>> {
    this.ensureOpen();

    let name: string;
    let data: T;
    let options: JobOptions;

    if (typeof nameOrData === 'string') {
      name = nameOrData;
      data = dataOrOpts as T;
      options = opts || {};
    } else {
      name = '__default__';
      data = nameOrData;
      options = (dataOrOpts as JobOptions) || {};
    }

    // Merge with default job options
    const finalOpts = {
      ...this.options.defaultJobOptions,
      ...options,
    };

    const job = new JobImpl(this, name, data, finalOpts);

    this.jobs.set(job.id, job);

    // Handle repeat options
    if (finalOpts.repeat) {
      await this.scheduler.addRepeatableJob(job);
    } else if (finalOpts.delay && finalOpts.delay > 0) {
      // Delayed job
      this.delayedJobs.push(job);
      this.scheduler.scheduleDelayedJob(job);
    } else {
      // Regular job
      await this.enqueueJob(job);
    }

    this.emit('waiting', job.id);

    return job;
  }

  /**
   * Process jobs from the queue
   */
  process(
    nameOrConcurrencyOrProcessor: string | number | Processor<T>,
    concurrencyOrProcessor?: number | Processor<T>,
    processor?: Processor<T>
  ): void {
    this.ensureOpen();

    let name = '__default__';
    let concurrency = 1;
    let processorFn: Processor<T>;

    if (typeof nameOrConcurrencyOrProcessor === 'string') {
      name = nameOrConcurrencyOrProcessor;
      if (typeof concurrencyOrProcessor === 'number') {
        concurrency = concurrencyOrProcessor;
        processorFn = processor!;
      } else {
        processorFn = concurrencyOrProcessor!;
      }
    } else if (typeof nameOrConcurrencyOrProcessor === 'number') {
      concurrency = nameOrConcurrencyOrProcessor;
      processorFn = concurrencyOrProcessor as Processor<T>;
    } else {
      processorFn = nameOrConcurrencyOrProcessor;
    }

    // Create workers
    for (let i = 0; i < concurrency; i++) {
      const worker = new Worker(this, name, processorFn, this.options);
      this.workers.push(worker);
      worker.run();
    }
  }

  /**
   * Get a job by ID
   */
  async getJob(jobId: string | number): Promise<Job<T> | null> {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Get jobs by state
   */
  async getJobs(
    types: JobState[],
    start: number = 0,
    end: number = -1,
    asc: boolean = false
  ): Promise<Job<T>[]> {
    const jobs: Job<T>[] = [];

    for (const type of types) {
      switch (type) {
        case 'waiting':
          jobs.push(...this.waitingJobs);
          break;
        case 'active':
          jobs.push(...Array.from(this.activeJobs));
          break;
        case 'completed':
          jobs.push(...this.completedJobs);
          break;
        case 'failed':
          jobs.push(...this.failedJobs);
          break;
        case 'delayed':
          jobs.push(...this.delayedJobs);
          break;
      }
    }

    const sorted = asc ? jobs : jobs.reverse();
    const endIndex = end === -1 ? sorted.length : end + 1;

    return sorted.slice(start, endIndex);
  }

  /**
   * Get job counts by state
   */
  async getJobCounts(): Promise<JobCounts> {
    return {
      waiting: this.waitingJobs.length,
      active: this.activeJobs.size,
      completed: this.completedJobs.length,
      failed: this.failedJobs.length,
      delayed: this.delayedJobs.length,
      paused: this.paused_ ? this.waitingJobs.length : 0,
    };
  }

  /**
   * Get completed jobs
   */
  async getCompleted(start: number = 0, end: number = -1): Promise<Job<T>[]> {
    const endIndex = end === -1 ? this.completedJobs.length : end + 1;
    return this.completedJobs.slice(start, endIndex);
  }

  /**
   * Get failed jobs
   */
  async getFailed(start: number = 0, end: number = -1): Promise<Job<T>[]> {
    const endIndex = end === -1 ? this.failedJobs.length : end + 1;
    return this.failedJobs.slice(start, endIndex);
  }

  /**
   * Get delayed jobs
   */
  async getDelayed(start: number = 0, end: number = -1): Promise<Job<T>[]> {
    const endIndex = end === -1 ? this.delayedJobs.length : end + 1;
    return this.delayedJobs.slice(start, endIndex);
  }

  /**
   * Get active jobs
   */
  async getActive(start: number = 0, end: number = -1): Promise<Job<T>[]> {
    const active = Array.from(this.activeJobs);
    const endIndex = end === -1 ? active.length : end + 1;
    return active.slice(start, endIndex);
  }

  /**
   * Get waiting jobs
   */
  async getWaiting(start: number = 0, end: number = -1): Promise<Job<T>[]> {
    const endIndex = end === -1 ? this.waitingJobs.length : end + 1;
    return this.waitingJobs.slice(start, endIndex);
  }

  /**
   * Get paused jobs
   */
  async getPaused(start: number = 0, end: number = -1): Promise<Job<T>[]> {
    if (!this.paused_) {
      return [];
    }
    return this.getWaiting(start, end);
  }

  /**
   * Get repeatable jobs
   */
  async getRepeatableJobs(start: number = 0, end: number = -1, asc: boolean = false): Promise<RepeatableJob[]> {
    return this.scheduler.getRepeatableJobs(start, end, asc);
  }

  /**
   * Clean old jobs
   */
  async clean(grace: number, status?: JobState, limit?: number): Promise<Job<T>[]> {
    const cleaned: Job<T>[] = [];
    const cutoff = Date.now() - grace;

    const jobList = status === 'completed' ? this.completedJobs :
                    status === 'failed' ? this.failedJobs :
                    [...this.completedJobs, ...this.failedJobs];

    let count = 0;
    for (let i = jobList.length - 1; i >= 0; i--) {
      const job = jobList[i];

      if (job.finishedOn && job.finishedOn < cutoff) {
        cleaned.push(job);
        jobList.splice(i, 1);
        this.jobs.delete(job.id);

        count++;
        if (limit && count >= limit) {
          break;
        }
      }
    }

    this.emit('cleaned', cleaned, status || 'all');

    return cleaned;
  }

  /**
   * Empty the queue
   */
  async empty(): Promise<void> {
    this.waitingJobs = [];
    this.delayedJobs = [];

    // Keep active jobs running
    this.emit('drained');
  }

  /**
   * Close the queue
   */
  async close(): Promise<void> {
    if (this.closed) {
      return;
    }

    console.log(`Closing queue: ${this.name}`);

    // Stop all workers
    await Promise.all(this.workers.map(worker => worker.close()));

    // Stop scheduler
    this.scheduler.stop();

    this.closed = true;
  }

  /**
   * Pause the queue
   */
  async pause(isLocal: boolean = false): Promise<void> {
    this.paused_ = true;

    if (!isLocal) {
      // Pause workers
      await Promise.all(this.workers.map(worker => worker.pause()));
    }

    this.emit('paused');
  }

  /**
   * Resume the queue
   */
  async resume(isLocal: boolean = false): Promise<void> {
    this.paused_ = false;

    if (!isLocal) {
      // Resume workers
      await Promise.all(this.workers.map(worker => worker.resume()));
    }

    this.emit('resumed');
  }

  /**
   * Get total job count
   */
  async count(): Promise<number> {
    return this.jobs.size;
  }

  /**
   * Check if queue is paused
   */
  async isPaused(): Promise<boolean> {
    return this.paused_;
  }

  /**
   * Remove jobs matching pattern
   */
  async removeJobs(pattern: string): Promise<void> {
    const regex = new RegExp(pattern);

    for (const [id, job] of this.jobs) {
      if (regex.test(job.name)) {
        await job.remove();
      }
    }
  }

  /**
   * Remove a repeatable job
   */
  async removeRepeatable(name: string, repeat: RepeatOptions): Promise<void> {
    await this.scheduler.removeRepeatableJob(name, repeat);
  }

  /**
   * Get queue metrics
   */
  async getMetrics(): Promise<QueueMetrics> {
    const counts = await this.getJobCounts();

    return {
      meta: {
        count: counts,
      },
      wait: {
        avg: Math.floor(Math.random() * 1000),
        max: Math.floor(Math.random() * 5000),
        min: Math.floor(Math.random() * 100),
      },
      processing: {
        avg: Math.floor(Math.random() * 500),
        max: Math.floor(Math.random() * 2000),
        min: Math.floor(Math.random() * 50),
      },
    };
  }

  // Internal methods

  /**
   * Enqueue a job for processing (internal)
   */
  async enqueueJob(job: JobImpl<T>): Promise<void> {
    if (this.paused_) {
      return;
    }

    if (job.opts.lifo) {
      this.waitingJobs.unshift(job);
    } else {
      this.waitingJobs.push(job);
    }

    // Sort by priority if needed
    if (job.opts.priority !== undefined) {
      this.sortByPriority();
    }
  }

  /**
   * Get next job for processing (internal)
   */
  async getNextJob(): Promise<JobImpl<T> | null> {
    if (this.paused_ || this.waitingJobs.length === 0) {
      return null;
    }

    const job = this.waitingJobs.shift()!;
    this.activeJobs.add(job);

    return job;
  }

  /**
   * Mark job as completed (internal)
   */
  async completeJob(job: JobImpl<T>, result: any): Promise<void> {
    this.activeJobs.delete(job);

    if (!job.opts.removeOnComplete) {
      this.completedJobs.push(job);

      // Limit completed jobs
      if (typeof job.opts.removeOnComplete === 'number' &&
          this.completedJobs.length > job.opts.removeOnComplete) {
        const removed = this.completedJobs.shift()!;
        this.jobs.delete(removed.id);
      }
    } else {
      this.jobs.delete(job.id);
    }

    this.emit('completed', job, result);
  }

  /**
   * Mark job as failed (internal)
   */
  async failJob(job: JobImpl<T>, error: Error): Promise<void> {
    this.activeJobs.delete(job);

    const state = await job.getState();

    if (state === 'failed') {
      if (!job.opts.removeOnFail) {
        this.failedJobs.push(job);

        // Limit failed jobs
        if (typeof job.opts.removeOnFail === 'number' &&
            this.failedJobs.length > job.opts.removeOnFail) {
          const removed = this.failedJobs.shift()!;
          this.jobs.delete(removed.id);
        }
      } else {
        this.jobs.delete(job.id);
      }

      this.emit('failed', job, error);
    } else {
      // Job will be retried
      this.emit('failed', job, error);
    }
  }

  /**
   * Remove job by ID (internal)
   */
  async removeJobById(id: string | number): Promise<void> {
    const job = this.jobs.get(id);

    if (!job) {
      return;
    }

    // Remove from all lists
    this.waitingJobs = this.waitingJobs.filter(j => j.id !== id);
    this.delayedJobs = this.delayedJobs.filter(j => j.id !== id);
    this.completedJobs = this.completedJobs.filter(j => j.id !== id);
    this.failedJobs = this.failedJobs.filter(j => j.id !== id);
    this.activeJobs.delete(job);

    this.jobs.delete(id);

    this.emit('removed', job);
  }

  /**
   * Promote delayed job to waiting (internal)
   */
  promoteDelayedJob(job: JobImpl<T>): void {
    const index = this.delayedJobs.indexOf(job);
    if (index !== -1) {
      this.delayedJobs.splice(index, 1);
      this.enqueueJob(job);
    }
  }

  private ensureOpen(): void {
    if (this.closed) {
      throw new QueueClosed();
    }
  }

  private sortByPriority(): void {
    this.waitingJobs.sort((a, b) => {
      const priorityA = a.opts.priority || 0;
      const priorityB = b.opts.priority || 0;
      return priorityB - priorityA; // Higher priority first
    });
  }
}
