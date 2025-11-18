/**
 * calendar - Calendar Utilities
 * Based on https://www.npmjs.com/package/calendar (~1M downloads/week)
 */

interface CalendarDay {
  date: Date;
  month: number;
  day: number;
  isCurrentMonth: boolean;
}

class Calendar {
  private year: number;
  private month: number;

  constructor(year?: number, month?: number) {
    const now = new Date();
    this.year = year !== undefined ? year : now.getFullYear();
    this.month = month !== undefined ? month : now.getMonth();
  }

  monthDays(): CalendarDay[][] {
    const firstDay = new Date(this.year, this.month, 1);
    const lastDay = new Date(this.year, this.month + 1, 0);
    const startDay = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const weeks: CalendarDay[][] = [];
    let week: CalendarDay[] = [];

    // Fill in days from previous month
    const prevMonthLastDay = new Date(this.year, this.month, 0).getDate();
    for (let i = startDay - 1; i >= 0; i--) {
      week.push({
        date: new Date(this.year, this.month - 1, prevMonthLastDay - i),
        month: this.month - 1,
        day: prevMonthLastDay - i,
        isCurrentMonth: false
      });
    }

    // Fill in current month days
    for (let day = 1; day <= daysInMonth; day++) {
      week.push({
        date: new Date(this.year, this.month, day),
        month: this.month,
        day: day,
        isCurrentMonth: true
      });

      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }

    // Fill in days from next month
    if (week.length > 0) {
      let nextDay = 1;
      while (week.length < 7) {
        week.push({
          date: new Date(this.year, this.month + 1, nextDay),
          month: this.month + 1,
          day: nextDay,
          isCurrentMonth: false
        });
        nextDay++;
      }
      weeks.push(week);
    }

    return weeks;
  }

  toString(): string {
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${monthNames[this.month]} ${this.year}`;
  }
}

export default Calendar;

if (import.meta.url.includes("elide-calendar.ts")) {
  console.log("✅ calendar - Calendar Utilities (POLYGLOT!)\n");

  const cal = new Calendar(2025, 10); // November 2025
  console.log('Calendar:', cal.toString());
  console.log('Weeks in month:', cal.monthDays().length);
  console.log('First day:', cal.monthDays()[0][0].date.toDateString());

  console.log("\n🚀 ~1M downloads/week | Calendar utilities\n");
}
