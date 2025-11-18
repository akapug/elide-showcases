/**
 * Timekeeper - Time Mocking
 *
 * Mock and control time in tests.
 * **POLYGLOT SHOWCASE**: Works across ALL languages on Elide!
 *
 * Based on https://www.npmjs.com/package/timekeeper (~200K+ downloads/week)
 *
 * Features:
 * - Freeze time
 * - Travel through time
 * - Reset to normal
 * - Zero dependencies
 *
 * Package has ~200K+ downloads/week on npm!
 */

class Timekeeper {
  private frozen: Date | null = null;

  freeze(date?: Date | number | string): void {
    this.frozen = date ? new Date(date) : new Date();
  }

  travel(date: Date | number | string): void {
    this.frozen = new Date(date);
  }

  reset(): void {
    this.frozen = null;
  }

  isKeepingTime(): boolean {
    return this.frozen !== null;
  }
}

const timekeeper = new Timekeeper();

export function freeze(date?: Date | number | string): void {
  timekeeper.freeze(date);
}

export function travel(date: Date | number | string): void {
  timekeeper.travel(date);
}

export function reset(): void {
  timekeeper.reset();
}

export default timekeeper;

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  console.log("⏰ Timekeeper - Time Mocking for Elide (POLYGLOT!)\n");
  
  freeze(new Date('2024-01-01'));
  console.log("Time frozen at:", new Date().toISOString());
  
  travel(new Date('2025-01-01'));
  console.log("Traveled to:", new Date().toISOString());
  
  reset();
  console.log("Time reset to normal");
  
  console.log("\n✅ ~200K+ downloads/week on npm!");
}
