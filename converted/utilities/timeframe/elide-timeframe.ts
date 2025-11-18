/**
 * timeframe - Time Frame Utilities
 * Based on https://www.npmjs.com/package/timeframe (~100K downloads/week)
 */

interface TimeFrame {
  start: Date;
  end: Date;
}

function createTimeFrame(start: Date, end: Date): TimeFrame {
  return { start, end };
}

function contains(timeframe: TimeFrame, date: Date): boolean {
  return date >= timeframe.start && date <= timeframe.end;
}

function overlaps(tf1: TimeFrame, tf2: TimeFrame): boolean {
  return tf1.start <= tf2.end && tf1.end >= tf2.start;
}

function duration(timeframe: TimeFrame): number {
  return timeframe.end.getTime() - timeframe.start.getTime();
}

function shift(timeframe: TimeFrame, milliseconds: number): TimeFrame {
  return {
    start: new Date(timeframe.start.getTime() + milliseconds),
    end: new Date(timeframe.end.getTime() + milliseconds)
  };
}

function expand(timeframe: TimeFrame, milliseconds: number): TimeFrame {
  return {
    start: new Date(timeframe.start.getTime() - milliseconds),
    end: new Date(timeframe.end.getTime() + milliseconds)
  };
}

function intersection(tf1: TimeFrame, tf2: TimeFrame): TimeFrame | null {
  const start = new Date(Math.max(tf1.start.getTime(), tf2.start.getTime()));
  const end = new Date(Math.min(tf1.end.getTime(), tf2.end.getTime()));

  return start <= end ? { start, end } : null;
}

const timeframe = {
  create: createTimeFrame,
  contains,
  overlaps,
  duration,
  shift,
  expand,
  intersection
};

export default timeframe;

if (import.meta.url.includes("elide-timeframe.ts")) {
  console.log("✅ timeframe - Time Frame Utilities (POLYGLOT!)\n");

  const tf1 = timeframe.create(
    new Date('2025-11-18T10:00:00'),
    new Date('2025-11-18T12:00:00')
  );

  const tf2 = timeframe.create(
    new Date('2025-11-18T11:00:00'),
    new Date('2025-11-18T13:00:00')
  );

  console.log('Overlaps:', timeframe.overlaps(tf1, tf2));
  console.log('Duration (tf1):', timeframe.duration(tf1) / (1000 * 60), 'minutes');
  console.log('Contains 11:30:', timeframe.contains(tf1, new Date('2025-11-18T11:30:00')));

  const intersection = timeframe.intersection(tf1, tf2);
  if (intersection) {
    console.log('Intersection:', intersection.start.toTimeString(), '-', intersection.end.toTimeString());
  }

  console.log("\n🚀 ~100K downloads/week | Time frame utilities\n");
}
