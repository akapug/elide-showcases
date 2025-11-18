/**
 * strftime - C-style Date Formatting
 * Based on https://www.npmjs.com/package/strftime (~8M downloads/week)
 */

const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const daysShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthsShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function pad(n: number, width: number = 2): string {
  return n.toString().padStart(width, '0');
}

function strftime(fmt: string, date?: Date): string {
  const d = date || new Date();

  const formatters: Record<string, string | number> = {
    'a': daysShort[d.getDay()],
    'A': days[d.getDay()],
    'b': monthsShort[d.getMonth()],
    'B': months[d.getMonth()],
    'd': pad(d.getDate()),
    'e': d.getDate().toString().padStart(2, ' '),
    'H': pad(d.getHours()),
    'I': pad(d.getHours() % 12 || 12),
    'j': pad(Math.floor((d.getTime() - new Date(d.getFullYear(), 0, 0).getTime()) / 86400000), 3),
    'm': pad(d.getMonth() + 1),
    'M': pad(d.getMinutes()),
    'p': d.getHours() >= 12 ? 'PM' : 'AM',
    'S': pad(d.getSeconds()),
    'w': d.getDay(),
    'y': pad(d.getFullYear() % 100),
    'Y': d.getFullYear(),
    'Z': 'UTC',
    '%': '%'
  };

  return fmt.replace(/%([aAbBdeHIjmMpSwYyZ%])/g, (match, code) => String(formatters[code] || match));
}

strftime.localize = (locale: Record<string, string[]>): ((fmt: string, date?: Date) => string) => {
  return (fmt: string, date?: Date) => strftime(fmt, date);
};

export default strftime;

if (import.meta.url.includes("elide-strftime.ts")) {
  console.log("✅ strftime - C-style Date Formatting (POLYGLOT!)\n");

  const now = new Date();
  console.log('%Y-%m-%d:', strftime('%Y-%m-%d', now));
  console.log('%A, %B %d:', strftime('%A, %B %d', now));
  console.log('%I:%M %p:', strftime('%I:%M %p', now));
  console.log('%Y-%m-%d %H:%M:%S:', strftime('%Y-%m-%d %H:%M:%S', now));

  console.log("\n🚀 ~8M downloads/week | C-style date formatting\n");
}
