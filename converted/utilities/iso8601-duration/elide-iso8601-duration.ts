/**
 * iso8601-duration - ISO 8601 Duration Parsing
 * Based on https://www.npmjs.com/package/iso8601-duration (~3M downloads/week)
 */

interface Duration {
  years?: number;
  months?: number;
  weeks?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
}

const durationRegex = /^P(?:(\d+)Y)?(?:(\d+)M)?(?:(\d+)W)?(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+(?:\.\d+)?)S)?)?$/;

function parse(durationString: string): Duration | null {
  const match = durationString.match(durationRegex);

  if (!match) {
    return null;
  }

  const [, years, months, weeks, days, hours, minutes, seconds] = match;

  return {
    years: years ? parseInt(years) : undefined,
    months: months ? parseInt(months) : undefined,
    weeks: weeks ? parseInt(weeks) : undefined,
    days: days ? parseInt(days) : undefined,
    hours: hours ? parseInt(hours) : undefined,
    minutes: minutes ? parseInt(minutes) : undefined,
    seconds: seconds ? parseFloat(seconds) : undefined
  };
}

function toSeconds(duration: Duration): number {
  const yearsInSeconds = (duration.years || 0) * 365 * 24 * 3600;
  const monthsInSeconds = (duration.months || 0) * 30 * 24 * 3600;
  const weeksInSeconds = (duration.weeks || 0) * 7 * 24 * 3600;
  const daysInSeconds = (duration.days || 0) * 24 * 3600;
  const hoursInSeconds = (duration.hours || 0) * 3600;
  const minutesInSeconds = (duration.minutes || 0) * 60;
  const seconds = duration.seconds || 0;

  return yearsInSeconds + monthsInSeconds + weeksInSeconds + daysInSeconds + hoursInSeconds + minutesInSeconds + seconds;
}

function end(durationString: string, startDate: Date = new Date()): Date {
  const duration = parse(durationString);
  if (!duration) return startDate;

  const result = new Date(startDate);

  if (duration.years) result.setFullYear(result.getFullYear() + duration.years);
  if (duration.months) result.setMonth(result.getMonth() + duration.months);
  if (duration.weeks) result.setDate(result.getDate() + duration.weeks * 7);
  if (duration.days) result.setDate(result.getDate() + duration.days);
  if (duration.hours) result.setHours(result.getHours() + duration.hours);
  if (duration.minutes) result.setMinutes(result.getMinutes() + duration.minutes);
  if (duration.seconds) result.setSeconds(result.getSeconds() + duration.seconds);

  return result;
}

const iso8601Duration = { parse, toSeconds, end };
export default iso8601Duration;

if (import.meta.url.includes("elide-iso8601-duration.ts")) {
  console.log("✅ iso8601-duration - ISO 8601 Duration (POLYGLOT!)\n");

  const duration1 = iso8601Duration.parse('P1Y2M3D');
  console.log('P1Y2M3D:', duration1);

  const duration2 = iso8601Duration.parse('PT2H30M');
  console.log('PT2H30M:', duration2, '=', iso8601Duration.toSeconds(duration2!), 'seconds');

  const endDate = iso8601Duration.end('P1D', new Date());
  console.log('1 day from now:', endDate.toISOString());

  console.log("\n🚀 ~3M downloads/week | Parse ISO 8601 durations\n");
}
