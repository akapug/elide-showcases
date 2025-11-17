/**
 * Elide Bull Clone - Scheduler Implementation
 * Job scheduling for delayed and repeatable jobs
 */

import { RepeatOptions, RepeatableJob, RepeatableJobData } from './types';
import type { QueueImpl } from './queue';
import type { JobImpl } from './job';

export class Scheduler<T = any> {
  private repeatableJobs: Map<string, RepeatableJobData> = new Map();
  private delayedJobTimers: Map<string | number, NodeJS.Timeout> = new Map();
  private repeatTimers: Map<string, NodeJS.Timeout> = new Map();
  private stopped = false;

  constructor(private queue: QueueImpl<T>) {
    this.startRepeatableJobsCheck();
  }

  /**
   * Add a repeatable job
   */
  async addRepeatableJob(job: JobImpl<T>): Promise<void> {
    const repeat = job.opts.repeat!;
    const key = this.getRepeatableKey(job.name, repeat);

    const data: RepeatableJobData = {
      key,
      name: job.name,
      data: job.data,
      opts: job.opts,
      cron: repeat.cron,
      every: repeat.every,
      next: this.getNextRepeatTime(repeat),
      tz: repeat.tz,
    };

    this.repeatableJobs.set(key, data);

    // Schedule first execution
    this.scheduleRepeatableJob(data);
  }

  /**
   * Remove a repeatable job
   */
  async removeRepeatableJob(name: string, repeat: RepeatOptions): Promise<void> {
    const key = this.getRepeatableKey(name, repeat);

    const timer = this.repeatTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      this.repeatTimers.delete(key);
    }

    this.repeatableJobs.delete(key);
  }

  /**
   * Schedule a delayed job
   */
  scheduleDelayedJob(job: JobImpl<T>): void {
    const delay = job.delay;

    const timer = setTimeout(async () => {
      this.delayedJobTimers.delete(job.id);

      // Move to waiting queue
      job.delay = 0;
      job.setState('waiting');
      this.queue.promoteDelayedJob(job);
    }, delay);

    this.delayedJobTimers.set(job.id, timer);
  }

  /**
   * Get repeatable jobs
   */
  async getRepeatableJobs(start: number = 0, end: number = -1, asc: boolean = false): Promise<RepeatableJob[]> {
    const jobs: RepeatableJob[] = Array.from(this.repeatableJobs.values()).map(data => ({
      key: data.key,
      name: data.name,
      endDate: 0,
      tz: data.tz,
      cron: data.cron || '',
      next: data.next,
    }));

    const sorted = asc ? jobs : jobs.reverse();
    const endIndex = end === -1 ? sorted.length : end + 1;

    return sorted.slice(start, endIndex);
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    this.stopped = true;

    // Clear all timers
    for (const timer of this.delayedJobTimers.values()) {
      clearTimeout(timer);
    }
    this.delayedJobTimers.clear();

    for (const timer of this.repeatTimers.values()) {
      clearTimeout(timer);
    }
    this.repeatTimers.clear();
  }

  // Internal methods

  private scheduleRepeatableJob(data: RepeatableJobData): void {
    if (this.stopped) {
      return;
    }

    const now = Date.now();
    const delay = Math.max(0, data.next - now);

    const timer = setTimeout(async () => {
      // Create and add job
      await this.queue.add(data.name, data.data as T, {
        ...data.opts,
        repeat: undefined, // Don't repeat the individual job
      });

      // Calculate next execution time
      data.next = this.getNextRepeatTime(data.opts.repeat!);

      // Schedule next execution
      this.scheduleRepeatableJob(data);
    }, delay);

    this.repeatTimers.set(data.key, timer);
  }

  private startRepeatableJobsCheck(): void {
    // Periodically check for repeatable jobs that need to run
    setInterval(() => {
      if (this.stopped) {
        return;
      }

      const now = Date.now();

      for (const data of this.repeatableJobs.values()) {
        if (data.next <= now && !this.repeatTimers.has(data.key)) {
          this.scheduleRepeatableJob(data);
        }
      }
    }, 1000);
  }

  private getNextRepeatTime(repeat: RepeatOptions): number {
    const now = Date.now();

    if (repeat.cron) {
      // Parse cron expression
      return this.parseCron(repeat.cron, now);
    }

    if (repeat.every) {
      return now + repeat.every;
    }

    return now + 60000; // Default to 1 minute
  }

  private parseCron(cron: string, from: number): number {
    // Simplified cron parsing
    // Format: minute hour day month dayOfWeek

    const parts = cron.split(' ');

    if (parts.length !== 5) {
      throw new Error('Invalid cron expression');
    }

    // For simplicity, just add 1 minute if it's "* * * * *"
    if (cron === '* * * * *') {
      return from + 60000;
    }

    // Parse minute
    const minute = parts[0];
    if (minute !== '*') {
      const nextMinute = parseInt(minute);
      const now = new Date(from);
      now.setSeconds(0);
      now.setMilliseconds(0);

      if (now.getMinutes() < nextMinute) {
        now.setMinutes(nextMinute);
      } else {
        now.setHours(now.getHours() + 1);
        now.setMinutes(nextMinute);
      }

      return now.getTime();
    }

    // Default to next minute
    return from + 60000;
  }

  private getRepeatableKey(name: string, repeat: RepeatOptions): string {
    const parts = [name];

    if (repeat.cron) {
      parts.push(`cron:${repeat.cron}`);
    }

    if (repeat.every) {
      parts.push(`every:${repeat.every}`);
    }

    if (repeat.tz) {
      parts.push(`tz:${repeat.tz}`);
    }

    return parts.join(':');
  }
}
