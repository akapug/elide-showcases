/**
 * FastSeries - Fast Series Execution
 *
 * Zero-overhead series execution for async tasks.
 * **POLYGLOT SHOWCASE**: One fast series for ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/fastseries (~100K+ downloads/week)
 */

export class FastSeries {
  private tasks: Array<(release: (err?: Error, result?: any) => void, arg?: any) => void> = [];
  private arg: any;
  private callback?: (err?: Error, result?: any) => void;

  constructor(arg?: any) {
    this.arg = arg;
  }

  push(task: (release: (err?: Error, result?: any) => void, arg?: any) => void): void {
    this.tasks.push(task);
  }

  run(callback?: (err?: Error, result?: any) => void): void {
    this.callback = callback;
    this.runNext(0);
  }

  private runNext(index: number, previousResult?: any): void {
    if (index >= this.tasks.length) {
      this.callback?.(undefined, previousResult);
      return;
    }

    const task = this.tasks[index];
    task((err, result) => {
      if (err) {
        this.callback?.(err);
        return;
      }
      this.runNext(index + 1, result);
    }, previousResult !== undefined ? previousResult : this.arg);
  }
}

export default FastSeries;

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log("⚡ FastSeries - Fast Series for Elide (POLYGLOT!)\n");

  const series = new FastSeries();
  series.push((release, n) => { console.log("Step 1:", n); release(undefined, n * 2); });
  series.push((release, n) => { console.log("Step 2:", n); release(undefined, n + 5); });
  series.push((release, n) => { console.log("Step 3:", n); release(undefined, n); });

  series.run((err, result) => {
    console.log("Final:", result);
    console.log("\n🌐 Works in all languages via Elide!");
    console.log("🚀 ~100K+ downloads/week on npm");
  });
}
