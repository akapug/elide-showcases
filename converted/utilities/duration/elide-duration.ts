/**
 * duration - Duration Utilities
 * Based on https://www.npmjs.com/package/duration (~2M downloads/week)
 */

class Duration {
  private milliseconds: number;

  constructor(ms: number) {
    this.milliseconds = ms;
  }

  static fromMilliseconds(ms: number): Duration {
    return new Duration(ms);
  }

  static fromSeconds(s: number): Duration {
    return new Duration(s * 1000);
  }

  static fromMinutes(m: number): Duration {
    return new Duration(m * 60 * 1000);
  }

  static fromHours(h: number): Duration {
    return new Duration(h * 60 * 60 * 1000);
  }

  static fromDays(d: number): Duration {
    return new Duration(d * 24 * 60 * 60 * 1000);
  }

  static between(start: Date, end: Date): Duration {
    return new Duration(end.getTime() - start.getTime());
  }

  toMilliseconds(): number {
    return this.milliseconds;
  }

  toSeconds(): number {
    return this.milliseconds / 1000;
  }

  toMinutes(): number {
    return this.milliseconds / (60 * 1000);
  }

  toHours(): number {
    return this.milliseconds / (60 * 60 * 1000);
  }

  toDays(): number {
    return this.milliseconds / (24 * 60 * 60 * 1000);
  }

  add(other: Duration): Duration {
    return new Duration(this.milliseconds + other.milliseconds);
  }

  subtract(other: Duration): Duration {
    return new Duration(this.milliseconds - other.milliseconds);
  }

  toString(): string {
    const days = Math.floor(this.toDays());
    const hours = Math.floor(this.toHours() % 24);
    const minutes = Math.floor(this.toMinutes() % 60);
    const seconds = Math.floor(this.toSeconds() % 60);

    const parts: string[] = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (seconds > 0) parts.push(`${seconds}s`);

    return parts.join(' ') || '0s';
  }
}

export default Duration;

if (import.meta.url.includes("elide-duration.ts")) {
  console.log("✅ duration - Duration Utilities (POLYGLOT!)\n");

  const d1 = Duration.fromHours(2.5);
  console.log('2.5 hours:', d1.toString());
  console.log('In minutes:', d1.toMinutes());

  const d2 = Duration.fromDays(1);
  const total = d1.add(d2);
  console.log('2.5 hours + 1 day:', total.toString());

  const start = new Date('2025-11-18T10:00:00');
  const end = new Date('2025-11-18T15:30:00');
  const diff = Duration.between(start, end);
  console.log('Time between:', diff.toString());

  console.log("\n🚀 ~2M downloads/week | Duration utilities\n");
}
