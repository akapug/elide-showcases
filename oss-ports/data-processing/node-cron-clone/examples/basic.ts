/**
 * Basic Cron Example
 */

import cron from '../src';

// Run every minute
const task1 = cron.schedule('* * * * *', () => {
  console.log('Task 1: Running every minute');
});

// Run every 5 minutes
const task2 = cron.schedule('*/5 * * * *', () => {
  console.log('Task 2: Running every 5 minutes');
});

// Run every hour
const task3 = cron.schedule('0 * * * *', () => {
  console.log('Task 3: Running every hour');
});

// Async task
const task4 = cron.schedule('*/2 * * * *', async () => {
  console.log('Task 4: Starting async work...');
  await new Promise(resolve => setTimeout(resolve, 1000));
  console.log('Task 4: Async work complete');
});

console.log('Cron tasks started');

// Stop after 10 minutes
setTimeout(() => {
  console.log('Stopping all tasks...');
  task1.destroy();
  task2.destroy();
  task3.destroy();
  task4.destroy();
}, 600000);
