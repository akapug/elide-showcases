/**
 * Basic Bull Queue Example
 */

import { createQueue } from '../src';

async function main() {
  const queue = createQueue('example-queue');

  // Process jobs
  queue.process(async (job) => {
    console.log('Processing job:', job.id);
    console.log('Data:', job.data);

    // Simulate work
    await new Promise(resolve => setTimeout(resolve, 1000));

    return { processed: true, jobId: job.id };
  });

  // Listen to events
  queue.on('completed', (job, result) => {
    console.log('Job completed:', job.id, result);
  });

  // Add jobs
  for (let i = 0; i < 10; i++) {
    await queue.add({
      task: `Task ${i}`,
      timestamp: Date.now(),
    });
  }

  console.log('Added 10 jobs to queue');
}

main().catch(console.error);
