/**
 * Pipeline Scheduler
 *
 * Production-grade ETL pipeline scheduling:
 * - Cron-based scheduling
 * - Interval-based execution
 * - Dependency management
 * - Retry mechanisms
 * - Parallel execution limits
 * - Schedule validation
 * - Execution history tracking
 * - Alert notifications
 */

export interface ScheduleConfig {
  id: string;
  name: string;
  cron?: string;
  interval?: number;
  enabled: boolean;
  timezone?: string;
  retryPolicy?: RetryPolicy;
  dependencies?: string[];
  maxConcurrent?: number;
  timeout?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  retryDelay: number;
  backoffMultiplier?: number;
  maxRetryDelay?: number;
}

export interface ScheduleExecution {
  id: string;
  scheduleId: string;
  startTime: number;
  endTime?: number;
  status: 'running' | 'completed' | 'failed' | 'timeout' | 'cancelled';
  attempt: number;
  error?: string;
  result?: any;
}

export interface ScheduleStats {
  scheduleId: string;
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageRuntime: number;
  lastExecution?: ScheduleExecution;
  nextExecution?: number;
}

// ==================== Cron Parser ====================

export class CronParser {
  private static readonly PRESETS: Record<string, string> = {
    '@yearly': '0 0 1 1 *',
    '@annually': '0 0 1 1 *',
    '@monthly': '0 0 1 * *',
    '@weekly': '0 0 * * 0',
    '@daily': '0 0 * * *',
    '@midnight': '0 0 * * *',
    '@hourly': '0 * * * *'
  };

  static parse(cronExpression: string): {
    minute: number[];
    hour: number[];
    dayOfMonth: number[];
    month: number[];
    dayOfWeek: number[];
  } {
    // Handle presets
    if (cronExpression.startsWith('@')) {
      cronExpression = this.PRESETS[cronExpression] || cronExpression;
    }

    const parts = cronExpression.split(' ');

    if (parts.length !== 5) {
      throw new Error('Invalid cron expression: must have 5 fields (minute hour day month weekday)');
    }

    return {
      minute: this.parseField(parts[0], 0, 59),
      hour: this.parseField(parts[1], 0, 23),
      dayOfMonth: this.parseField(parts[2], 1, 31),
      month: this.parseField(parts[3], 1, 12),
      dayOfWeek: this.parseField(parts[4], 0, 6)
    };
  }

  private static parseField(field: string, min: number, max: number): number[] {
    if (field === '*') {
      return this.range(min, max);
    }

    if (field.includes('/')) {
      const [range, step] = field.split('/');
      const values = range === '*' ? this.range(min, max) : this.parseField(range, min, max);
      return values.filter((_, i) => i % parseInt(step) === 0);
    }

    if (field.includes('-')) {
      const [start, end] = field.split('-').map(Number);
      return this.range(start, end);
    }

    if (field.includes(',')) {
      return field.split(',').flatMap(part => this.parseField(part, min, max));
    }

    return [parseInt(field)];
  }

  private static range(start: number, end: number): number[] {
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }

  static getNextExecution(cronExpression: string, after: Date = new Date()): Date {
    const schedule = this.parse(cronExpression);
    const next = new Date(after);

    next.setSeconds(0);
    next.setMilliseconds(0);
    next.setMinutes(next.getMinutes() + 1); // Start from next minute

    // Find next matching time (with safety limit)
    let attempts = 0;
    const maxAttempts = 366 * 24 * 60; // 1 year in minutes

    while (attempts < maxAttempts) {
      if (
        schedule.minute.includes(next.getMinutes()) &&
        schedule.hour.includes(next.getHours()) &&
        schedule.dayOfMonth.includes(next.getDate()) &&
        schedule.month.includes(next.getMonth() + 1) &&
        schedule.dayOfWeek.includes(next.getDay())
      ) {
        return next;
      }

      next.setMinutes(next.getMinutes() + 1);
      attempts++;
    }

    throw new Error('Could not find next execution time');
  }
}

// ==================== Pipeline Scheduler ====================

