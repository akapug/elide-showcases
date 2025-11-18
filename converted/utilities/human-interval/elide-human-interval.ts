/**
 * human-interval - Human-Readable Intervals
 * Based on https://www.npmjs.com/package/human-interval (~1M downloads/week)
 */

const unitMap: Record<string, number> = {
  'millisecond': 1,
  'milliseconds': 1,
  'ms': 1,
  'second': 1000,
  'seconds': 1000,
  'sec': 1000,
  's': 1000,
  'minute': 60000,
  'minutes': 60000,
  'min': 60000,
  'm': 60000,
  'hour': 3600000,
  'hours': 3600000,
  'hr': 3600000,
  'h': 3600000,
  'day': 86400000,
  'days': 86400000,
  'd': 86400000,
  'week': 604800000,
  'weeks': 604800000,
  'wk': 604800000,
  'w': 604800000,
  'month': 2592000000,
  'months': 2592000000,
  'year': 31536000000,
  'years': 31536000000,
  'yr': 31536000000,
  'y': 31536000000
};

function humanInterval(str: string): number | null {
  if (typeof str !== 'string') {
    return null;
  }

  const normalized = str.toLowerCase().trim();

  // Handle special cases
  if (normalized === 'second') return 1000;
  if (normalized === 'minute') return 60000;
  if (normalized === 'hour') return 3600000;
  if (normalized === 'day') return 86400000;
  if (normalized === 'week') return 604800000;
  if (normalized === 'month') return 2592000000;
  if (normalized === 'year') return 31536000000;

  // Parse "3 days", "2 hours", etc.
  const match = normalized.match(/^(\d+(?:\.\d+)?)\s*([a-z]+)$/);
  if (match) {
    const value = parseFloat(match[1]);
    const unit = match[2];
    const multiplier = unitMap[unit];

    if (multiplier !== undefined) {
      return value * multiplier;
    }
  }

  // Try without number (defaults to 1)
  const multiplier = unitMap[normalized];
  if (multiplier !== undefined) {
    return multiplier;
  }

  return null;
}

export default humanInterval;

if (import.meta.url.includes("elide-human-interval.ts")) {
  console.log("✅ human-interval - Human-Readable Intervals (POLYGLOT!)\n");

  console.log('3 seconds:', humanInterval('3 seconds'), 'ms');
  console.log('5 minutes:', humanInterval('5 minutes'), 'ms');
  console.log('2 hours:', humanInterval('2 hours'), 'ms');
  console.log('1 day:', humanInterval('1 day'), 'ms');
  console.log('week:', humanInterval('week'), 'ms');

  console.log("\n🚀 ~1M downloads/week | Parse human-readable intervals\n");
}
