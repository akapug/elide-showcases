/**
 * moment-timezone - Timezone Support for Moment
 * Based on https://www.npmjs.com/package/moment-timezone (~15M downloads/week)
 */

interface Timezone {
  name: string;
  offset: number; // in minutes
  abbr: string;
}

const timezones: Record<string, Timezone> = {
  'America/New_York': { name: 'America/New_York', offset: -300, abbr: 'EST' },
  'America/Chicago': { name: 'America/Chicago', offset: -360, abbr: 'CST' },
  'America/Denver': { name: 'America/Denver', offset: -420, abbr: 'MST' },
  'America/Los_Angeles': { name: 'America/Los_Angeles', offset: -480, abbr: 'PST' },
  'Europe/London': { name: 'Europe/London', offset: 0, abbr: 'GMT' },
  'Europe/Paris': { name: 'Europe/Paris', offset: 60, abbr: 'CET' },
  'Asia/Tokyo': { name: 'Asia/Tokyo', offset: 540, abbr: 'JST' },
  'Asia/Shanghai': { name: 'Asia/Shanghai', offset: 480, abbr: 'CST' },
  'Australia/Sydney': { name: 'Australia/Sydney', offset: 660, abbr: 'AEDT' }
};

class MomentTimezone {
  private date: Date;
  private tz?: string;

  constructor(date?: Date | string) {
    this.date = date instanceof Date ? date : new Date(date || Date.now());
  }

  tz(timezone: string): this {
    this.tz = timezone;
    return this;
  }

  format(formatStr: string = 'YYYY-MM-DD HH:mm:ss'): string {
    let d = new Date(this.date);

    if (this.tz && timezones[this.tz]) {
      const tzOffset = timezones[this.tz].offset;
      const localOffset = d.getTimezoneOffset();
      d = new Date(d.getTime() + (localOffset + tzOffset) * 60000);
    }

    const pad = (n: number) => n.toString().padStart(2, '0');

    const tokens: Record<string, string | number> = {
      YYYY: d.getFullYear(),
      MM: pad(d.getMonth() + 1),
      DD: pad(d.getDate()),
      HH: pad(d.getHours()),
      mm: pad(d.getMinutes()),
      ss: pad(d.getSeconds()),
      z: this.tz ? timezones[this.tz].abbr : 'UTC'
    };

    return formatStr.replace(/YYYY|MM|DD|HH|mm|ss|z/g, (match) => String(tokens[match]));
  }

  utcOffset(): number {
    return this.tz && timezones[this.tz] ? timezones[this.tz].offset : 0;
  }

  zoneName(): string {
    return this.tz && timezones[this.tz] ? timezones[this.tz].abbr : 'UTC';
  }
}

function momentTz(date?: Date | string): MomentTimezone {
  return new MomentTimezone(date);
}

momentTz.tz = {
  names: () => Object.keys(timezones),
  zone: (name: string) => timezones[name] || null
};

export default momentTz;

if (import.meta.url.includes("elide-moment-timezone.ts")) {
  console.log("✅ moment-timezone - Timezone Support (POLYGLOT!)\n");

  const now = new Date();
  console.log('New York:', momentTz(now).tz('America/New_York').format());
  console.log('Tokyo:', momentTz(now).tz('Asia/Tokyo').format());
  console.log('London:', momentTz(now).tz('Europe/London').format());
  console.log('Timezone names:', momentTz.tz.names().slice(0, 3));

  console.log("\n🚀 ~15M downloads/week | Timezone support for dates\n");
}
