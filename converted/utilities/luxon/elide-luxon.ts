/**
 * Luxon - DateTime Library for Elide
 * NPM: 8M+ downloads/week
 */

export class DateTime {
  constructor(private date: Date) {}

  static now(): DateTime {
    return new DateTime(new Date());
  }

  static fromISO(iso: string): DateTime {
    return new DateTime(new Date(iso));
  }

  static fromMillis(ms: number): DateTime {
    return new DateTime(new Date(ms));
  }

  toFormat(formatStr: string): string {
    const yyyy = this.date.getFullYear();
    const MM = String(this.date.getMonth() + 1).padStart(2, '0');
    const dd = String(this.date.getDate()).padStart(2, '0');
    const HH = String(this.date.getHours()).padStart(2, '0');
    const mm = String(this.date.getMinutes()).padStart(2, '0');

    return formatStr
      .replace('yyyy', String(yyyy))
      .replace('MM', MM)
      .replace('dd', dd)
      .replace('HH', HH)
      .replace('mm', mm);
  }

  toISO(): string {
    return this.date.toISOString();
  }

  plus(duration: { days?: number; months?: number; years?: number }): DateTime {
    const result = new Date(this.date);
    if (duration.days) result.setDate(result.getDate() + duration.days);
    if (duration.months) result.setMonth(result.getMonth() + duration.months);
    if (duration.years) result.setFullYear(result.getFullYear() + duration.years);
    return new DateTime(result);
  }

  valueOf(): number {
    return this.date.getTime();
  }
}

if (import.meta.url.includes("luxon")) {
  console.log("🎯 Luxon for Elide - DateTime for JavaScript\n");
  const now = DateTime.now();
  console.log("Now:", now.toFormat('yyyy-MM-dd HH:mm'));
  console.log("ISO:", now.toISO());
  console.log("Next week:", now.plus({ days: 7 }).toFormat('yyyy-MM-dd'));
}

export default DateTime;
