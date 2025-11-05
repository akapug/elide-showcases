/**
 * Human-Readable Duration
 * Convert milliseconds to human-readable format
 */

export interface DurationParts {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  milliseconds?: number;
}

export function humanize(ms: number, options: { long?: boolean; round?: boolean } = {}): string {
  const { long = false, round = true } = options;

  if (ms < 0) return '-' + humanize(Math.abs(ms), options);
  if (ms === 0) return '0ms';

  const parts: string[] = [];

  const years = Math.floor(ms / (1000 * 60 * 60 * 24 * 365));
  if (years > 0) {
    parts.push(years + (long ? (years === 1 ? ' year' : ' years') : 'y'));
    ms -= years * 1000 * 60 * 60 * 24 * 365;
    if (round && years >= 1) return parts.join(' ');
  }

  const months = Math.floor(ms / (1000 * 60 * 60 * 24 * 30));
  if (months > 0) {
    parts.push(months + (long ? (months === 1 ? ' month' : ' months') : 'mo'));
    ms -= months * 1000 * 60 * 60 * 24 * 30;
    if (round && months >= 1) return parts.join(' ');
  }

  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days > 0) {
    parts.push(days + (long ? (days === 1 ? ' day' : ' days') : 'd'));
    ms -= days * 1000 * 60 * 60 * 24;
    if (round && days >= 1) return parts.join(' ');
  }

  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) {
    parts.push(hours + (long ? (hours === 1 ? ' hour' : ' hours') : 'h'));
    ms -= hours * 1000 * 60 * 60;
    if (round && hours >= 1) return parts.join(' ');
  }

  const minutes = Math.floor(ms / (1000 * 60));
  if (minutes > 0) {
    parts.push(minutes + (long ? (minutes === 1 ? ' minute' : ' minutes') : 'm'));
    ms -= minutes * 1000 * 60;
    if (round && minutes >= 1) return parts.join(' ');
  }

  const seconds = Math.floor(ms / 1000);
  if (seconds > 0) {
    parts.push(seconds + (long ? (seconds === 1 ? ' second' : ' seconds') : 's'));
    ms -= seconds * 1000;
  }

  if (ms > 0 || parts.length === 0) {
    parts.push(ms + (long ? (ms === 1 ? ' millisecond' : ' milliseconds') : 'ms'));
  }

  return parts.join(' ');
}

export function parse(str: string): number {
  let ms = 0;

  const matches = str.match(/(\d+(?:\.\d+)?)\s*([a-z]+)/gi) || [];

  for (const match of matches) {
    const value = parseFloat(match);
    const unit = match.replace(/[\d\s.]/g, '').toLowerCase();

    switch (unit) {
      case 'y':
      case 'year':
      case 'years':
        ms += value * 365 * 24 * 60 * 60 * 1000;
        break;
      case 'mo':
      case 'month':
      case 'months':
        ms += value * 30 * 24 * 60 * 60 * 1000;
        break;
      case 'w':
      case 'week':
      case 'weeks':
        ms += value * 7 * 24 * 60 * 60 * 1000;
        break;
      case 'd':
      case 'day':
      case 'days':
        ms += value * 24 * 60 * 60 * 1000;
        break;
      case 'h':
      case 'hour':
      case 'hours':
        ms += value * 60 * 60 * 1000;
        break;
      case 'm':
      case 'min':
      case 'minute':
      case 'minutes':
        ms += value * 60 * 1000;
        break;
      case 's':
      case 'sec':
      case 'second':
      case 'seconds':
        ms += value * 1000;
        break;
      case 'ms':
      case 'millisecond':
      case 'milliseconds':
        ms += value;
        break;
    }
  }

  return ms;
}

// CLI demo
if (import.meta.url.includes("human-duration.ts")) {
  console.log("Human Duration Demo\n");

  const durations = [
    1000,                         // 1 second
    60000,                        // 1 minute
    3600000,                      // 1 hour
    86400000,                     // 1 day
    604800000,                    // 1 week
    2592000000,                   // 1 month
    31536000000,                  // 1 year
    90061000,                     // 1d 1h 1m 1s
  ];

  console.log("Short format:");
  durations.forEach(ms => {
    console.log(`  ${ms}ms → ${humanize(ms)}`);
  });

  console.log("\nLong format:");
  console.log(`  ${durations[7]}ms → ${humanize(durations[7], { long: true, round: false })}`);

  console.log("\nParsing:");
  console.log(`  "2 days" → ${parse("2 days")}ms`);
  console.log(`  "1h 30m" → ${parse("1h 30m")}ms`);
  console.log(`  "5 minutes" → ${parse("5 minutes")}ms`);

  console.log("✅ Human duration test passed");
}
