/**
 * fecha - Lightweight Date Formatting and Parsing
 * Based on https://www.npmjs.com/package/fecha (~8M downloads/week)
 */

const masks: Record<string, string> = {
  'default': 'ddd MMM DD YYYY HH:mm:ss',
  'shortDate': 'M/D/YY',
  'mediumDate': 'MMM D, YYYY',
  'longDate': 'MMMM D, YYYY',
  'fullDate': 'dddd, MMMM D, YYYY',
  'shortTime': 'HH:mm',
  'mediumTime': 'HH:mm:ss',
  'longTime': 'HH:mm:ss.SSS'
};

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(val: number, len: number = 2): string {
  return val.toString().padStart(len, '0');
}

function format(date: Date, mask: string = 'default'): string {
  const formatMask = masks[mask] || mask;

  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const weekday = date.getDay();
  const hours = date.getHours();
  const minutes = date.getMinutes();
  const seconds = date.getSeconds();
  const milliseconds = date.getMilliseconds();

  const flags: Record<string, string | number> = {
    YYYY: year,
    YY: String(year).slice(-2),
    MMMM: monthNames[month],
    MMM: monthNamesShort[month],
    MM: pad(month + 1),
    M: month + 1,
    DD: pad(day),
    D: day,
    dddd: dayNames[weekday],
    ddd: dayNamesShort[weekday],
    HH: pad(hours),
    H: hours,
    mm: pad(minutes),
    m: minutes,
    ss: pad(seconds),
    s: seconds,
    SSS: pad(milliseconds, 3)
  };

  return formatMask.replace(/YYYY|YY|MMMM|MMM|MM|M|DD|D|dddd|ddd|HH|H|mm|m|ss|s|SSS/g, (match) => String(flags[match]));
}

function parse(dateStr: string, format: string): Date | null {
  try {
    const date = new Date(dateStr);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

const fecha = { format, parse, masks };
export default fecha;

if (import.meta.url.includes("elide-fecha.ts")) {
  console.log("✅ fecha - Lightweight Date Formatting (POLYGLOT!)\n");

  const now = new Date();
  console.log('Default:', fecha.format(now));
  console.log('Short Date:', fecha.format(now, 'shortDate'));
  console.log('Medium Date:', fecha.format(now, 'mediumDate'));
  console.log('Long Date:', fecha.format(now, 'longDate'));
  console.log('Custom:', fecha.format(now, 'YYYY-MM-DD HH:mm:ss'));

  console.log("\n🚀 ~8M downloads/week | Lightweight date formatting\n");
}
