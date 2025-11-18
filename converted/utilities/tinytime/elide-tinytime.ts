/**
 * tinytime - Tiny Date Formatter
 * Based on https://www.npmjs.com/package/tinytime (~500K downloads/week)
 */

function pad(val: number, len: number = 2): string {
  return val.toString().padStart(len, '0');
}

const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const monthNamesShort = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const dayNamesShort = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

interface Template {
  render: (date: Date) => string;
}

function tinytime(template: string): Template {
  return {
    render(date: Date): string {
      const tokens: Record<string, string | number> = {
        YYYY: date.getFullYear(),
        YY: String(date.getFullYear()).slice(-2),
        Mo: monthNames[date.getMonth()],
        MM: pad(date.getMonth() + 1),
        M: date.getMonth() + 1,
        Do: dayNames[date.getDay()],
        DD: pad(date.getDate()),
        D: date.getDate(),
        H: date.getHours(),
        h: date.getHours() % 12 || 12,
        mm: pad(date.getMinutes()),
        m: date.getMinutes(),
        ss: pad(date.getSeconds()),
        s: date.getSeconds(),
        a: date.getHours() >= 12 ? 'pm' : 'am',
        A: date.getHours() >= 12 ? 'PM' : 'AM'
      };

      return template.replace(/{([^}]+)}/g, (match, key) => String(tokens[key] ?? match));
    }
  };
}

export default tinytime;

if (import.meta.url.includes("elide-tinytime.ts")) {
  console.log("✅ tinytime - Tiny Date Formatter (POLYGLOT!)\n");

  const template1 = tinytime('{YYYY}-{MM}-{DD}');
  const template2 = tinytime('{h}:{mm}{a}');
  const template3 = tinytime('{Mo} {DD}, {YYYY}');

  const now = new Date();
  console.log('ISO Date:', template1.render(now));
  console.log('Time:', template2.render(now));
  console.log('Readable:', template3.render(now));

  console.log("\n🚀 ~500K downloads/week | Tiny date formatter\n");
}
