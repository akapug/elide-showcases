/**
 * moment-business-days - Moment Business Days Plugin
 * Based on https://www.npmjs.com/package/moment-business-days (~1M downloads/week)
 */

class MomentBusinessDays {
  private date: Date;
  private holidays: Date[];

  constructor(date?: Date) {
    this.date = date || new Date();
    this.holidays = [];
  }

  isBusinessDay(): boolean {
    const day = this.date.getDay();
    if (day === 0 || day === 6) return false;

    const dateStr = this.date.toISOString().split('T')[0];
    return !this.holidays.some(h => h.toISOString().split('T')[0] === dateStr);
  }

  businessDaysAdd(days: number): MomentBusinessDays {
    const result = new Date(this.date);
    let daysAdded = 0;

    while (daysAdded < days) {
      result.setDate(result.getDate() + 1);
      const temp = new MomentBusinessDays(result);
      temp.holidays = this.holidays;
      if (temp.isBusinessDay()) {
        daysAdded++;
      }
    }

    this.date = result;
    return this;
  }

  businessDiff(otherDate: Date): number {
    let count = 0;
    const current = new Date(Math.min(this.date.getTime(), otherDate.getTime()));
    const end = new Date(Math.max(this.date.getTime(), otherDate.getTime()));

    while (current < end) {
      const temp = new MomentBusinessDays(current);
      temp.holidays = this.holidays;
      if (temp.isBusinessDay()) {
        count++;
      }
      current.setDate(current.getDate() + 1);
    }

    return count;
  }

  nextBusinessDay(): MomentBusinessDays {
    const result = new Date(this.date);
    do {
      result.setDate(result.getDate() + 1);
      const temp = new MomentBusinessDays(result);
      temp.holidays = this.holidays;
      if (temp.isBusinessDay()) {
        this.date = result;
        return this;
      }
    } while (true);
  }

  format(fmt: string = 'YYYY-MM-DD'): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    const tokens: Record<string, string | number> = {
      YYYY: this.date.getFullYear(),
      MM: pad(this.date.getMonth() + 1),
      DD: pad(this.date.getDate())
    };
    return fmt.replace(/YYYY|MM|DD/g, (match) => String(tokens[match]));
  }
}

function momentBusinessDays(date?: Date): MomentBusinessDays {
  return new MomentBusinessDays(date);
}

export default momentBusinessDays;

if (import.meta.url.includes("elide-moment-business-days.ts")) {
  console.log("✅ moment-business-days - Business Days Plugin (POLYGLOT!)\n");

  const now = momentBusinessDays();
  console.log('Is business day:', now.isBusinessDay());
  console.log('Add 5 business days:', momentBusinessDays().businessDaysAdd(5).format());
  console.log('Next business day:', momentBusinessDays().nextBusinessDay().format());

  console.log("\n🚀 ~1M downloads/week | Business day operations\n");
}
