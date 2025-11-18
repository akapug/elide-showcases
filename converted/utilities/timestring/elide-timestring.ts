/**
 * timestring - Parse Time Strings to Seconds
 * Based on https://www.npmjs.com/package/timestring (~500K downloads/week)
 */

const unitMap: Record<string, number> = {
  'ms': 0.001,
  'millisecond': 0.001,
  'milliseconds': 0.001,
  's': 1,
  'sec': 1,
  'second': 1,
  'seconds': 1,
  'm': 60,
  'min': 60,
  'minute': 60,
  'minutes': 60,
  'h': 3600,
  'hr': 3600,
  'hour': 3600,
  'hours': 3600,
  'd': 86400,
  'day': 86400,
  'days': 86400,
  'w': 604800,
  'week': 604800,
  'weeks': 604800,
  'mon': 2592000,
  'month': 2592000,
  'months': 2592000,
  'y': 31536000,
  'yr': 31536000,
  'year': 31536000,
  'years': 31536000
};

function timestring(str: string, returnUnit: string = 's'): number {
  const normalized = str.toLowerCase().trim();
  const matches = normalized.match(/(\d+(?:\.\d+)?)\s*([a-z]+)/g);

  if (!matches) {
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  let totalSeconds = 0;

  for (const match of matches) {
    const parts = match.match(/(\d+(?:\.\d+)?)\s*([a-z]+)/);
    if (!parts) continue;

    const value = parseFloat(parts[1]);
    const unit = parts[2];
    const multiplier = unitMap[unit];

    if (multiplier === undefined) continue;

    totalSeconds += value * multiplier;
  }

  const returnMultiplier = unitMap[returnUnit] || 1;
  return totalSeconds / returnMultiplier;
}

export default timestring;

if (import.meta.url.includes("elide-timestring.ts")) {
  console.log("✅ timestring - Parse Time Strings (POLYGLOT!)\n");

  console.log('5 minutes (seconds):', timestring('5 minutes'));
  console.log('1 hour (minutes):', timestring('1 hour', 'm'));
  console.log('2 days (hours):', timestring('2 days', 'h'));
  console.log('1h 30m (seconds):', timestring('1h 30m'));
  console.log('1 week (days):', timestring('1 week', 'd'));

  console.log("\n🚀 ~500K downloads/week | Parse time strings\n");
}
