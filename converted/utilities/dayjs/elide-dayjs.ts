/**
 * Day.js - Lightweight Date Library for Elide
 * NPM: 20M+ downloads/week
 */

export class Dayjs {
  constructor(private date: Date) {}

  static dayjs(date?: Date | string | number): Dayjs {
    if (!date) return new Dayjs(new Date());
    if (date instanceof Date) return new Dayjs(date);
    if (typeof date === 'number') return new Dayjs(new Date(date));
    return new Dayjs(new Date(date));
  }

  format(formatStr: string = 'YYYY-MM-DD'): string {
    const yyyy = this.date.getFullYear();
    const MM = String(this.date.getMonth() + 1).padStart(2, '0');
    const DD = String(this.date.getDate()).padStart(2, '0');
    const HH = String(this.date.getHours()).padStart(2, '0');
    const mm = String(this.date.getMinutes()).padStart(2, '0');
    const ss = String(this.date.getSeconds()).padStart(2, '0');

    return formatStr
      .replace('YYYY', String(yyyy))
      .replace('MM', MM)
      .replace('DD', DD)
      .replace('HH', HH)
      .replace('mm', mm)
      .replace('ss', ss);
  }

  add(amount: number, unit: string): Dayjs {
    const result = new Date(this.date);
    if (unit === 'day') result.setDate(result.getDate() + amount);
    if (unit === 'month') result.setMonth(result.getMonth() + amount);
    if (unit === 'year') result.setFullYear(result.getFullYear() + amount);
    return new Dayjs(result);
  }

  subtract(amount: number, unit: string): Dayjs {
    return this.add(-amount, unit);
  }

  valueOf(): number {
    return this.date.getTime();
  }

  toDate(): Date {
    return new Date(this.date);
  }
}

export const dayjs = Dayjs.dayjs;

if (import.meta.url.includes("dayjs")) {
  console.log("🎯 Day.js for Elide - Fast 2kB Alternative to Moment.js\n");
  const now = dayjs();
  console.log("Now:", now.format('YYYY-MM-DD HH:mm:ss'));
  console.log("Tomorrow:", now.add(1, 'day').format('YYYY-MM-DD'));
}

export default dayjs;
