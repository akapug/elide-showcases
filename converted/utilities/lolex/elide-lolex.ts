/**
 * Lolex - Timer Mocking
 *
 * Mock timers and time functions.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/lolex (~1M+ downloads/week)
 *
 * Features:
 * - Mock setTimeout/setInterval
 * - Control time flow
 * - Fake timers
 * - Zero dependencies
 *
 * Package has ~1M+ downloads/week on npm!
 */

class Clock {
  private timers: Map<number, any> = new Map();
  private now: number = Date.now();
  private nextId: number = 1;

  setTimeout(callback: Function, delay: number): number {
    const id = this.nextId++;
    this.timers.set(id, { callback, time: this.now + delay, type: 'timeout' });
    return id;
  }

  setInterval(callback: Function, delay: number): number {
    const id = this.nextId++;
    this.timers.set(id, { callback, time: this.now + delay, delay, type: 'interval' });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  tick(ms: number): void {
    this.now += ms;
    for (const [id, timer] of this.timers) {
      if (timer.time <= this.now) {
        timer.callback();
        if (timer.type === 'timeout') {
          this.timers.delete(id);
        } else {
          timer.time = this.now + timer.delay;
        }
      }
    }
  }

  reset(): void {
    this.timers.clear();
  }
}

export function install(): Clock {
  return new Clock();
}

export { Clock };

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("⏱️  Lolex - Timer Mocking for Elide (POLYGLOT!)\n");
  
  const clock = install();
  clock.setTimeout(() => console.log("Timer fired!"), 1000);
  clock.tick(1000);
  clock.reset();
  
  console.log("\n✅ ~1M+ downloads/week on npm!");
}
