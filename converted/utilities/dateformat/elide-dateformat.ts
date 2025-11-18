/**
 * dateformat - Date Formatting Library
 * Based on https://www.npmjs.com/package/dateformat (~15M downloads/week)
 */

const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const masks: Record<string, string> = {
  'default': 'ddd mmm dd yyyy HH:MM:ss',
  'shortDate': 'm/d/yy',
  'mediumDate': 'mmm d, yyyy',
  'longDate': 'mmmm d, yyyy',
  'fullDate': 'dddd, mmmm d, yyyy',
  'shortTime': 'h:MM TT',
  'mediumTime': 'h:MM:ss TT',
  'longTime': 'h:MM:ss TT Z',
  'isoDate': 'yyyy-mm-dd',
  'isoTime': 'HH:MM:ss',
  'isoDateTime': 'yyyy-mm-dd\'T\'HH:MM:ss',
  'isoUtcDateTime': 'UTC:yyyy-mm-dd\'T\'HH:MM:ss\'Z\''
};

function pad(val: number, len: number = 2): string {
  return val.toString().padStart(len, '0');
}

function dateformat(date?: Date | string, mask: string = 'default', utc: boolean = false): string {
  const d = date instanceof Date ? date : new Date(date || Date.now());
  const formatMask = masks[mask] || mask;

  const get = utc ? {
    d: () => d.getUTCDate(),
    m: () => d.getUTCMonth(),
    y: () => d.getUTCFullYear(),
    H: () => d.getUTCHours(),
    M: () => d.getUTCMinutes(),
    s: () => d.getUTCSeconds(),
    day: () => d.getUTCDay()
  } : {
    d: () => d.getDate(),
    m: () => d.getMonth(),
    y: () => d.getFullYear(),
    H: () => d.getHours(),
    M: () => d.getMinutes(),
    s: () => d.getSeconds(),
    day: () => d.getDay()
  };

  const flags: Record<string, string | number> = {
    d: get.d(),
    dd: pad(get.d()),
    ddd: dayNames[get.day()],
    dddd: dayNames[get.day() + 7],
    m: get.m() + 1,
    mm: pad(get.m() + 1),
    mmm: monthNames[get.m()],
    mmmm: monthNames[get.m() + 12],
    yy: String(get.y()).slice(-2),
    yyyy: get.y(),
    h: get.H() % 12 || 12,
    hh: pad(get.H() % 12 || 12),
    H: get.H(),
    HH: pad(get.H()),
    M: get.M(),
    MM: pad(get.M()),
    s: get.s(),
    ss: pad(get.s()),
    TT: get.H() >= 12 ? 'PM' : 'AM',
    Z: utc ? 'UTC' : 'Local'
  };

  return formatMask.replace(/d{1,4}|m{1,4}|yy(?:yy)?|([HhMs])\1?|TT|Z|"[^"]*"|'[^']*'/g, (match) => {
    if (match in flags) return String(flags[match]);
    return match.replace(/^["']|["']$/g, '');
  });
}

dateformat.masks = masks;

export default dateformat;

if (import.meta.url.includes("elide-dateformat.ts")) {
  console.log("✅ dateformat - Date Formatting Library (POLYGLOT!)\n");

  const now = new Date();
  console.log('Default:', dateformat(now));
  console.log('Short Date:', dateformat(now, 'shortDate'));
  console.log('ISO Date:', dateformat(now, 'isoDate'));
  console.log('Custom:', dateformat(now, 'dddd, mmmm d, yyyy'));

  console.log("\n🚀 ~15M downloads/week | Versatile date formatting\n");
}
