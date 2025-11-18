/**
 * tz-offset - Timezone Offset Calculator
 * Based on https://www.npmjs.com/package/tz-offset (~500K downloads/week)
 */

const offsets: Record<string, number> = {
  'UTC': 0,
  'GMT': 0,
  'EST': -5,
  'EDT': -4,
  'CST': -6,
  'CDT': -5,
  'MST': -7,
  'MDT': -6,
  'PST': -8,
  'PDT': -7,
  'CET': 1,
  'CEST': 2,
  'JST': 9,
  'AEST': 10,
  'AEDT': 11
};

function tzOffset(timezone: string): number | null {
  return offsets[timezone] !== undefined ? offsets[timezone] * 60 : null;
}

tzOffset.getOffset = (timezone: string, unit: 'hours' | 'minutes' = 'minutes'): number | null => {
  const offset = offsets[timezone];
  if (offset === undefined) return null;
  return unit === 'hours' ? offset : offset * 60;
};

tzOffset.fromDate = (date: Date): number => {
  return -date.getTimezoneOffset();
};

tzOffset.toISO = (offset: number): string => {
  const sign = offset >= 0 ? '+' : '-';
  const absOffset = Math.abs(offset);
  const hours = Math.floor(absOffset / 60);
  const minutes = absOffset % 60;
  return `${sign}${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

export default tzOffset;

if (import.meta.url.includes("elide-tz-offset.ts")) {
  console.log("✅ tz-offset - Timezone Offset Calculator (POLYGLOT!)\n");

  console.log('EST offset:', tzOffset('EST'), 'minutes');
  console.log('JST offset:', tzOffset.getOffset('JST', 'hours'), 'hours');
  console.log('Current offset:', tzOffset.fromDate(new Date()), 'minutes');
  console.log('ISO format:', tzOffset.toISO(-300));

  console.log("\n🚀 ~500K downloads/week | Calculate timezone offsets\n");
}
