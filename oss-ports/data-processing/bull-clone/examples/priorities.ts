/**
 * Priority Queue Example
 */

import { createQueue } from '../src';

async function main() {
  const queue = createQueue('priority-queue');

  queue.process(async (job) => {
    console.log(`Processing [Priority ${job.opts.priority}]:`, job.data);
    await new Promise(resolve => setTimeout(resolve, 500));
  });

  // Add jobs with different priorities
  await queue.add({ task: 'Low priority' }, { priority: 1 });
  await queue.add({ task: 'High priority' }, { priority: 10 });
  await queue.add({ task: 'Medium priority' }, { priority: 5 });
  await queue.add({ task: 'Urgent' }, { priority: 20 });

  console.log('Jobs will be processed by priority (20, 10, 5, 1)');
}

main().catch(console.error);
