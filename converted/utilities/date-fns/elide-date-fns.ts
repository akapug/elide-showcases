/**
 * date-fns - Modern Date Utility Library for Elide
 * NPM: 50M+ downloads/week
 */

export function format(date: Date, formatStr: string): string {
  const yyyy = date.getFullYear();
  const MM = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const HH = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');

  return formatStr
    .replace('yyyy', String(yyyy))
    .replace('MM', MM)
    .replace('dd', dd)
    .replace('HH', HH)
    .replace('mm', mm)
    .replace('ss', ss);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

export function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

export function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

export function differenceInDays(dateLeft: Date, dateRight: Date): number {
  const diffMs = dateLeft.getTime() - dateRight.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

export function isAfter(date: Date, dateToCompare: Date): boolean {
  return date.getTime() > dateToCompare.getTime();
}

export function isBefore(date: Date, dateToCompare: Date): boolean {
  return date.getTime() < dateToCompare.getTime();
}

export function startOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(0, 0, 0, 0);
  return result;
}

export function endOfDay(date: Date): Date {
  const result = new Date(date);
  result.setHours(23, 59, 59, 999);
  return result;
}

if (import.meta.url.includes("date-fns")) {
  console.log("🎯 date-fns for Elide - Modern Date Utilities\n");
  const now = new Date();
  console.log("Now:", format(now, 'yyyy-MM-dd HH:mm:ss'));
  console.log("Tomorrow:", format(addDays(now, 1), 'yyyy-MM-dd'));
  console.log("Next month:", format(addMonths(now, 1), 'yyyy-MM-dd'));
}

export default { format, addDays, addMonths, addYears, differenceInDays, isAfter, isBefore, startOfDay, endOfDay };
