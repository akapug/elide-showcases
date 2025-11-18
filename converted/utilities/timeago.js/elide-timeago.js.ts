/**
 * timeago.js - Relative Time Formatting
 * Based on https://www.npmjs.com/package/timeago.js (~1M downloads/week)
 */

const MINUTE = 60;
const HOUR = MINUTE * 60;
const DAY = HOUR * 24;
const WEEK = DAY * 7;
const MONTH = DAY * 30;
const YEAR = DAY * 365;

const locale = {
  seconds: 'just now',
  minute: '1 minute ago',
  minutes: '%s minutes ago',
  hour: '1 hour ago',
  hours: '%s hours ago',
  day: '1 day ago',
  days: '%s days ago',
  week: '1 week ago',
  weeks: '%s weeks ago',
  month: '1 month ago',
  months: '%s months ago',
  year: '1 year ago',
  years: '%s years ago'
};

function format(date: Date | string | number, nowDate: Date = new Date()): string {
  const timestamp = date instanceof Date ? date.getTime() : new Date(date).getTime();
  const now = nowDate.getTime();
  const seconds = Math.floor((now - timestamp) / 1000);

  if (seconds < MINUTE) {
    return locale.seconds;
  }

  const minutes = Math.floor(seconds / MINUTE);
  if (minutes < 60) {
    return minutes === 1 ? locale.minute : locale.minutes.replace('%s', minutes.toString());
  }

  const hours = Math.floor(seconds / HOUR);
  if (hours < 24) {
    return hours === 1 ? locale.hour : locale.hours.replace('%s', hours.toString());
  }

  const days = Math.floor(seconds / DAY);
  if (days < 7) {
    return days === 1 ? locale.day : locale.days.replace('%s', days.toString());
  }

  const weeks = Math.floor(seconds / WEEK);
  if (weeks < 4) {
    return weeks === 1 ? locale.week : locale.weeks.replace('%s', weeks.toString());
  }

  const months = Math.floor(seconds / MONTH);
  if (months < 12) {
    return months === 1 ? locale.month : locale.months.replace('%s', months.toString());
  }

  const years = Math.floor(seconds / YEAR);
  return years === 1 ? locale.year : locale.years.replace('%s', years.toString());
}

const timeago = { format };
export default timeago;

if (import.meta.url.includes("elide-timeago.js.ts")) {
  console.log("✅ timeago.js - Relative Time Formatting (POLYGLOT!)\n");

  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const twoMonthsAgo = new Date(now.getTime() - 2 * 30 * 24 * 60 * 60 * 1000);

  console.log('5 minutes ago:', timeago.format(fiveMinutesAgo));
  console.log('3 days ago:', timeago.format(threeDaysAgo));
  console.log('2 months ago:', timeago.format(twoMonthsAgo));

  console.log("\n🚀 ~1M downloads/week | Relative time formatting\n");
}