export class PipelineScheduler {
  private schedules = new Map<string, ScheduleConfig>();
  private executions = new Map<string, ScheduleExecution[]>();
  private timers = new Map<string, number>();
  private running = new Map<string, number>();
  private handlers = new Map<string, (execution: ScheduleExecution) => Promise<any>>();

  registerSchedule(config: ScheduleConfig, handler: (execution: ScheduleExecution) => Promise<any>): void {
    this.schedules.set(config.id, config);
    this.handlers.set(config.id, handler);

    if (config.enabled) {
      this.scheduleNext(config.id);
    }

    console.log(`Registered schedule: ${config.name} (${config.id})`);
  }

  unregisterSchedule(scheduleId: string): void {
    this.stopSchedule(scheduleId);
    this.schedules.delete(scheduleId);
    this.handlers.delete(scheduleId);
    this.executions.delete(scheduleId);

    console.log(`Unregistered schedule: ${scheduleId}`);
  }

  startSchedule(scheduleId: string): void {
    const config = this.schedules.get(scheduleId);

    if (!config) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    config.enabled = true;
    this.scheduleNext(scheduleId);

    console.log(`Started schedule: ${config.name}`);
  }

  stopSchedule(scheduleId: string): void {
    const config = this.schedules.get(scheduleId);

    if (!config) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    config.enabled = false;

    const timerId = this.timers.get(scheduleId);
    if (timerId) {
      clearTimeout(timerId);
      this.timers.delete(scheduleId);
    }

    console.log(`Stopped schedule: ${config.name}`);
  }

  private scheduleNext(scheduleId: string): void {
    const config = this.schedules.get(scheduleId);

    if (!config || !config.enabled) {
      return;
    }

    let delay: number;

    if (config.cron) {
      const nextRun = CronParser.getNextExecution(config.cron);
      delay = nextRun.getTime() - Date.now();
    } else if (config.interval) {
      delay = config.interval;
    } else {
      console.error(`Schedule ${scheduleId} has no cron or interval configured`);
      return;
    }

    const timerId = setTimeout(() => {
      this.executeSchedule(scheduleId);
    }, delay);

    this.timers.set(scheduleId, timerId as unknown as number);

    console.log(`Next execution of ${config.name} in ${Math.round(delay / 1000)}s`);
  }

  private async executeSchedule(scheduleId: string): Promise<void> {
    const config = this.schedules.get(scheduleId);
    const handler = this.handlers.get(scheduleId);

    if (!config || !handler) {
      return;
    }

    // Check concurrency limits
    const runningCount = this.running.get(scheduleId) || 0;
    const maxConcurrent = config.maxConcurrent || 1;

    if (runningCount >= maxConcurrent) {
      console.log(`Skipping execution of ${config.name}: max concurrent limit reached`);
      this.scheduleNext(scheduleId);
      return;
    }

    // Check dependencies
    if (config.dependencies && config.dependencies.length > 0) {
      const dependenciesMet = await this.checkDependencies(config.dependencies);

      if (!dependenciesMet) {
        console.log(`Skipping execution of ${config.name}: dependencies not met`);
        this.scheduleNext(scheduleId);
        return;
      }
    }

    this.running.set(scheduleId, runningCount + 1);

    const execution: ScheduleExecution = {
      id: `exec_${scheduleId}_${Date.now()}`,
      scheduleId,
      startTime: Date.now(),
      status: 'running',
      attempt: 1
    };

    this.addExecution(scheduleId, execution);

    console.log(`Executing schedule: ${config.name} (${execution.id})`);

    try {
      const result = await this.executeWithRetry(execution, handler, config.retryPolicy, config.timeout);

      execution.status = 'completed';
      execution.endTime = Date.now();
      execution.result = result;

      console.log(`Completed schedule: ${config.name} in ${execution.endTime - execution.startTime}ms`);
    } catch (error) {
      execution.status = 'failed';
      execution.endTime = Date.now();
      execution.error = error.message;

      console.error(`Failed schedule: ${config.name} - ${error.message}`);
    } finally {
      this.running.set(scheduleId, runningCount);
      this.scheduleNext(scheduleId);
    }
  }

