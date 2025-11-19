/**
 * Timezone Support Example
 */

import cron from '../src';

console.log('=== Timezone Example ===\n');

// Task 1: Run at 9 AM New York time
const nyTask = cron.schedule('0 9 * * *', () => {
  const now = new Date();
  console.log(`[NY 9AM] Task executed at ${now.toISOString()}`);
  console.log(`  Local time: ${now.toLocaleString()}`);
}, {
  timezone: 'America/New_York',
});

console.log('Scheduled: Daily at 9 AM New York time');

// Task 2: Run at 9 AM London time
const londonTask = cron.schedule('0 9 * * *', () => {
  const now = new Date();
  console.log(`[London 9AM] Task executed at ${now.toISOString()}`);
  console.log(`  Local time: ${now.toLocaleString()}`);
}, {
  timezone: 'Europe/London',
});

console.log('Scheduled: Daily at 9 AM London time');

// Task 3: Run at 9 AM Tokyo time
const tokyoTask = cron.schedule('0 9 * * *', () => {
  const now = new Date();
  console.log(`[Tokyo 9AM] Task executed at ${now.toISOString()}`);
  console.log(`  Local time: ${now.toLocaleString()}`);
}, {
  timezone: 'Asia/Tokyo',
});

console.log('Scheduled: Daily at 9 AM Tokyo time');

// Task 4: Run every minute (UTC)
const utcTask = cron.schedule('* * * * *', () => {
  const now = new Date();
  console.log(`\n[UTC] Heartbeat at ${now.toUTCString()}`);
}, {
  timezone: 'UTC',
});

console.log('Scheduled: Every minute (UTC)');

// Display task statuses
console.log('\n=== Task Statuses ===');
console.log(`NY Task: ${nyTask.getStatus()}`);
console.log(`London Task: ${londonTask.getStatus()}`);
console.log(`Tokyo Task: ${tokyoTask.getStatus()}`);
console.log(`UTC Task: ${utcTask.getStatus()}`);

console.log('\nTasks are running. Press Ctrl+C to stop.\n');

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nStopping all tasks...');

  nyTask.destroy();
  londonTask.destroy();
  tokyoTask.destroy();
  utcTask.destroy();

  console.log('All tasks stopped');
  process.exit(0);
});
