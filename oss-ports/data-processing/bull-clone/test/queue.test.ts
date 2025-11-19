/**
 * Queue Tests
 */

import { createQueue } from '../src';

describe('Queue', () => {
  let queue: any;

  beforeEach(() => {
    queue = createQueue('test-queue');
  });

  afterEach(async () => {
    await queue.close();
  });

  test('should add and process jobs', async () => {
    const results: any[] = [];

    queue.process(async (job: any) => {
      results.push(job.data);
      return { done: true };
    });

    await queue.add({ value: 1 });
    await queue.add({ value: 2 });

    await new Promise(resolve => setTimeout(resolve, 500));

    expect(results.length).toBe(2);
    expect(results[0].value).toBe(1);
    expect(results[1].value).toBe(2);
  });

  test('should handle job priorities', async () => {
    await queue.add({ priority: 1 }, { priority: 1 });
    await queue.add({ priority: 10 }, { priority: 10 });
    await queue.add({ priority: 5 }, { priority: 5 });

    const waiting = await queue.getWaiting();

    expect(waiting[0].opts.priority).toBe(10);
    expect(waiting[1].opts.priority).toBe(5);
    expect(waiting[2].opts.priority).toBe(1);
  });

  test('should get job counts', async () => {
    await queue.add({ test: 1 });
    await queue.add({ test: 2 });

    const counts = await queue.getJobCounts();

    expect(counts.waiting).toBe(2);
  });
});
