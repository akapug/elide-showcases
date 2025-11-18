/**
 * holidays - Holiday Calculator
 * Based on https://www.npmjs.com/package/holidays (~500K downloads/week)
 */

interface Holiday {
  name: string;
  date: Date;
}

const fixedHolidays: Array<{ month: number; day: number; name: string }> = [
  { month: 0, day: 1, name: "New Year's Day" },
  { month: 6, day: 4, name: "Independence Day (US)" },
  { month: 11, day: 25, name: "Christmas Day" }
];

function getFixedHolidays(year: number): Holiday[] {
  return fixedHolidays.map(h => ({
    name: h.name,
    date: new Date(year, h.month, h.day)
  }));
}

function getThanksgiving(year: number): Holiday {
  // Fourth Thursday of November
  const nov = new Date(year, 10, 1);
  let thursdayCount = 0;
  let day = 1;

  while (thursdayCount < 4) {
    const d = new Date(year, 10, day);
    if (d.getDay() === 4) {
      thursdayCount++;
      if (thursdayCount === 4) {
        return { name: 'Thanksgiving Day (US)', date: d };
      }
    }
    day++;
  }

  return { name: 'Thanksgiving Day (US)', date: new Date(year, 10, 26) };
}

function getMemorialDay(year: number): Holiday {
  // Last Monday of May
  const may = new Date(year, 4, 31);
  while (may.getDay() !== 1) {
    may.setDate(may.getDate() - 1);
  }
  return { name: 'Memorial Day (US)', date: may };
}

function getLaborDay(year: number): Holiday {
  // First Monday of September
  const sep = new Date(year, 8, 1);
  while (sep.getDay() !== 1) {
    sep.setDate(sep.getDate() + 1);
  }
  return { name: 'Labor Day (US)', date: sep };
}

function getHolidays(year: number): Holiday[] {
  return [
    ...getFixedHolidays(year),
    getThanksgiving(year),
    getMemorialDay(year),
    getLaborDay(year)
  ].sort((a, b) => a.date.getTime() - b.date.getTime());
}

function isHoliday(date: Date, year?: number): Holiday | null {
  const y = year || date.getFullYear();
  const holidays = getHolidays(y);
  const dateStr = date.toISOString().split('T')[0];

  return holidays.find(h => h.date.toISOString().split('T')[0] === dateStr) || null;
}

const holidays = { getHolidays, isHoliday };
export default holidays;

if (import.meta.url.includes("elide-holidays.ts")) {
  console.log("✅ holidays - Holiday Calculator (POLYGLOT!)\n");

  const holidays2025 = holidays.getHolidays(2025);
  console.log('2025 Holidays:');
  holidays2025.forEach(h => console.log(`  ${h.name}: ${h.date.toDateString()}`));

  const christmasCheck = holidays.isHoliday(new Date(2025, 11, 25));
  console.log('\nIs 2025-12-25 a holiday?', christmasCheck?.name);

  console.log("\n🚀 ~500K downloads/week | Calculate holidays\n");
}
