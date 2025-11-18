/**
 * Moment.js - Date Library for Elide
 * NPM: 15M+ downloads/week
 */

export class Moment {
  constructor(private date: Date) {}

  static moment(date?: Date | string | number): Moment {
    if (!date) return new Moment(new Date());
    if (date instanceof Date) return new Moment(date);
    if (typeof date === 'number') return new Moment(new Date(date));
    return new Moment(new Date(date));
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

  add(amount: number, unit: string): Moment {
    const result = new Date(this.date);
    if (unit === 'days') result.setDate(result.getDate() + amount);
    if (unit === 'months') result.setMonth(result.getMonth() + amount);
    if (unit === 'years') result.setFullYear(result.getFullYear() + amount);
    return new Moment(result);
  }

  subtract(amount: number, unit: string): Moment {
    return this.add(-amount, unit);
  }

  valueOf(): number {
    return this.date.getTime();
  }

  toDate(): Date {
    return new Date(this.date);
  }
}

export const moment = Moment.moment;

if (import.meta.url.includes("moment")) {
  console.log("🎯 Moment.js for Elide - Parse, Validate, Manipulate Dates\n");
  const now = moment();
  console.log("Now:", now.format('YYYY-MM-DD HH:mm:ss'));
  console.log("Tomorrow:", now.add(1, 'days').format('YYYY-MM-DD'));
}

export default moment;
