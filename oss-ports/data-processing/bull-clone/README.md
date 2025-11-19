# Bull Clone - Elide Queue System

Production-ready Redis-based queue system for Elide, providing a complete feature-compatible implementation of Bull with full TypeScript support.

## Features

- **Job Queue** - Redis-backed persistent job queue
- **Job Processing** - Concurrent job processing with multiple workers
- **Job Retries** - Automatic retry with exponential backoff
- **Delayed Jobs** - Schedule jobs for future execution
- **Job Prioritization** - Priority-based job processing
- **Job Events** - Comprehensive job lifecycle events
- **Repeatable Jobs** - Cron-based and interval-based recurring jobs
- **Rate Limiting** - Control job processing rate
- **TypeScript** - Full type safety and IntelliSense support

## Installation

```bash
npm install @elide/bull-clone
```

## Quick Start

```typescript
import { createQueue } from '@elide/bull-clone';

// Create a queue
const queue = createQueue('my-queue');

// Add a job
await queue.add({ email: 'user@example.com', message: 'Hello!' });

// Process jobs
queue.process(async (job) => {
  console.log('Processing job:', job.id);
  console.log('Data:', job.data);

  // Simulate work
  await sendEmail(job.data.email, job.data.message);

  return { sent: true };
});
```

## Adding Jobs

### Basic Job

```typescript
const job = await queue.add({
  email: 'user@example.com',
  subject: 'Welcome',
});

console.log('Job added:', job.id);
```

### Named Jobs

```typescript
await queue.add('email', {
  to: 'user@example.com',
  subject: 'Welcome',
});
```

### Job Options

```typescript
await queue.add('email', data, {
  priority: 10,              // Higher priority (default: 0)
  delay: 5000,              // Delay 5 seconds
  attempts: 3,              // Retry up to 3 times
  timeout: 30000,           // Timeout after 30 seconds
  removeOnComplete: true,   // Remove when completed
  removeOnFail: false,      // Keep failed jobs
  backoff: {
    type: 'exponential',
    delay: 1000,
  },
});
```

## Processing Jobs

### Basic Processor

```typescript
queue.process(async (job) => {
  console.log('Processing:', job.data);

  const result = await doWork(job.data);

  return result;
});
```

### Named Processors

```typescript
// Process specific job names
queue.process('email', async (job) => {
  await sendEmail(job.data);
});

queue.process('notification', async (job) => {
  await sendNotification(job.data);
});
```

### Concurrent Processing

```typescript
// Process up to 5 jobs concurrently
queue.process(5, async (job) => {
  return await processJob(job.data);
});
```

### Job Progress

```typescript
queue.process(async (job) => {
  await job.progress(0);

  for (let i = 0; i < 100; i++) {
    await doWork(i);
    await job.progress(i + 1);
  }

  return { completed: true };
});

// Listen to progress events
queue.on('progress', (job, progress) => {
  console.log(`Job ${job.id} is ${progress}% complete`);
});
```

## Job Events

```typescript
queue.on('waiting', (jobId) => {
  console.log('Job waiting:', jobId);
});

queue.on('active', (job) => {
  console.log('Job started:', job.id);
});

queue.on('completed', (job, result) => {
  console.log('Job completed:', job.id, result);
});

queue.on('failed', (job, error) => {
  console.log('Job failed:', job.id, error);
});

queue.on('progress', (job, progress) => {
  console.log('Job progress:', job.id, progress);
});

queue.on('paused', () => {
  console.log('Queue paused');
});

queue.on('resumed', () => {
  console.log('Queue resumed');
});
```

## Delayed Jobs

```typescript
// Delay job by 1 hour
await queue.add(data, {
  delay: 3600000,
});

// Promote delayed job to immediate processing
const job = await queue.getJob(jobId);
await job.promote();
```

## Repeatable Jobs

### Cron-based

```typescript
// Run every day at 3:15 AM
await queue.add('daily-report', data, {
  repeat: {
    cron: '15 3 * * *',
    tz: 'America/New_York',
  },
});

// Run every 5 minutes
await queue.add('health-check', data, {
  repeat: {
    cron: '*/5 * * * *',
  },
});
```

### Interval-based

```typescript
// Run every 10 seconds
await queue.add('poll', data, {
  repeat: {
    every: 10000,
  },
});
```

### Remove Repeatable Job

```typescript
await queue.removeRepeatable('daily-report', {
  cron: '15 3 * * *',
});
```

## Job Retries

### Automatic Retries

```typescript
await queue.add(data, {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,  // Start with 1 second
  },
});
```

### Fixed Backoff

```typescript
await queue.add(data, {
  attempts: 3,
  backoff: {
    type: 'fixed',
    delay: 5000,  // Always wait 5 seconds
  },
});
```

### Manual Retry

