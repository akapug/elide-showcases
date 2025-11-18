/**
 * easter-date - Easter Date Calculator
 * Based on https://www.npmjs.com/package/easter-date (~100K downloads/week)
 */

function easterDate(year: number): Date {
  // Using the Anonymous Gregorian algorithm
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1; // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  return new Date(year, month, day);
}

function goodFriday(year: number): Date {
  const easter = easterDate(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  return goodFriday;
}

function ashWednesday(year: number): Date {
  const easter = easterDate(year);
  const ash = new Date(easter);
  ash.setDate(easter.getDate() - 46);
  return ash;
}

function pentecost(year: number): Date {
  const easter = easterDate(year);
  const pentecost = new Date(easter);
  pentecost.setDate(easter.getDate() + 49);
  return pentecost;
}

const easterCalculator = {
  easterDate,
  goodFriday,
  ashWednesday,
  pentecost
};

export default easterCalculator;

if (import.meta.url.includes("elide-easter-date.ts")) {
  console.log("✅ easter-date - Easter Date Calculator (POLYGLOT!)\n");

  console.log('Easter 2025:', easterCalculator.easterDate(2025).toDateString());
  console.log('Easter 2026:', easterCalculator.easterDate(2026).toDateString());
  console.log('Good Friday 2025:', easterCalculator.goodFriday(2025).toDateString());
  console.log('Pentecost 2025:', easterCalculator.pentecost(2025).toDateString());

  console.log("\n🚀 ~100K downloads/week | Calculate Easter dates\n");
}
