/**
 * Advanced Cron Example
 */

import cron from '../src';

// Create task but don't start immediately
const task = cron.schedule('* * * * *', () => {
  console.log('Scheduled task running');
}, {
  scheduled: false,
});

console.log('Task created but not started');

// Start after 5 seconds
setTimeout(() => {
  console.log('Starting task...');
  task.start();
}, 5000);

// Stop after 30 seconds
setTimeout(() => {
  console.log('Stopping task...');
  task.stop();
}, 30000);

// Restart after 35 seconds
setTimeout(() => {
  console.log('Restarting task...');
  task.start();
}, 35000);

// Destroy after 60 seconds
setTimeout(() => {
  console.log('Destroying task...');
  task.destroy();
}, 60000);
