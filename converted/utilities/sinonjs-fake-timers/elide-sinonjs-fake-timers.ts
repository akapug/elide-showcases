/**
 * Sinon Fake Timers - Fake Timers
 *
 * Sinon's fake timer implementation.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/@sinonjs/fake-timers (~10M+ downloads/week)
 *
 * Features:
 * - Fake timers
 * - Time control
 * - High precision
 * - Zero dependencies
 *
 * Package has ~10M+ downloads/week on npm!
 */

interface FakeClock {
  setTimeout: (callback: Function, delay: number) => number;
  clearTimeout: (id: number) => void;
  setInterval: (callback: Function, delay: number) => number;
  clearInterval: (id: number) => void;
  tick: (ms: number) => void;
  reset: () => void;
  restore: () => void;
}

class FakeTimers implements FakeClock {
  private timers: Map<number, any> = new Map();
  private currentTime: number = Date.now();
  private nextId: number = 1;

  setTimeout(callback: Function, delay: number): number {
    const id = this.nextId++;
    this.timers.set(id, { callback, executeAt: this.currentTime + delay, type: 'timeout' });
    return id;
  }

  clearTimeout(id: number): void {
    this.timers.delete(id);
  }

  setInterval(callback: Function, delay: number): number {
    const id = this.nextId++;
    this.timers.set(id, { callback, executeAt: this.currentTime + delay, delay, type: 'interval' });
    return id;
  }

  clearInterval(id: number): void {
    this.timers.delete(id);
  }

  tick(ms: number): void {
    this.currentTime += ms;
    for (const [id, timer] of this.timers) {
      if (timer.executeAt <= this.currentTime) {
        timer.callback();
        if (timer.type === 'timeout') {
          this.timers.delete(id);
        } else {
          timer.executeAt = this.currentTime + timer.delay;
        }
      }
    }
  }

  reset(): void {
    this.timers.clear();
  }

  restore(): void {
    this.timers.clear();
  }
}

export function install(): FakeClock {
  return new FakeTimers();
}

export function createClock(): FakeClock {
  return new FakeTimers();
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("⏱️  Sinon Fake Timers for Elide (POLYGLOT!)\n");
  
  const clock = install();
  clock.setTimeout(() => console.log("Timer executed!"), 1000);
  clock.tick(1000);
  clock.restore();
  
  console.log("\n✅ ~10M+ downloads/week on npm!");
}
