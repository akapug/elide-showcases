/**
 * Run Series - Series Task Execution
 *
 * Run async tasks in series (one after another).
 * **POLYGLOT SHOWCASE**: One series runner for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/run-series (~500K+ downloads/week)
 */

type Task<T> = (callback: (error: Error | null, result?: T) => void) => void;

export function series<T>(
  tasks: Task<T>[],
  callback?: (error: Error | null, results?: T[]) => void
): void {
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
    task((error, result) => {
      if (error) {
        callback?.(error);
        return;
      }

      results.push(result!);
      runNext();
    });
  }

  runNext();
}

export default series;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("➡️  Run Series - Series Execution for Elide (POLYGLOT!)\n");

  const tasks = [
    (cb: any) => { console.log("Task 1"); setTimeout(() => cb(null, 1), 100); },
    (cb: any) => { console.log("Task 2"); setTimeout(() => cb(null, 2), 50); },
    (cb: any) => { console.log("Task 3"); setTimeout(() => cb(null, 3), 75); },
  ];

  console.log("Running 3 tasks in series...");
  series(tasks, (error, results) => {
    if (error) {
      console.error("Error:", error);
    } else {
      console.log("Results:", results);
      console.log("\n🌐 Works in all languages via Elide!");
      console.log("🚀 ~500K+ downloads/week on npm");
    }
  });
}
