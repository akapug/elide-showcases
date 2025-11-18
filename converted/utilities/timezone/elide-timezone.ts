/**
 * timezone - Timezone Conversion Library
 * Based on https://www.npmjs.com/package/timezone (~1M downloads/week)
 */

const tzOffsets: Record<string, number> = {
  'UTC': 0,
  'GMT': 0,
  'EST': -300,
  'EDT': -240,
  'CST': -360,
  'CDT': -300,
  'MST': -420,
  'MDT': -360,
  'PST': -480,
  'PDT': -420,
  'JST': 540,
  'CET': 60,
  'CEST': 120
};

function timezone(date: Date | string | number, ...args: any[]): Date {
  const d = date instanceof Date ? date : new Date(date);

  if (args.length === 0) {
    return d;
  }

  const [tzName] = args;
  if (typeof tzName === 'string' && tzOffsets[tzName] !== undefined) {
    const offset = tzOffsets[tzName];
    const localOffset = d.getTimezoneOffset();
    return new Date(d.getTime() + (localOffset + offset) * 60000);
  }

  return d;
}

timezone.convert = (date: Date, fromTz: string, toTz: string): Date => {
  const fromOffset = tzOffsets[fromTz] || 0;
  const toOffset = tzOffsets[toTz] || 0;
  const diff = toOffset - fromOffset;
  return new Date(date.getTime() + diff * 60000);
};

timezone.offset = (tzName: string): number | null => {
  return tzOffsets[tzName] !== undefined ? tzOffsets[tzName] : null;
};

export default timezone;

if (import.meta.url.includes("elide-timezone.ts")) {
  console.log("✅ timezone - Timezone Conversion Library (POLYGLOT!)\n");

  const now = new Date();
  console.log('UTC:', timezone(now, 'UTC').toISOString());
  console.log('EST:', timezone(now, 'EST').toISOString());
  console.log('JST:', timezone(now, 'JST').toISOString());
  console.log('EST offset:', timezone.offset('EST'), 'minutes');

  console.log("\n🚀 ~1M downloads/week | Timezone conversions\n");
}
