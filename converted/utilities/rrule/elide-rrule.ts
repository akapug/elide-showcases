/**
 * rrule - Recurrence Rule Library
 * Based on https://www.npmjs.com/package/rrule (~3M downloads/week)
 */

enum Frequency {
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

interface RRuleOptions {
  freq: Frequency;
  interval?: number;
  count?: number;
  until?: Date;
  dtstart?: Date;
}

class RRule {
  private options: RRuleOptions;

  constructor(options: RRuleOptions) {
    this.options = {
      interval: 1,
      dtstart: new Date(),
      ...options
    };
  }

  all(limit: number = 100): Date[] {
    const results: Date[] = [];
    const start = this.options.dtstart!;
    const interval = this.options.interval!;
    let current = new Date(start);

    const maxCount = this.options.count || limit;

    for (let i = 0; i < maxCount; i++) {
      if (this.options.until && current > this.options.until) {
        break;
      }

      results.push(new Date(current));

      switch (this.options.freq) {
        case Frequency.DAILY:
          current.setDate(current.getDate() + interval);
          break;
        case Frequency.WEEKLY:
          current.setDate(current.getDate() + (7 * interval));
          break;
        case Frequency.MONTHLY:
          current.setMonth(current.getMonth() + interval);
          break;
        case Frequency.YEARLY:
          current.setFullYear(current.getFullYear() + interval);
          break;
      }
    }

    return results;
  }

  between(after: Date, before: Date): Date[] {
    return this.all(1000).filter(d => d >= after && d <= before);
  }

  toString(): string {
    let str = `FREQ=${this.options.freq}`;
    if (this.options.interval !== 1) str += `;INTERVAL=${this.options.interval}`;
    if (this.options.count) str += `;COUNT=${this.options.count}`;
    return str;
  }
}

RRule.DAILY = Frequency.DAILY;
RRule.WEEKLY = Frequency.WEEKLY;
RRule.MONTHLY = Frequency.MONTHLY;
RRule.YEARLY = Frequency.YEARLY;

export default RRule;

if (import.meta.url.includes("elide-rrule.ts")) {
  console.log("✅ rrule - Recurrence Rule Library (POLYGLOT!)\n");

  const dailyRule = new RRule({ freq: RRule.DAILY, count: 5 });
  console.log('Daily (5 times):', dailyRule.all().map(d => d.toDateString()));

  const weeklyRule = new RRule({ freq: RRule.WEEKLY, interval: 2, count: 3 });
  console.log('Bi-weekly (3 times):', weeklyRule.all().map(d => d.toDateString()));

  console.log("\n🚀 ~3M downloads/week | Recurrence rules for events\n");
}
