/**
 * Elide Bull Clone - Job Implementation
 * Job class for queue system
 */

import { Job, JobOptions, JobState, JobJSON, BullError } from './types';
import type { Queue } from './queue';

export class JobImpl<T = any> implements Job<T> {
  public id: string | number;
  public name: string;
  public data: T;
  public opts: JobOptions;
  public progress_: number | object = 0;
  public delay: number;
  public timestamp: number;
  public attemptsMade = 0;
  public failedReason?: string;
  public stacktrace: string[] = [];
  public returnvalue: any;
  public finishedOn?: number;
  public processedOn?: number;
  public logs: string[] = [];

  private state_: JobState = 'waiting';
  private lockToken?: string;

  constructor(
    public queue: Queue<T>,
    name: string,
    data: T,
    opts: JobOptions = {}
  ) {
    this.id = opts.jobId || this.generateJobId();
    this.name = name;
    this.data = data;
    this.opts = opts;
    this.delay = opts.delay || 0;
    this.timestamp = Date.now();

    if (this.delay > 0) {
      this.state_ = 'delayed';
    }
  }

  /**
   * Update job data
   */
  async update(data: Partial<T>): Promise<void> {
    this.data = { ...this.data, ...data };
    await this.save();
  }

  /**
   * Remove job from queue
   */
  async remove(): Promise<void> {
    console.log(`Removing job ${this.id}`);
    await this.queue.removeJobById(this.id);
  }

  /**
   * Retry a failed job
   */
  async retry(): Promise<void> {
    if (this.state_ !== 'failed') {
      throw new BullError('Only failed jobs can be retried');
    }

    this.attemptsMade = 0;
    this.failedReason = undefined;
    this.stacktrace = [];
    this.state_ = 'waiting';

    await this.save();
    await this.queue.enqueueJob(this);
  }

  /**
   * Discard a job (don't retry)
   */
  async discard(): Promise<void> {
    this.opts.attempts = 0;
    await this.moveToFailed({ message: 'Job discarded' });
  }

  /**
   * Promote a delayed job to waiting
   */
  async promote(): Promise<void> {
    if (this.state_ !== 'delayed') {
      throw new BullError('Only delayed jobs can be promoted');
    }

    this.delay = 0;
    this.state_ = 'waiting';

    await this.save();
    await this.queue.enqueueJob(this);
  }

  /**
   * Wait for job to finish
   */
  async finished(): Promise<any> {
    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        const state = await this.getState();

        if (state === 'completed') {
          clearInterval(checkInterval);
          resolve(this.returnvalue);
        } else if (state === 'failed') {
          clearInterval(checkInterval);
          reject(new Error(this.failedReason || 'Job failed'));
        }
      }, 100);
    });
  }

  /**
   * Move job to completed state
   */
  async moveToCompleted(returnValue?: any, ignoreLock: boolean = false): Promise<void> {
    if (!ignoreLock && !this.lockToken) {
      throw new BullError('Job must be locked before completing');
    }

    this.returnvalue = returnValue;
    this.finishedOn = Date.now();
    this.state_ = 'completed';

    await this.save();

    // Remove if configured
    if (this.opts.removeOnComplete) {
      await this.remove();
    }
  }

  /**
   * Move job to failed state
   */
  async moveToFailed(errorInfo: { message: string }, ignoreLock: boolean = false): Promise<void> {
    if (!ignoreLock && !this.lockToken) {
      throw new BullError('Job must be locked before failing');
    }

    this.failedReason = errorInfo.message;
    this.finishedOn = Date.now();
    this.attemptsMade++;

    const maxAttempts = this.opts.attempts || 1;

    if (this.attemptsMade < maxAttempts) {
      // Retry
      this.state_ = 'waiting';

      // Calculate backoff delay
      const backoffDelay = this.calculateBackoff();
      if (backoffDelay > 0) {
        this.delay = backoffDelay;
        this.state_ = 'delayed';
      }

      await this.save();
      await this.queue.enqueueJob(this);
    } else {
      // Final failure
      this.state_ = 'failed';

      await this.save();

      // Remove if configured
      if (this.opts.removeOnFail) {
        await this.remove();
      }
    }
  }

  /**
   * Check if job is completed
   */
  async isCompleted(): Promise<boolean> {
    return this.state_ === 'completed';
  }

  /**
   * Check if job is failed
   */
  async isFailed(): Promise<boolean> {
    return this.state_ === 'failed';
  }

  /**
   * Check if job is delayed
   */
  async isDelayed(): Promise<boolean> {
    return this.state_ === 'delayed';
  }

  /**
   * Check if job is active
   */
  async isActive(): Promise<boolean> {
    return this.state_ === 'active';
  }

  /**
   * Check if job is waiting
   */
  async isWaiting(): Promise<boolean> {
    return this.state_ === 'waiting';
  }

  /**
   * Check if job is paused
   */
  async isPaused(): Promise<boolean> {
    return this.state_ === 'paused';
  }

  /**
   * Get job state
   */
  async getState(): Promise<JobState> {
    return this.state_;
  }

  /**
   * Take a lock on the job
   */
  async takeLock(): Promise<string> {
    const token = this.generateLockToken();
    this.lockToken = token;
    this.state_ = 'active';
    this.processedOn = Date.now();

    await this.save();

    return token;
  }

  /**
   * Release the lock
   */
  async releaseLock(token: string): Promise<void> {
    if (this.lockToken !== token) {
      throw new BullError('Invalid lock token');
    }

    this.lockToken = undefined;

    await this.save();
  }

  /**
   * Update job progress
   */
  async progress(progress: number | object): Promise<void> {
    this.progress_ = progress;
    await this.save();
    this.queue.emit('progress', this, progress);
  }

  /**
   * Get progress
   */
  get progress(): number | object {
    return this.progress_;
  }

  /**
   * Set progress
   */
  set progress(value: number | object) {
    this.progress_ = value;
  }

  /**
   * Add a log entry
   */
  async log(message: string): Promise<void> {
    this.logs.push(message);
    await this.save();
  }

  /**
   * Convert job to JSON
   */
  toJSON(): JobJSON {
    return {
      id: this.id,
      name: this.name,
      data: this.data,
      opts: this.opts,
      progress: this.progress_,
      delay: this.delay,
      timestamp: this.timestamp,
      attemptsMade: this.attemptsMade,
      failedReason: this.failedReason,
      stacktrace: this.stacktrace,
      returnvalue: this.returnvalue,
      finishedOn: this.finishedOn,
      processedOn: this.processedOn,
    };
  }

  // Internal methods

  private async save(): Promise<void> {
    // Simulate saving to Redis
    await new Promise(resolve => setTimeout(resolve, 1));
  }

  private generateJobId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateLockToken(): string {
    return `lock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private calculateBackoff(): number {
    const backoff = this.opts.backoff;

    if (!backoff) {
      return 0;
    }

    if (backoff.type === 'fixed') {
      return backoff.delay || 0;
    }

    if (backoff.type === 'exponential') {
      const delay = backoff.delay || 1000;
      return delay * Math.pow(2, this.attemptsMade - 1);
    }

    return 0;
  }

  /**
   * Set job state (internal use)
   */
  setState(state: JobState): void {
    this.state_ = state;
  }

  /**
   * Get lock token (internal use)
   */
  getLockToken(): string | undefined {
    return this.lockToken;
  }
}
