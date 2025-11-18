/**
 * parse-duration - Parse Duration Strings
 * Based on https://www.npmjs.com/package/parse-duration (~2M downloads/week)
 */

const units: Record<string, number> = {
  'nanosecond': 0.000001,
  'nanoseconds': 0.000001,
  'ns': 0.000001,
  'microsecond': 0.001,
  'microseconds': 0.001,
  'μs': 0.001,
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

function parseDuration(str: string): number | null {
  if (typeof str !== 'string' || str.length === 0) {
    return null;
  }

  const normalized = str.toLowerCase().trim();
  const matches = normalized.match(/(\d+(?:\.\d+)?)\s*([a-zμ]+)/g);

  if (!matches) {
    const num = parseFloat(normalized);
    return isNaN(num) ? null : num;
  }

  let total = 0;

  for (const match of matches) {
    const parts = match.match(/(\d+(?:\.\d+)?)\s*([a-zμ]+)/);
    if (!parts) continue;

    const value = parseFloat(parts[1]);
    const unit = parts[2];
    const multiplier = units[unit];

    if (multiplier === undefined) {
      return null;
    }

    total += value * multiplier;
  }

  return total;
}

export default parseDuration;

if (import.meta.url.includes("elide-parse-duration.ts")) {
  console.log("✅ parse-duration - Parse Duration Strings (POLYGLOT!)\n");

  console.log('5 seconds:', parseDuration('5 seconds'), 'ms');
  console.log('2 hours:', parseDuration('2 hours'), 'ms');
  console.log('1 day:', parseDuration('1 day'), 'ms');
  console.log('1h 30m:', parseDuration('1h 30m'), 'ms');
  console.log('3 weeks:', parseDuration('3 weeks'), 'ms');

  console.log("\n🚀 ~2M downloads/week | Parse duration strings\n");
}
