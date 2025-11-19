# Agenda Clone - Elide Job Scheduler

Production-ready MongoDB-based job scheduling for Elide, providing a complete feature-compatible implementation of Agenda with full TypeScript support.

## Features

- **Job Definitions** - Define job processors with concurrency control
- **Scheduling** - Cron, interval, and one-time scheduling
- **Job Processing** - Concurrent job execution with locking
- **Job Priorities** - Priority-based job execution
- **Job Locking** - Prevent duplicate job execution
- **MongoDB-backed** - Persistent job storage
- **TypeScript** - Full type safety

## Quick Start

```typescript
import Agenda from '@elide/agenda-clone';

const agenda = new Agenda({
  db: { address: 'mongodb://localhost/agenda' },
  processEvery: '30 seconds',
});

// Define a job
agenda.define('send email', async (job) => {
  const { to, subject } = job.attrs.data;
  await sendEmail(to, subject);
});

// Start processing
await agenda.start();

// Schedule a job
await agenda.schedule('in 5 minutes', 'send email', {
  to: 'user@example.com',
  subject: 'Hello',
});
```

## Job Definitions

```typescript
// Simple definition
agenda.define('simple job', async (job) => {
  console.log('Running job:', job.attrs.data);
});

// With options
agenda.define('complex job', {
  concurrency: 5,
  lockLifetime: 60000,
  priority: 'high',
}, async (job) => {
  await doComplexWork(job.attrs.data);
});

// With callback
agenda.define('callback job', (job, done) => {
  doWork((err) => {
    done(err);
  });
});
```

## Scheduling Jobs

### Immediate

```typescript
await agenda.now('send email', { to: 'user@example.com' });
```

### One-time

```typescript
// Schedule for specific time
await agenda.schedule('tomorrow at noon', 'send email', data);

// Schedule with Date
await agenda.schedule(new Date('2024-12-25'), 'holiday message', data);
```

### Recurring

```typescript
// Every interval
await agenda.every('5 minutes', 'health check');

// Cron syntax
await agenda.every('0 9 * * *', 'daily report');

// With timezone
await agenda.every('0 9 * * *', 'daily report', {}, {
  timezone: 'America/New_York',
});

// Skip days
await agenda.every('0 9 * * *', 'weekday task', {}, {
  skipDays: 'Saturday,Sunday',
});
```

## Creating Jobs

```typescript
const job = agenda.create('send email', {
  to: 'user@example.com',
  subject: 'Hello',
});

// Chain methods
job
  .priority('high')
  .schedule('in 10 minutes')
  .repeatEvery('1 day');

// Save the job
await job.save();
```

## Job Priorities

```typescript
// Named priorities
job.priority('lowest');  // -20
job.priority('low');     // -10
job.priority('normal');  // 0
job.priority('high');    // 10
job.priority('highest'); // 20

// Numeric priorities
job.priority(15);
```

## Repeating Jobs

```typescript
// Repeat every interval
job.repeatEvery('30 minutes');

// With options
job.repeatEvery('1 hour', {
  timezone: 'America/New_York',
  skipDays: 'Saturday,Sunday',
});

// Cron syntax
job.repeatAt('0 9 * * *');
```

## Job Events

```typescript
// Global events
agenda.on('ready', () => console.log('Agenda ready'));
agenda.on('start', (job) => console.log('Job starting:', job.attrs.name));
agenda.on('complete', (job) => console.log('Job complete:', job.attrs.name));
agenda.on('success', (job) => console.log('Job succeeded:', job.attrs.name));
agenda.on('fail', (error, job) => console.log('Job failed:', error));

// Job-specific events
agenda.on('start:send email', (job) => {
  console.log('Email job starting');
});

agenda.on('complete:send email', (job) => {
  console.log('Email job complete');
});
```

## Job Management

### Get Jobs

```typescript
// Get all jobs
const jobs = await agenda.jobs();

// Query jobs
const emailJobs = await agenda.jobs({ name: 'send email' });

// With limit
const recentJobs = await agenda.jobs({}, {}, 10);
```

### Cancel Jobs

```typescript
// Cancel by name
await agenda.cancel({ name: 'send email' });

// Cancel by query
await agenda.cancel({ data: { userId: '123' } });
```

### Unique Jobs

```typescript
// Only one instance of this job will exist
const job = agenda.create('unique job', data);
job.unique({ userId: '123' });
await job.save();
```

## Configuration

```typescript
const agenda = new Agenda({
  db: {
    address: 'mongodb://localhost/agenda',
    collection: 'jobs',
  },
  processEvery: '30 seconds',
  maxConcurrency: 20,
  defaultConcurrency: 5,
  lockLimit: 0,
  defaultLockLimit: 0,
  defaultLockLifetime: 10 * 60 * 1000, // 10 minutes
});
```

## Complete Example

```typescript
import Agenda from '@elide/agenda-clone';

const agenda = new Agenda({
  db: { address: 'mongodb://localhost/agenda' },
});

// Define jobs
agenda.define('send email', async (job) => {
  const { to, subject, body } = job.attrs.data;
  console.log(`Sending email to ${to}`);
  await sendEmail(to, subject, body);
});

agenda.define('generate report', {
  concurrency: 2,
  priority: 'high',
}, async (job) => {
  console.log('Generating report...');
  const report = await generateReport(job.attrs.data);
  console.log('Report generated');
  return report;
});

// Start agenda
await agenda.start();

// Schedule jobs
await agenda.now('send email', {
  to: 'user@example.com',
  subject: 'Welcome',
  body: 'Welcome to our service!',
});

await agenda.every('1 day', 'generate report', {
  reportType: 'daily',
});

// Handle graceful shutdown
process.on('SIGTERM', async () => {
  await agenda.stop();
  process.exit(0);
});
```

## License

MIT
