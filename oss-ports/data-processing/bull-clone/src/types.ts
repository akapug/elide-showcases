/**
 * Elide Bull Clone - Type Definitions
 * Complete TypeScript types for Bull queue system
 */

// Queue Options
export interface QueueOptions {
  redis?: RedisOptions;
  prefix?: string;
  defaultJobOptions?: JobOptions;
  settings?: QueueSettings;
  limiter?: RateLimiter;
}

export interface RedisOptions {
  port?: number;
  host?: string;
  db?: number;
  password?: string;
  family?: number;
  keyPrefix?: string;
  retryStrategy?: (times: number) => number | void;
  enableReadyCheck?: boolean;
  maxRetriesPerRequest?: number;
}

export interface QueueSettings {
  lockDuration?: number;
  lockRenewTime?: number;
  stalledInterval?: number;
  maxStalledCount?: number;
  guardInterval?: number;
  retryProcessDelay?: number;
}

export interface RateLimiter {
  max: number;
  duration: number;
  bounceBack?: boolean;
}

// Job Options
export interface JobOptions {
  priority?: number;
  delay?: number;
  attempts?: number;
  repeat?: RepeatOptions;
  backoff?: BackoffOptions;
  lifo?: boolean;
  timeout?: number;
  jobId?: string;
  removeOnComplete?: boolean | number;
  removeOnFail?: boolean | number;
  stackTraceLimit?: number;
}

export interface RepeatOptions {
  cron?: string;
  tz?: string;
  startDate?: Date | string | number;
  endDate?: Date | string | number;
  limit?: number;
  every?: number;
  count?: number;
}

export interface BackoffOptions {
  type: 'fixed' | 'exponential' | 'custom';
  delay?: number;
}

// Job Interface
export interface Job<T = any> {
  id: string | number;
  name: string;
  data: T;
  opts: JobOptions;
  progress: number | object;
  delay: number;
  timestamp: number;
  attemptsMade: number;
  failedReason?: string;
  stacktrace: string[];
  returnvalue: any;
  finishedOn?: number;
  processedOn?: number;

  update(data: Partial<T>): Promise<void>;
  remove(): Promise<void>;
  retry(): Promise<void>;
  discard(): Promise<void>;
  promote(): Promise<void>;
  finished(): Promise<any>;
  moveToCompleted(returnValue?: any, ignoreLock?: boolean): Promise<void>;
  moveToFailed(errorInfo: { message: string }, ignoreLock?: boolean): Promise<void>;
  isCompleted(): Promise<boolean>;
  isFailed(): Promise<boolean>;
  isDelayed(): Promise<boolean>;
  isActive(): Promise<boolean>;
  isWaiting(): Promise<boolean>;
  isPaused(): Promise<boolean>;
  getState(): Promise<JobState>;
  takeLock(): Promise<string>;
  releaseLock(token: string): Promise<void>;
  progress(progress: number | object): Promise<void>;
  log(message: string): Promise<void>;
  toJSON(): JobJSON;
}

export type JobState =
  | 'completed'
  | 'failed'
  | 'delayed'
  | 'active'
  | 'waiting'
  | 'paused'
  | 'stuck'
  | 'unknown';

export interface JobJSON {
  id: string | number;
  name: string;
  data: any;
  opts: JobOptions;
  progress: number | object;
  delay: number;
  timestamp: number;
  attemptsMade: number;
  failedReason?: string;
  stacktrace: string[];
  returnvalue: any;
  finishedOn?: number;
  processedOn?: number;
}

// Queue Interface
export interface Queue<T = any> {
  name: string;
  add(name: string, data: T, opts?: JobOptions): Promise<Job<T>>;
  add(data: T, opts?: JobOptions): Promise<Job<T>>;
  process(concurrency: number, processor: Processor<T>): void;
  process(processor: Processor<T>): void;
  process(name: string, concurrency: number, processor: Processor<T>): void;
  process(name: string, processor: Processor<T>): void;

