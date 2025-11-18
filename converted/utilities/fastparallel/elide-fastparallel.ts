/**
 * FastParallel - Fast Parallel Execution
 *
 * Zero-overhead parallel execution for async tasks.
 * **POLYGLOT SHOWCASE**: One fast parallel for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/fastparallel (~100K+ downloads/week)
 */

export class FastParallel {
  private tasks: Array<(release: (err?: Error, result?: any) => void) => void> = [];
  private callback?: (err?: Error, results?: any[]) => void;

  push(task: (release: (err?: Error, result?: any) => void) => void): void {
    this.tasks.push(task);
  }

  run(callback?: (err?: Error, results?: any[]) => void): void {
    this.callback = callback;
    const results: any[] = [];
    let completed = 0;
    let hasError = false;

    if (this.tasks.length === 0) {
      callback?.(undefined, []);
      return;
    }

    this.tasks.forEach((task, index) => {
      task((err, result) => {
        if (hasError) return;
        if (err) {
          hasError = true;
          callback?.(err);
          return;
        }
        results[index] = result;
        completed++;
        if (completed === this.tasks.length) {
          callback?.(undefined, results);
        }
      });
    });
  }
}

export default FastParallel;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ FastParallel - Fast Parallel for Elide (POLYGLOT!)\n");

  const parallel = new FastParallel();
  parallel.push(release => setTimeout(() => { console.log("Task 1"); release(undefined, 1); }, 100));
  parallel.push(release => setTimeout(() => { console.log("Task 2"); release(undefined, 2); }, 50));
  parallel.push(release => setTimeout(() => { console.log("Task 3"); release(undefined, 3); }, 75));

  parallel.run((err, results) => {
    console.log("Results:", results);
    console.log("\n🌐 Works in all languages via Elide!");
    console.log("🚀 ~100K+ downloads/week on npm");
  });
}
