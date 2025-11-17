# Node-Cron Clone - Elide Cron Scheduler

Production-ready cron job scheduler for Elide, providing a complete feature-compatible implementation of node-cron with full TypeScript support.

## Features

- **Cron Syntax** - Full cron expression support
- **Task Scheduling** - Schedule tasks with cron expressions
- **Task Management** - Start, stop, and destroy tasks
- **Timezone Support** - Schedule tasks in any timezone
- **TypeScript** - Full type safety and IntelliSense support
- **Lightweight** - No external dependencies

## Installation

```bash
npm install @elide/node-cron-clone
```

## Quick Start

```typescript
import cron from '@elide/node-cron-clone';

// Schedule a task that runs every minute
const task = cron.schedule('* * * * *', () => {
  console.log('Running task every minute');
});

// Stop the task
task.stop();

// Restart the task
task.start();
```

## Cron Expression Format

```
*    *    *    *    *
┬    ┬    ┬    ┬    ┬
│    │    │    │    │
│    │    │    │    └─── Day of Week   (0-7, 0 and 7 are Sunday)
│    │    │    └──────── Month         (1-12)
│    │    └───────────── Day of Month  (1-31)
│    └────────────────── Hour          (0-23)
└─────────────────────── Minute        (0-59)
```

## Basic Usage

### Every Minute

```typescript
cron.schedule('* * * * *', () => {
  console.log('Runs every minute');
});
```

### Every Hour

```typescript
cron.schedule('0 * * * *', () => {
  console.log('Runs at minute 0 of every hour');
});
```

### Every Day at Midnight

```typescript
cron.schedule('0 0 * * *', () => {
  console.log('Runs at midnight every day');
});
```

### Every Monday at 9 AM

```typescript
cron.schedule('0 9 * * 1', () => {
  console.log('Runs every Monday at 9:00 AM');
});
```

### First Day of Every Month

```typescript
cron.schedule('0 0 1 * *', () => {
  console.log('Runs at midnight on the 1st of every month');
});
```

## Advanced Expressions

### Ranges

```typescript
// Every 15 minutes
cron.schedule('*/15 * * * *', () => {
  console.log('Runs every 15 minutes');
});

// Every weekday at 9 AM
cron.schedule('0 9 * * 1-5', () => {
  console.log('Runs Monday through Friday at 9:00 AM');
});
```

### Multiple Values

```typescript
// At 9 AM and 5 PM
cron.schedule('0 9,17 * * *', () => {
  console.log('Runs at 9 AM and 5 PM');
});

// Every Monday and Friday
cron.schedule('0 9 * * 1,5', () => {
  console.log('Runs every Monday and Friday at 9 AM');
});
```

### Steps

```typescript
// Every 2 hours
cron.schedule('0 */2 * * *', () => {
  console.log('Runs every 2 hours');
});

// Every 5 minutes
cron.schedule('*/5 * * * *', () => {
  console.log('Runs every 5 minutes');
});
```

## Scheduling Options

### Don't Start Immediately

```typescript
const task = cron.schedule('* * * * *', callback, {
  scheduled: false,
});

// Start later
task.start();
```

### Timezone

```typescript
cron.schedule('0 9 * * *', () => {
  console.log('9 AM in New York');
}, {
  timezone: 'America/New_York',
});
```

## Task Management

### Start/Stop Tasks

```typescript
const task = cron.schedule('* * * * *', () => {
  console.log('Running...');
});

// Stop the task
task.stop();

// Restart the task
task.start();
```

### Destroy Tasks

```typescript
const task = cron.schedule('* * * * *', callback);

// Stop and remove the task
task.destroy();
```

### Check Task Status

```typescript
const task = cron.schedule('* * * * *', callback);

console.log(task.getStatus()); // 'running' or 'stopped'
```

## Async Tasks

```typescript
cron.schedule('* * * * *', async () => {
  await doAsyncWork();
  console.log('Async work complete');
});
```

## Validation

```typescript
import { validate } from '@elide/node-cron-clone';

console.log(validate('* * * * *'));     // true
console.log(validate('invalid'));       // false
console.log(validate('0 0 31 2 *'));   // true (valid syntax)
```

## Get All Tasks

```typescript
import { getTasks } from '@elide/node-cron-clone';

const task1 = cron.schedule('* * * * *', callback1);
const task2 = cron.schedule('0 * * * *', callback2);

const tasks = getTasks();
console.log(`Active tasks: ${tasks.size}`);

// Stop all tasks
for (const task of tasks.values()) {
  task.stop();
}
```

## Common Patterns

### Daily Backup at 2 AM

```typescript
cron.schedule('0 2 * * *', async () => {
  console.log('Starting daily backup...');
  await performBackup();
  console.log('Backup complete');
});
```

### Hourly Health Check

```typescript
cron.schedule('0 * * * *', async () => {
  const health = await checkHealth();
  console.log('Health status:', health);
});
```

### Weekly Report (Every Sunday at Midnight)

```typescript
cron.schedule('0 0 * * 0', async () => {
  const report = await generateWeeklyReport();
  await sendReport(report);
});
```

### Every 30 Seconds

```typescript
// Note: Cron supports minute-level precision
// For sub-minute intervals, use setInterval
setInterval(() => {
  console.log('Running every 30 seconds');
}, 30000);
```

## Complete Example

```typescript
import cron from '@elide/node-cron-clone';

// Morning greeting
const morningTask = cron.schedule('0 9 * * *', () => {
  console.log('Good morning! Time to start work.');
}, {
  timezone: 'America/New_York',
});

// Hourly reminder during work hours
const reminderTask = cron.schedule('0 9-17 * * 1-5', () => {
  console.log('Reminder: Take a break!');
});

// End of day summary
const summaryTask = cron.schedule('0 17 * * 1-5', async () => {
  const summary = await generateDailySummary();
  console.log('Daily summary:', summary);
});

// Cleanup on shutdown
process.on('SIGTERM', () => {
  morningTask.destroy();
  reminderTask.destroy();
  summaryTask.destroy();
  process.exit(0);
});
```

## Cron Expression Examples

```typescript
// Every minute
'* * * * *'

// Every 5 minutes
'*/5 * * * *'

// Every hour at minute 30
'30 * * * *'

// Every day at midnight
'0 0 * * *'

// Every day at 3:15 AM
'15 3 * * *'

// Every Monday at 9 AM
'0 9 * * 1'

// Every weekday at 9 AM
'0 9 * * 1-5'

// First day of every month at midnight
'0 0 1 * *'

// Every quarter (Jan, Apr, Jul, Oct) at midnight
'0 0 1 1,4,7,10 *'

// Every 2 hours
'0 */2 * * *'

// At 9:30 AM and 2:30 PM every day
'30 9,14 * * *'
```

## Testing

```bash
npm test
```

## License

MIT