  getJob(jobId: string | number): Promise<Job<T> | null>;
  getJobs(types: JobState[], start?: number, end?: number, asc?: boolean): Promise<Job<T>[]>;
  getJobCounts(): Promise<JobCounts>;
  getCompleted(start?: number, end?: number): Promise<Job<T>[]>;
  getFailed(start?: number, end?: number): Promise<Job<T>[]>;
  getDelayed(start?: number, end?: number): Promise<Job<T>[]>;
  getActive(start?: number, end?: number): Promise<Job<T>[]>;
  getWaiting(start?: number, end?: number): Promise<Job<T>[]>;
  getPaused(start?: number, end?: number): Promise<Job<T>[]>;
  getRepeatableJobs(start?: number, end?: number, asc?: boolean): Promise<RepeatableJob[]>;

  clean(grace: number, status?: JobState, limit?: number): Promise<Job<T>[]>;
  empty(): Promise<void>;
  close(): Promise<void>;
  pause(isLocal?: boolean): Promise<void>;
  resume(isLocal?: boolean): Promise<void>;
  count(): Promise<number>;
  isPaused(): Promise<boolean>;

  removeJobs(pattern: string): Promise<void>;
  removeRepeatable(name: string, repeat: RepeatOptions): Promise<void>;

  on(event: string, callback: Function): this;
  once(event: string, callback: Function): this;
  off(event: string, callback: Function): this;

  getMetrics(): Promise<QueueMetrics>;
}

export interface JobCounts {
  waiting: number;
  active: number;
  completed: number;
  failed: number;
  delayed: number;
  paused: number;
}

export interface RepeatableJob {
  key: string;
  name: string;
  id?: string;
  endDate: number;
  tz?: string;
  cron: string;
  next: number;
}

export interface QueueMetrics {
  meta: {
    count: JobCounts;
  };
  wait: {
    avg: number;
    max: number;
    min: number;
  };
  processing: {
    avg: number;
    max: number;
    min: number;
  };
}

// Processor Types
export type Processor<T = any> = (job: Job<T>) => Promise<any>;

export type ProcessorCallback<T = any> = (job: Job<T>, done: DoneCallback) => void;

export type DoneCallback = (error?: Error | null, result?: any) => void;

// Event Types
export interface QueueEvents {
  error: (error: Error) => void;
  waiting: (jobId: string | number) => void;
  active: (job: Job, jobPromise: Promise<any>) => void;
  stalled: (job: Job) => void;
  progress: (job: Job, progress: number | object) => void;
  completed: (job: Job, result: any) => void;
  failed: (job: Job, error: Error) => void;
  paused: () => void;
  resumed: () => void;
  cleaned: (jobs: Job[], type: string) => void;
  drained: () => void;
  removed: (job: Job) => void;
  global: (event: string, ...args: any[]) => void;
}

// Scheduler Types
export interface RepeatableJobData {
  key: string;
  name: string;
  data: any;
  opts: JobOptions;
  cron?: string;
  every?: number;
  next: number;
  tz?: string;
}

// Worker Types
export interface WorkerOptions {
  concurrency?: number;
  limiter?: RateLimiter;
  settings?: QueueSettings;
}

export interface Worker<T = any> {
  run(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  close(): Promise<void>;
  isStopped(): boolean;
  isPaused(): boolean;
}

// Error Types
export class BullError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'BullError';
  }
}

export class JobRetryError extends BullError {
  constructor(message: string, public attemptsMade: number) {
    super(message, 'JOB_RETRY');
    this.name = 'JobRetryError';
  }
}

export class QueueClosed extends BullError {
  constructor() {
    super('Queue is closed', 'QUEUE_CLOSED');
    this.name = 'QueueClosed';
  }
}

// Utilities
export interface JobProgress {
  progress: number | object;
  data?: any;
}

export interface JobLog {
  timestamp: number;
  message: string;
}

export interface SandboxedJob<T = any> {
  id: string | number;
  name: string;
  data: T;
  opts: JobOptions;
  progress(progress: number | object): void;
  log(message: string): void;
}
