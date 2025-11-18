/**
 * lunar - Lunar Calendar
 * Based on https://www.npmjs.com/package/lunar (~200K downloads/week)
 */

interface LunarDate {
  year: number;
  month: number;
  day: number;
  isLeapMonth: boolean;
}

// Simplified lunar calendar conversion
function getLunarDate(solarDate: Date): LunarDate {
  const baseDate = new Date(2000, 0, 1);
  const daysDiff = Math.floor((solarDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

  const lunarYear = 2000 + Math.floor(daysDiff / 354);
  const daysInYear = daysDiff % 354;
  const lunarMonth = Math.floor(daysInYear / 29.5) + 1;
  const lunarDay = Math.floor(daysInYear % 29.5) + 1;

  return {
    year: lunarYear,
    month: Math.min(lunarMonth, 12),
    day: Math.min(lunarDay, 30),
    isLeapMonth: false
  };
}

function getSolarDate(lunarDate: LunarDate): Date {
  const baseDate = new Date(2000, 0, 1);
  const yearDays = (lunarDate.year - 2000) * 354;
  const monthDays = (lunarDate.month - 1) * 29.5;
  const totalDays = yearDays + monthDays + lunarDate.day - 1;

  const result = new Date(baseDate);
  result.setDate(result.getDate() + totalDays);
  return result;
}

function getLunarNewYear(year: number): Date {
  // Simplified - actual dates vary
  const baseNewYear = new Date(2000, 0, 5);
  const yearsDiff = year - 2000;
  const dayOffset = yearsDiff * 11; // Lunar year is ~11 days shorter

  const result = new Date(baseNewYear);
  result.setDate(result.getDate() + (yearsDiff * 354));

  // Adjust to nearest late January/early February
  const month = result.getMonth();
  if (month > 2) {
    result.setFullYear(result.getFullYear() + 1, 0, 25);
  }

  return result;
}

const lunar = {
  getLunarDate,
  getSolarDate,
  getLunarNewYear
};

export default lunar;

if (import.meta.url.includes("elide-lunar.ts")) {
  console.log("✅ lunar - Lunar Calendar (POLYGLOT!)\n");

  const today = new Date();
  const lunarToday = lunar.getLunarDate(today);
  console.log('Today (Lunar):', `${lunarToday.year}-${lunarToday.month}-${lunarToday.day}`);

  const newYear2025 = lunar.getLunarNewYear(2025);
  console.log('Lunar New Year 2025:', newYear2025.toDateString());

  const newYear2026 = lunar.getLunarNewYear(2026);
  console.log('Lunar New Year 2026:', newYear2026.toDateString());

  console.log("\n🚀 ~200K downloads/week | Lunar calendar conversions\n");
}