  private async executeWithRetry(
    execution: ScheduleExecution,
    handler: (exec: ScheduleExecution) => Promise<any>,
    retryPolicy?: RetryPolicy,
    timeout?: number
  ): Promise<any> {
    const maxRetries = retryPolicy?.maxRetries || 0;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries + 1; attempt++) {
      execution.attempt = attempt;

      try {
        if (timeout) {
          return await this.executeWithTimeout(handler, execution, timeout);
        } else {
          return await handler(execution);
        }
      } catch (error) {
        lastError = error;

        if (attempt <= maxRetries) {
          const delay = this.calculateRetryDelay(attempt, retryPolicy);
          console.log(`Retry attempt ${attempt}/${maxRetries} after ${delay}ms`);
          await this.sleep(delay);
        }
      }
    }

    throw lastError || new Error('Execution failed');
  }

  private async executeWithTimeout(
    handler: (exec: ScheduleExecution) => Promise<any>,
    execution: ScheduleExecution,
    timeout: number
  ): Promise<any> {
    return Promise.race([
      handler(execution),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(`Execution timeout after ${timeout}ms`)), timeout)
      )
    ]);
  }

  private calculateRetryDelay(attempt: number, retryPolicy?: RetryPolicy): number {
    const baseDelay = retryPolicy?.retryDelay || 1000;
    const multiplier = retryPolicy?.backoffMultiplier || 2;
    const maxDelay = retryPolicy?.maxRetryDelay || 60000;

    const delay = baseDelay * Math.pow(multiplier, attempt - 1);
    return Math.min(delay, maxDelay);
  }

  private async checkDependencies(dependencies: string[]): Promise<boolean> {
    for (const depId of dependencies) {
      const executions = this.executions.get(depId) || [];
      const lastExecution = executions[executions.length - 1];

      if (!lastExecution || lastExecution.status !== 'completed') {
        return false;
      }

      // Check if execution is recent (within last 24 hours)
      if (Date.now() - lastExecution.endTime! > 24 * 60 * 60 * 1000) {
        return false;
      }
    }

    return true;
  }

  private addExecution(scheduleId: string, execution: ScheduleExecution): void {
    if (!this.executions.has(scheduleId)) {
      this.executions.set(scheduleId, []);
    }

    const executions = this.executions.get(scheduleId)!;
    executions.push(execution);

    // Keep only last 100 executions
    if (executions.length > 100) {
      executions.shift();
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getSchedule(scheduleId: string): ScheduleConfig | undefined {
    return this.schedules.get(scheduleId);
  }

  getAllSchedules(): ScheduleConfig[] {
    return Array.from(this.schedules.values());
  }

  getExecutionHistory(scheduleId: string, limit = 10): ScheduleExecution[] {
    const executions = this.executions.get(scheduleId) || [];
    return executions.slice(-limit);
  }

  getStats(scheduleId: string): ScheduleStats | null {
    const config = this.schedules.get(scheduleId);
    const executions = this.executions.get(scheduleId) || [];

    if (!config) {
      return null;
    }

    const completed = executions.filter(e => e.status === 'completed');
    const totalRuntime = completed.reduce((acc, e) => acc + (e.endTime! - e.startTime), 0);

    let nextExecution: number | undefined;

    if (config.enabled) {
      try {
        if (config.cron) {
          nextExecution = CronParser.getNextExecution(config.cron).getTime();
        } else if (config.interval) {
          const lastExec = executions[executions.length - 1];
          nextExecution = lastExec ? lastExec.endTime! + config.interval : Date.now() + config.interval;
        }
      } catch (error) {
        console.error(`Error calculating next execution: ${error.message}`);
      }
    }

    return {
      scheduleId,
      totalExecutions: executions.length,
      successfulExecutions: completed.length,
      failedExecutions: executions.filter(e => e.status === 'failed').length,
      averageRuntime: completed.length > 0 ? totalRuntime / completed.length : 0,
      lastExecution: executions[executions.length - 1],
      nextExecution
    };
  }

  printScheduleSummary(): void {
    console.log('\n╔════════════════════════════════════════════════════════╗');
    console.log('║          PIPELINE SCHEDULE SUMMARY                     ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    const schedules = this.getAllSchedules();

    for (const schedule of schedules) {
      const stats = this.getStats(schedule.id);

      if (!stats) continue;

      console.log(`Schedule: ${schedule.name} (${schedule.id})`);
      console.log(`  Status: ${schedule.enabled ? 'Enabled' : 'Disabled'}`);
      console.log(`  Schedule: ${schedule.cron || `Every ${schedule.interval}ms`}`);
      console.log(`  Total Executions: ${stats.totalExecutions}`);
      console.log(`  Success Rate: ${stats.totalExecutions > 0 ? ((stats.successfulExecutions / stats.totalExecutions) * 100).toFixed(2) : 0}%`);
      console.log(`  Average Runtime: ${stats.averageRuntime.toFixed(0)}ms`);

      if (stats.nextExecution) {
        const nextDate = new Date(stats.nextExecution);
        const timeUntil = stats.nextExecution - Date.now();
        console.log(`  Next Execution: ${nextDate.toISOString()} (in ${Math.round(timeUntil / 1000)}s)`);
      }

      if (stats.lastExecution) {
        const lastDate = new Date(stats.lastExecution.startTime);
        console.log(`  Last Execution: ${lastDate.toISOString()} - ${stats.lastExecution.status}`);
      }

      console.log();
    }

    console.log('═'.repeat(80) + '\n');
  }

  shutdown(): void {
    console.log('Shutting down scheduler...');

    for (const scheduleId of this.schedules.keys()) {
      this.stopSchedule(scheduleId);
    }

    console.log('Scheduler shutdown complete');
  }
}

// ==================== Schedule Builder ====================

export class ScheduleBuilder {
  private config: Partial<ScheduleConfig> = {
    enabled: true
  };

  static create(id: string, name: string): ScheduleBuilder {
    const builder = new ScheduleBuilder();
    builder.config.id = id;
    builder.config.name = name;
    return builder;
  }

  cron(expression: string): this {
    this.config.cron = expression;
    return this;
  }

  interval(milliseconds: number): this {
    this.config.interval = milliseconds;
    return this;
  }

  retry(maxRetries: number, retryDelay = 1000, backoffMultiplier = 2): this {
    this.config.retryPolicy = {
      maxRetries,
      retryDelay,
      backoffMultiplier
    };
    return this;
  }

  dependsOn(...scheduleIds: string[]): this {
    this.config.dependencies = scheduleIds;
    return this;
  }

  maxConcurrent(limit: number): this {
    this.config.maxConcurrent = limit;
    return this;
  }

  timeout(milliseconds: number): this {
    this.config.timeout = milliseconds;
    return this;
  }

  enabled(value: boolean): this {
    this.config.enabled = value;
    return this;
  }

  build(): ScheduleConfig {
    if (!this.config.id || !this.config.name) {
      throw new Error('Schedule must have id and name');
    }

    if (!this.config.cron && !this.config.interval) {
      throw new Error('Schedule must have cron or interval');
    }

    return this.config as ScheduleConfig;
  }
}

// ==================== Common Schedules ====================

export const CommonSchedules = {
  hourly: (id: string, name: string) =>
    ScheduleBuilder.create(id, name).cron('@hourly').build(),

  daily: (id: string, name: string, hour = 0, minute = 0) =>
    ScheduleBuilder.create(id, name).cron(`${minute} ${hour} * * *`).build(),

  weekly: (id: string, name: string, dayOfWeek = 0, hour = 0, minute = 0) =>
    ScheduleBuilder.create(id, name).cron(`${minute} ${hour} * * ${dayOfWeek}`).build(),

  monthly: (id: string, name: string, dayOfMonth = 1, hour = 0, minute = 0) =>
    ScheduleBuilder.create(id, name).cron(`${minute} ${hour} ${dayOfMonth} * *`).build(),

  everyNMinutes: (id: string, name: string, minutes: number) =>
    ScheduleBuilder.create(id, name).interval(minutes * 60 * 1000).build(),

  everyNHours: (id: string, name: string, hours: number) =>
    ScheduleBuilder.create(id, name).interval(hours * 60 * 60 * 1000).build()
};
