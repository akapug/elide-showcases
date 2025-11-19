/**
 * Job Retries Example with Different Backoff Strategies
 */

import { createQueue } from '../src';

async function main() {
  const queue = createQueue('retry-example');

  // Define a job that sometimes fails
  let attemptCount = 0;

  queue.process('flaky-job', async (job) => {
    attemptCount++;
    console.log(`\nAttempt ${attemptCount} for job ${job.id}`);
    console.log(`Job attempt: ${job.attemptsMade + 1}`);

    // Simulate 70% failure rate
    if (Math.random() < 0.7) {
      throw new Error('Simulated failure');
    }

    console.log('Job succeeded!');
    return { success: true, attempts: attemptCount };
  });

  // Listen to events
  queue.on('failed', (job, error) => {
    console.log(`Job ${job.id} failed: ${error.message}`);
    console.log(`Failed ${job.attemptsMade} times`);

    if (job.attemptsMade < (job.opts.attempts || 1)) {
      console.log('Will retry...');
    } else {
      console.log('Max attempts reached - job permanently failed');
    }
  });

  queue.on('completed', (job, result) => {
    console.log(`\nJob ${job.id} completed successfully!`);
    console.log(`Result:`, result);
  });

  // Example 1: Fixed backoff
  console.log('\n=== Example 1: Fixed Backoff ===');
  await queue.add('flaky-job', { example: 1 }, {
    attempts: 5,
    backoff: {
      type: 'fixed',
      delay: 1000,
    },
  });

  await new Promise(resolve => setTimeout(resolve, 8000));

  // Example 2: Exponential backoff
  console.log('\n=== Example 2: Exponential Backoff ===');
  attemptCount = 0;

  await queue.add('flaky-job', { example: 2 }, {
    attempts: 5,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
  });

  await new Promise(resolve => setTimeout(resolve, 20000));

  // Example 3: No retries
  console.log('\n=== Example 3: No Retries ===');
  attemptCount = 0;

  await queue.add('flaky-job', { example: 3 }, {
    attempts: 1,
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  await queue.close();
}

main().catch(console.error);
