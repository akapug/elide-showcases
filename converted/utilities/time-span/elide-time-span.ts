/**
 * time-span - Time Span Measurement
 * Based on https://www.npmjs.com/package/time-span (~500K downloads/week)
 */

class TimeSpan {
  private startTime: number;
  private endTime?: number;

  constructor() {
    this.startTime = Date.now();
  }

  static start(): TimeSpan {
    return new TimeSpan();
  }

  end(): number {
    this.endTime = Date.now();
    return this.endTime - this.startTime;
  }

  elapsed(): number {
    const end = this.endTime || Date.now();
    return end - this.startTime;
  }

  seconds(): number {
    return this.elapsed() / 1000;
  }

  minutes(): number {
    return this.elapsed() / (1000 * 60);
  }

  hours(): number {
    return this.elapsed() / (1000 * 60 * 60);
  }

  toString(): string {
    const ms = this.elapsed();
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    if (ms < 3600000) return `${(ms / 60000).toFixed(2)}m`;
    return `${(ms / 3600000).toFixed(2)}h`;
  }
}

function timeSpan(): TimeSpan {
  return new TimeSpan();
}

export default timeSpan;

if (import.meta.url.includes("elide-time-span.ts")) {
  console.log("✅ time-span - Time Span Measurement (POLYGLOT!)\n");

  const span = timeSpan();

  // Simulate some work
  let sum = 0;
  for (let i = 0; i < 1000000; i++) {
    sum += i;
  }

  const elapsed = span.end();
  console.log('Operation took:', span.toString());
  console.log('In milliseconds:', elapsed);
  console.log('In seconds:', span.seconds().toFixed(3));

  console.log("\n🚀 ~500K downloads/week | Measure time spans\n");
}
