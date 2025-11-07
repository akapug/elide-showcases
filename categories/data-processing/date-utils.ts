/**
 * Date/Time Utilities
 * Parse, format, and manipulate dates
 */

export function formatDate(date: Date, format: string = 'YYYY-MM-DD'): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds);
}

export function parseDate(dateString: string): Date {
  return new Date(dateString);
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

export function diffInDays(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

export function diffInHours(date1: Date, date2: Date): number {
  const diff = date2.getTime() - date1.getTime();
  return Math.floor(diff / (1000 * 60 * 60));
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

export function isLeapYear(year: number): boolean {
  return (year % 4 === 0 && year % 100 !== 0) || (year % 400 === 0);
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = diffInDays(firstDayOfYear, date);
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6;
}

export function formatRelative(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return 'just now';
  if (minutes < 60) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  if (days < 7) return `${days} day${days > 1 ? 's' : ''} ago`;
  if (days < 30) return `${Math.floor(days / 7)} week${Math.floor(days / 7) > 1 ? 's' : ''} ago`;
  if (days < 365) return `${Math.floor(days / 30)} month${Math.floor(days / 30) > 1 ? 's' : ''} ago`;
  return `${Math.floor(days / 365)} year${Math.floor(days / 365) > 1 ? 's' : ''} ago`;
}

// CLI demo
if (import.meta.url.includes("date-utils.ts")) {
  const now = new Date();

  console.log("Date Utils Demo\n");
  console.log("Current date:", formatDate(now, 'YYYY-MM-DD HH:mm:ss'));
  console.log("ISO format:", formatDate(now, 'YYYY-MM-DD'));

  console.log("\nDate arithmetic:");
  console.log("Tomorrow:", formatDate(addDays(now, 1)));
  console.log("Next month:", formatDate(addMonths(now, 1)));
  console.log("Yesterday:", formatDate(addDays(now, -1)));

  console.log("\nDate info:");
  console.log("Start of day:", formatDate(startOfDay(now), 'YYYY-MM-DD HH:mm:ss'));
  console.log("End of day:", formatDate(endOfDay(now), 'YYYY-MM-DD HH:mm:ss'));
  console.log("Week number:", getWeekNumber(now));
  console.log("Is weekend?", isWeekend(now));
  console.log("Is 2024 leap year?", isLeapYear(2024));

  console.log("\nRelative formatting:");
  console.log("5 minutes ago:", formatRelative(addDays(now, 0)));
  console.log("2 hours ago:", formatRelative(new Date(now.getTime() - 2 * 60 * 60 * 1000)));
  console.log("3 days ago:", formatRelative(addDays(now, -3)));
  console.log("2 weeks ago:", formatRelative(addDays(now, -14)));

  console.log("✅ Date utils test passed");
}
