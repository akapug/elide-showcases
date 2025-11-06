/**
 * Pipeline Scheduler
 *
 * Cron-based scheduling for ETL pipelines using elide-examples/cron-parser.
 */

import { EventEmitter } from 'events';
import { ETLPipeline, PipelineConfig, PipelineResult } from './pipeline';

// Cron parser interface (from elide-examples/cron-parser)
interface CronExpression {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

/**
 * Parse a cron expression into components
 */
function parseCronExpression(expression: string): CronExpression {
  const parts = expression.trim().split(/\s+/);

  if (parts.length < 5) {
    throw new Error(`Invalid cron expression: ${expression}`);
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4]
  };
}

/**
 * Check if a cron expression matches the current time
 */
function matchesCronExpression(expr: CronExpression, date: Date): boolean {
  const minute = date.getMinutes();
  const hour = date.getHours();
  const dayOfMonth = date.getDate();
  const month = date.getMonth() + 1; // 0-indexed
  const dayOfWeek = date.getDay(); // 0 = Sunday

  return (
    matchesCronField(expr.minute, minute, 0, 59) &&
    matchesCronField(expr.hour, hour, 0, 23) &&
    matchesCronField(expr.dayOfMonth, dayOfMonth, 1, 31) &&
    matchesCronField(expr.month, month, 1, 12) &&
    matchesCronField(expr.dayOfWeek, dayOfWeek, 0, 6)
  );
}

/**
 * Check if a cron field matches a value
 */
function matchesCronField(field: string, value: number, min: number, max: number): boolean {
  // Wildcard
  if (field === '*') {
    return true;
  }

  // Specific value
  if (/^\d+$/.test(field)) {
    return parseInt(field, 10) === value;
  }

  // Range (e.g., "1-5")
  if (field.includes('-')) {
    const [start, end] = field.split('-').map(v => parseInt(v, 10));
    return value >= start && value <= end;
  }

  // Step values (e.g., "*/5")
  if (field.includes('/')) {
    const [range, step] = field.split('/');
    const stepValue = parseInt(step, 10);

    if (range === '*') {
      return value % stepValue === 0;
    }

    if (range.includes('-')) {
      const [start, end] = range.split('-').map(v => parseInt(v, 10));
      return value >= start && value <= end && (value - start) % stepValue === 0;
    }
  }

  // List (e.g., "1,3,5")
  if (field.includes(',')) {
    const values = field.split(',').map(v => parseInt(v, 10));
    return values.includes(value);
  }

  return false;
}

/**
 * Calculate next execution time for a cron expression
 */
function getNextExecution(expr: CronExpression, from: Date = new Date()): Date {
  const next = new Date(from);
  next.setSeconds(0);
  next.setMilliseconds(0);

  // Try each minute for the next 4 years (arbitrary limit)
  const maxIterations = 4 * 365 * 24 * 60;

  for (let i = 0; i < maxIterations; i++) {
    next.setMinutes(next.getMinutes() + 1);

    if (matchesCronExpression(expr, next)) {
      return next;
    }
  }

  throw new Error('Could not calculate next execution time');
}

// Schedule configuration
export interface ScheduleConfig {
  name: string;
  cron: string;
  pipeline: PipelineConfig;
  enabled?: boolean;
  timezone?: string;
  maxConcurrentRuns?: number;
  catchUpMissedRuns?: boolean;
}

// Scheduled job
export interface ScheduledJob {
  id: string;
  config: ScheduleConfig;
  cronExpression: CronExpression;
  nextExecution: Date;
  lastExecution?: Date;
  lastResult?: PipelineResult;
  isRunning: boolean;
  runCount: number;
  errorCount: number;
}

/**
 * Pipeline Scheduler
 */
export class PipelineScheduler extends EventEmitter {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timerId?: NodeJS.Timeout;
  private isStarted: boolean = false;
  private checkIntervalMs: number = 60000; // Check every minute

  constructor(checkIntervalMs: number = 60000) {
    super();
    this.checkIntervalMs = checkIntervalMs;
  }

  /**
   * Add a scheduled job
   */
  addJob(config: ScheduleConfig): string {
    const id = this.generateJobId(config.name);

    try {
      const cronExpression = parseCronExpression(config.cron);
      const nextExecution = getNextExecution(cronExpression);

      const job: ScheduledJob = {
        id,
        config,
        cronExpression,
        nextExecution,
        isRunning: false,
        runCount: 0,
        errorCount: 0
      };

      this.jobs.set(id, job);
      this.emit('job:added', job);

      console.log(`Job ${id} scheduled for ${nextExecution.toISOString()}`);

      return id;
    } catch (error) {
      throw new Error(`Failed to add job: ${error}`);
    }
  }

