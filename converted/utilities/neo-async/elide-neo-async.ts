/**
 * Neo-Async - Async Utilities
 *
 * Fast async control flow library.
 * **POLYGLOT SHOWCASE**: One async library for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/neo-async (~500K+ downloads/week)
 */

export const async = {
  each: <T>(array: T[], iterator: (item: T, callback: (err?: Error) => void) => void, callback?: (err?: Error) => void) => {
    let completed = 0;
    let hasError = false;

    if (array.length === 0) {
      callback?.();
      return;
    }

    array.forEach(item => {
      iterator(item, (err) => {
        if (hasError) return;
        if (err) {
          hasError = true;
          callback?.(err);
          return;
        }
        completed++;
        if (completed === array.length) {
          callback?.();
        }
      });
    });
  },

  map: <T, U>(array: T[], iterator: (item: T, callback: (err: Error | null, result?: U) => void) => void, callback?: (err: Error | null, results?: U[]) => void) => {
    const results: U[] = [];
    let completed = 0;
    let hasError = false;

    if (array.length === 0) {
      callback?.(null, []);
      return;
    }

    array.forEach((item, index) => {
      iterator(item, (err, result) => {
        if (hasError) return;
        if (err) {
          hasError = true;
          callback?.(err);
          return;
        }
        results[index] = result!;
        completed++;
        if (completed === array.length) {
          callback?.(null, results);
        }
      });
    });
  },

  series: <T>(tasks: Array<(callback: (err: Error | null, result?: T) => void) => void>, callback?: (err: Error | null, results?: T[]) => void) => {
    const results: T[] = [];
    let currentIndex = 0;

    if (tasks.length === 0) {
      callback?.(null, []);
      return;
    }

    function runNext(): void {
      if (currentIndex >= tasks.length) {
        callback?.(null, results);
        return;
      }

      const task = tasks[currentIndex++];
      task((err, result) => {
        if (err) {
          callback?.(err);
          return;
        }
        results.push(result!);
        runNext();
      });
    }

    runNext();
  },

  parallel: <T>(tasks: Array<(callback: (err: Error | null, result?: T) => void) => void>, callback?: (err: Error | null, results?: T[]) => void) => {
    const results: T[] = [];
    let completed = 0;
    let hasError = false;

    if (tasks.length === 0) {
      callback?.(null, []);
      return;
    }

    tasks.forEach((task, index) => {
      task((err, result) => {
        if (hasError) return;
        if (err) {
          hasError = true;
          callback?.(err);
          return;
        }
        results[index] = result!;
        completed++;
        if (completed === tasks.length) {
          callback?.(null, results);
        }
      });
    });
  },
};

export default async;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ Neo-Async - Async Utilities for Elide (POLYGLOT!)\n");

  async.parallel([
    (cb: any) => setTimeout(() => cb(null, 1), 100),
    (cb: any) => setTimeout(() => cb(null, 2), 50),
  ], (err, results) => {
    console.log("Parallel results:", results);
    console.log("\n🌐 Works in all languages via Elide!");
    console.log("🚀 ~500K+ downloads/week on npm");
  });
}