```typescript
const job = await queue.getJob(jobId);
await job.retry();
```

## Queue Management

### Pause/Resume

```typescript
// Pause queue
await queue.pause();

// Resume queue
await queue.resume();

// Check if paused
const paused = await queue.isPaused();
```

### Get Job Counts

```typescript
const counts = await queue.getJobCounts();
console.log(counts);
// {
//   waiting: 5,
//   active: 2,
//   completed: 100,
//   failed: 3,
//   delayed: 10,
//   paused: 0
// }
```

### Get Jobs

```typescript
// Get all waiting jobs
const waiting = await queue.getWaiting();

// Get failed jobs
const failed = await queue.getFailed();

// Get completed jobs (paginated)
const completed = await queue.getCompleted(0, 10);

// Get jobs by state
const jobs = await queue.getJobs(['waiting', 'active']);
```

### Clean Old Jobs

```typescript
// Remove completed jobs older than 1 hour
await queue.clean(3600000, 'completed');

// Remove failed jobs older than 24 hours
await queue.clean(86400000, 'failed');

// Remove old jobs with limit
await queue.clean(3600000, 'completed', 100);
```

### Empty Queue

```typescript
// Remove all waiting and delayed jobs
await queue.empty();
```

## Job Control

### Get Job

```typescript
const job = await queue.getJob(jobId);

if (job) {
  console.log('Job data:', job.data);
  console.log('Job state:', await job.getState());
}
```

### Remove Job

```typescript
const job = await queue.getJob(jobId);
await job.remove();
```

### Job State

```typescript
const state = await job.getState();
// 'completed' | 'failed' | 'delayed' | 'active' | 'waiting' | 'paused'

const isCompleted = await job.isCompleted();
const isFailed = await job.isFailed();
const isActive = await job.isActive();
```

### Job Logging

```typescript
queue.process(async (job) => {
  await job.log('Starting processing');
  await doWork();
  await job.log('Processing complete');
});
```

## Advanced Features

### Priority Queue

```typescript
// Higher priority jobs are processed first
await queue.add(urgentData, { priority: 10 });
await queue.add(normalData, { priority: 5 });
await queue.add(lowData, { priority: 1 });
```

### LIFO Queue

```typescript
// Last-in, first-out queue
await queue.add(data, { lifo: true });
```

### Rate Limiting

```typescript
const queue = createQueue('rate-limited', {
  limiter: {
    max: 100,        // Max 100 jobs
    duration: 60000, // Per minute
  },
});
```

### Job Dependencies

```typescript
const job1 = await queue.add('task1', data1);

// Wait for job1 to complete
await job1.finished();

// Then add dependent job
await queue.add('task2', data2);
```

## Monitoring

### Queue Metrics

```typescript
const metrics = await queue.getMetrics();
console.log(metrics);
// {
//   meta: {
//     count: { waiting: 5, active: 2, ... }
//   },
//   wait: { avg: 1000, max: 5000, min: 100 },
//   processing: { avg: 500, max: 2000, min: 50 }
// }
```

### Global Events

```typescript
queue.on('global', (event, ...args) => {
  console.log('Event:', event, args);
});
```

## Error Handling

```typescript
import { BullError, JobRetryError, QueueClosed } from '@elide/bull-clone';

queue.process(async (job) => {
  try {
    return await riskyOperation(job.data);
  } catch (error) {
    // Log error
    await job.log(`Error: ${error.message}`);

    // Decide whether to retry
    if (error instanceof NetworkError) {
      throw error; // Will retry
    } else {
      await job.discard(); // Won't retry
    }
  }
});
```

## Complete Example

```typescript
import { createQueue } from '@elide/bull-clone';

// Create queue
const emailQueue = createQueue('emails', {
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: 100,
  },
});

// Add jobs
async function sendWelcomeEmail(userId: string) {
  const job = await emailQueue.add('welcome', {
    userId,
    template: 'welcome',
  }, {
    priority: 10,
  });

  return job.id;
}

// Process jobs
emailQueue.process('welcome', 5, async (job) => {
  const { userId, template } = job.data;

  await job.progress(0);
  await job.log(`Sending ${template} email to user ${userId}`);

  const user = await getUser(userId);
  await job.progress(50);

  await sendEmail(user.email, template);
  await job.progress(100);

  return { sent: true, userId };
});

// Handle events
emailQueue.on('completed', (job, result) => {
  console.log(`Email sent to user ${result.userId}`);
});

emailQueue.on('failed', (job, error) => {
  console.error(`Failed to send email:`, error);
});

// Schedule recurring job
await emailQueue.add('daily-digest', {}, {
  repeat: {
    cron: '0 9 * * *',
    tz: 'UTC',
  },
});
```

## Testing

```bash
npm test
```

## License

MIT