  /**
   * Remove a scheduled job
   */
  removeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);

    if (!job) {
      return false;
    }

    if (job.isRunning) {
      throw new Error(`Cannot remove job ${jobId}: job is currently running`);
    }

    this.jobs.delete(jobId);
    this.emit('job:removed', job);

    console.log(`Job ${jobId} removed`);

    return true;
  }

  /**
   * Get a scheduled job
   */
  getJob(jobId: string): ScheduledJob | undefined {
    return this.jobs.get(jobId);
  }

  /**
   * Get all scheduled jobs
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.isStarted) {
      console.warn('Scheduler already started');
      return;
    }

    this.isStarted = true;
    this.emit('scheduler:start');

    console.log(`Scheduler started (check interval: ${this.checkIntervalMs}ms)`);

    // Run initial check
    this.checkSchedules();

    // Setup periodic check
    this.timerId = setInterval(() => {
      this.checkSchedules();
    }, this.checkIntervalMs);
  }

  /**
   * Stop the scheduler
   */
  async stop(): Promise<void> {
    if (!this.isStarted) {
      return;
    }

    console.log('Stopping scheduler...');

    if (this.timerId) {
      clearInterval(this.timerId);
      this.timerId = undefined;
    }

    // Wait for running jobs to complete
    const runningJobs = Array.from(this.jobs.values()).filter(j => j.isRunning);

    if (runningJobs.length > 0) {
      console.log(`Waiting for ${runningJobs.length} running jobs to complete...`);

      const timeout = 60000; // 1 minute timeout
      const startTime = Date.now();

      while (
        runningJobs.some(j => j.isRunning) &&
        (Date.now() - startTime) < timeout
      ) {
        await this.sleep(1000);
      }
    }

    this.isStarted = false;
    this.emit('scheduler:stop');

    console.log('Scheduler stopped');
  }

  /**
   * Check schedules and execute due jobs
   */
  private async checkSchedules(): Promise<void> {
    const now = new Date();
    const dueJobs: ScheduledJob[] = [];

    // Find due jobs
    for (const job of this.jobs.values()) {
      if (job.config.enabled === false) {
        continue;
      }

      if (job.isRunning) {
        const maxConcurrent = job.config.maxConcurrentRuns || 1;
        if (maxConcurrent <= 1) {
          continue; // Skip if already running and max concurrent is 1
        }
      }

      if (now >= job.nextExecution) {
        dueJobs.push(job);
      }
    }

    // Execute due jobs
    for (const job of dueJobs) {
      this.executeJob(job).catch(error => {
        console.error(`Error executing job ${job.id}:`, error);
      });
    }
  }

  /**
   * Execute a scheduled job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    try {
      job.isRunning = true;
      job.runCount++;

      this.emit('job:start', job);
      console.log(`Executing job ${job.id} (run #${job.runCount})`);

      // Create and execute pipeline
      const pipeline = new ETLPipeline(job.config.pipeline);

      // Forward pipeline events
      pipeline.on('pipeline:start', (context) => {
        this.emit('job:pipeline:start', job, context);
      });

      pipeline.on('pipeline:complete', (result) => {
        this.emit('job:pipeline:complete', job, result);
      });

      pipeline.on('pipeline:error', (error, context) => {
        this.emit('job:pipeline:error', job, error, context);
      });

      // Execute pipeline
      const result = await pipeline.execute();

      // Update job state
      job.lastExecution = new Date();
      job.lastResult = result;

      if (!result.success) {
        job.errorCount++;
        this.emit('job:error', job, result.error);
      } else {
        this.emit('job:complete', job, result);
      }

      // Calculate next execution
      job.nextExecution = getNextExecution(job.cronExpression, new Date());

      console.log(`Job ${job.id} completed. Next execution: ${job.nextExecution.toISOString()}`);

    } catch (error) {
      job.errorCount++;
      this.emit('job:error', job, error);
      console.error(`Job ${job.id} failed:`, error);

      // Still calculate next execution even on error
      try {
        job.nextExecution = getNextExecution(job.cronExpression, new Date());
      } catch (e) {
        console.error(`Failed to calculate next execution for job ${job.id}:`, e);
      }
    } finally {
      job.isRunning = false;
    }
  }

  /**
   * Manually trigger a job
   */
  async triggerJob(jobId: string): Promise<PipelineResult> {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    const maxConcurrent = job.config.maxConcurrentRuns || 1;

    if (job.isRunning && maxConcurrent <= 1) {
      throw new Error(`Job ${jobId} is already running`);
    }

    console.log(`Manually triggering job ${jobId}`);

    const pipeline = new ETLPipeline(job.config.pipeline);
    const result = await pipeline.execute();

    job.lastExecution = new Date();
    job.lastResult = result;
    job.runCount++;

    if (!result.success) {
      job.errorCount++;
    }

    return result;
  }

  /**
   * Enable a job
   */
  enableJob(jobId: string): void {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.config.enabled = true;
    this.emit('job:enabled', job);

    console.log(`Job ${jobId} enabled`);
  }

  /**
   * Disable a job
   */
  disableJob(jobId: string): void {
    const job = this.jobs.get(jobId);

    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }

    job.config.enabled = false;
    this.emit('job:disabled', job);

    console.log(`Job ${jobId} disabled`);
  }

  /**
   * Get scheduler status
   */
  getStatus(): {
    isStarted: boolean;
    totalJobs: number;
    enabledJobs: number;
    runningJobs: number;
    nextExecution?: Date;
  } {
    const jobs = Array.from(this.jobs.values());
    const enabledJobs = jobs.filter(j => j.config.enabled !== false);
    const runningJobs = jobs.filter(j => j.isRunning);

    const nextExecutions = enabledJobs
      .filter(j => !j.isRunning)
      .map(j => j.nextExecution)
      .sort((a, b) => a.getTime() - b.getTime());

    return {
      isStarted: this.isStarted,
      totalJobs: jobs.length,
      enabledJobs: enabledJobs.length,
      runningJobs: runningJobs.length,
      nextExecution: nextExecutions[0]
    };
  }

  /**
   * Generate a unique job ID
   */
  private generateJobId(name: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 9);
    const safeName = name.replace(/[^a-zA-Z0-9]/g, '-');
    return `${safeName}-${timestamp}-${random}`;
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
