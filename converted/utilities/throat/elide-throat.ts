/**
 * Throat - Promise Concurrency Limiter
 *
 * Limit promise concurrency with a semaphore.
 * **POLYGLOT SHOWCASE**: One concurrency limiter for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/throat (~200K+ downloads/week)
 *
 * Features:
 * - Concurrency limiting
 * - Promise queue management
 * - Semaphore pattern
 * - TypeScript support
 *
 * Package has ~200K+ downloads/week on npm!
 */

export function throat<T extends (...args: any[]) => Promise<any>>(
  limit: number,
  fn?: T
): T {
  const queue: Array<() => void> = [];
  let running = 0;

  function run<R>(fn: () => Promise<R>): Promise<R> {
    return new Promise((resolve, reject) => {
      function exec() {
        running++;
        fn()
          .then(resolve)
          .catch(reject)
          .finally(() => {
            running--;
            if (queue.length > 0) {
              const next = queue.shift()!;
              next();
            }
          });
      }

      if (running < limit) {
        exec();
      } else {
        queue.push(exec);
      }
    });
  }

  if (fn) {
    return ((...args: any[]) => run(() => fn(...args))) as T;
  }

  return run as any;
}

export default throat;

// CLI Demo
if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("🎯 Throat - Promise Concurrency Limiter (POLYGLOT!)\n");

  console.log("=== Example 1: Limit Concurrent Promises ===");
  const limiter = throat(2);

  async function task(id: number): Promise<void> {
    console.log(`Task ${id} started`);
    await new Promise(resolve => setTimeout(resolve, 1000));
    console.log(`Task ${id} completed`);
  }

  const promises = [1, 2, 3, 4, 5].map(id =>
    limiter(() => task(id))
  );

  await Promise.all(promises);

  console.log("\n=== Example 2: Wrap Function ===");
  const limitedFetch = throat(3, async (url: string) => {
    console.log(`Fetching: ${url}`);
    await new Promise(resolve => setTimeout(resolve, 500));
    return { url, data: "..." };
  });

  const urls = ["url1", "url2", "url3", "url4"];
  const results = await Promise.all(urls.map(limitedFetch));
  console.log(`Fetched ${results.length} URLs`);

  console.log("\n✅ Concurrency limiting for promises!");
}
