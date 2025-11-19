/**
 * Scheduled and Repeatable Jobs Example
 */

import { createQueue } from '../src';

async function main() {
  const queue = createQueue('scheduled-jobs');

  // Define processors
  queue.process('send-reminder', async (job) => {
    console.log(`\n[${new Date().toISOString()}] Sending reminder:`, job.data);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { sent: true, to: job.data.email };
  });

  queue.process('generate-report', async (job) => {
    console.log(`\n[${new Date().toISOString()}] Generating ${job.data.type} report...`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    return { report: 'data', type: job.data.type };
  });

  queue.process('cleanup', async (job) => {
    console.log(`\n[${new Date().toISOString()}] Running cleanup...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { cleaned: true, items: Math.floor(Math.random() * 100) };
  });

  // Listen to events
  queue.on('completed', (job, result) => {
    console.log(`Job ${job.name} completed:`, result);
  });

  // Example 1: Delayed job (runs once after delay)
  console.log('\n=== Scheduling delayed job (10 seconds) ===');
  await queue.add('send-reminder', {
    email: 'user@example.com',
    message: 'Meeting in 10 minutes',
  }, {
    delay: 10000,
  });

  // Example 2: Repeatable job (every 30 seconds)
  console.log('\n=== Scheduling repeatable job (every 30 seconds) ===');
  await queue.add('cleanup', {}, {
    repeat: {
      every: 30000,
    },
  });

  // Example 3: Cron-based job (every minute)
  console.log('\n=== Scheduling cron job (every minute) ===');
  await queue.add('generate-report', {
    type: 'hourly',
  }, {
    repeat: {
      cron: '* * * * *',
    },
  });

  // Example 4: Priority delayed job
  console.log('\n=== Scheduling high-priority delayed job ===');
  await queue.add('send-reminder', {
    email: 'vip@example.com',
    message: 'Important meeting alert',
  }, {
    delay: 5000,
    priority: 10,
  });

  // Example 5: Job with expiration
  console.log('\n=== Scheduling job that expires ===');
  await queue.add('send-reminder', {
    email: 'temp@example.com',
    message: 'This will timeout',
  }, {
    delay: 2000,
    timeout: 100, // Will timeout if processing takes more than 100ms
  });

  // Get job counts
  const counts = await queue.getJobCounts();
  console.log('\nJob counts:', counts);

  // Get repeatable jobs
  const repeatableJobs = await queue.getRepeatableJobs();
  console.log('\nRepeatable jobs:', repeatableJobs.length);

  // Keep running for 2 minutes
  console.log('\nQueue running for 2 minutes...');
  setTimeout(async () => {
    console.log('\nShutting down...');

    const finalCounts = await queue.getJobCounts();
    console.log('Final job counts:', finalCounts);

    await queue.close();
    process.exit(0);
  }, 120000);
}

main().catch(console.error);
