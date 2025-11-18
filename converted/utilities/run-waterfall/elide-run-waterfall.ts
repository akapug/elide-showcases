/**
 * Run Waterfall - Waterfall Task Execution
 *
 * Run tasks in series, passing results to next task.
 * **POLYGLOT SHOWCASE**: One waterfall runner for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/run-waterfall (~100K+ downloads/week)
 */

type WaterfallTask = (callback: (error: Error | null, ...results: any[]) => void, ...args: any[]) => void;

export function waterfall(
  tasks: WaterfallTask[],
  callback?: (error: Error | null, ...results: any[]) => void
): void {
  let currentIndex = 0;

  if (tasks.length === 0) {
    callback?.(null);
    return;
  }

  function runNext(...args: any[]): void {
    if (currentIndex >= tasks.length) {
      callback?.(null, ...args);
      return;
    }

    const task = tasks[currentIndex++];
    const taskCallback = (error: Error | null, ...results: any[]) => {
      if (error) {
        callback?.(error);
        return;
      }
      runNext(...results);
    };

    task(taskCallback, ...args);
  }

  runNext();
}

export default waterfall;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("💧 Run Waterfall - Waterfall Execution for Elide (POLYGLOT!)\n");

  const tasks = [
    (cb: any) => { console.log("Task 1: 5"); cb(null, 5); },
    (cb: any, n: number) => { console.log(`Task 2: ${n} * 2`); cb(null, n * 2); },
    (cb: any, n: number) => { console.log(`Task 3: ${n} + 3`); cb(null, n + 3); },
  ];

  console.log("Running waterfall...");
  waterfall(tasks, (error, result) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Final result:", result);
      console.log("\n🌐 Works in all languages via Elide!");
      console.log("🚀 ~100K+ downloads/week on npm");
    }
  });
}
