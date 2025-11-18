/**
 * business-days - Business Day Calculator
 * Based on https://www.npmjs.com/package/business-days (~500K downloads/week)
 */

interface Holiday {
  date: Date;
  name: string;
}

function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

function isHoliday(date: Date, holidays: Holiday[]): boolean {
  const dateStr = date.toISOString().split('T')[0];
  return holidays.some(h => h.date.toISOString().split('T')[0] === dateStr);
}

function isBusinessDay(date: Date, holidays: Holiday[] = []): boolean {
  return !isWeekend(date) && !isHoliday(date, holidays);
}

function addBusinessDays(startDate: Date, days: number, holidays: Holiday[] = []): Date {
  const result = new Date(startDate);
  let daysAdded = 0;

  while (daysAdded < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result, holidays)) {
      daysAdded++;
    }
  }

  return result;
}

function subtractBusinessDays(startDate: Date, days: number, holidays: Holiday[] = []): Date {
  const result = new Date(startDate);
  let daysSubtracted = 0;

  while (daysSubtracted < days) {
    result.setDate(result.getDate() - 1);
    if (isBusinessDay(result, holidays)) {
      daysSubtracted++;
    }
  }

  return result;
}

function businessDaysDiff(startDate: Date, endDate: Date, holidays: Holiday[] = []): number {
  let count = 0;
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current < end) {
    if (isBusinessDay(current, holidays)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  return count;
}

const businessDays = {
  isBusinessDay,
  isWeekend,
  addBusinessDays,
  subtractBusinessDays,
  businessDaysDiff
};

export default businessDays;

if (import.meta.url.includes("elide-business-days.ts")) {
  console.log("✅ business-days - Business Day Calculator (POLYGLOT!)\n");

  const today = new Date();
  console.log('Is business day:', businessDays.isBusinessDay(today));
  console.log('Add 5 business days:', businessDays.addBusinessDays(today, 5).toDateString());

  const start = new Date('2025-11-17');
  const end = new Date('2025-11-21');
  console.log('Business days between:', businessDays.businessDaysDiff(start, end));

  console.log("\n🚀 ~500K downloads/week | Calculate business days\n");
}
