/**
 * chrono-node - Natural Language Date Parser
 * Based on https://www.npmjs.com/package/chrono-node (~3M downloads/week)
 */

interface ParsedDate {
  text: string;
  start: Date;
  end?: Date;
  index: number;
}

const patterns = {
  tomorrow: /\btomorrow\b/i,
  yesterday: /\byesterday\b/i,
  today: /\btoday\b/i,
  next: /\bnext\s+(week|month|year)\b/i,
  last: /\blast\s+(week|month|year)\b/i,
  ago: /(\d+)\s+(day|week|month|year)s?\s+ago\b/i,
  in: /\bin\s+(\d+)\s+(day|week|month|year)s?\b/i,
  iso: /\d{4}-\d{2}-\d{2}/
};

const chrono = {
  parseDate(text: string, refDate: Date = new Date()): Date | null {
    const normalized = text.toLowerCase().trim();

    if (patterns.tomorrow.test(normalized)) {
      const date = new Date(refDate);
      date.setDate(date.getDate() + 1);
      return date;
    }

    if (patterns.yesterday.test(normalized)) {
      const date = new Date(refDate);
      date.setDate(date.getDate() - 1);
      return date;
    }

    if (patterns.today.test(normalized)) {
      return new Date(refDate);
    }

    const agoMatch = normalized.match(patterns.ago);
    if (agoMatch) {
      const amount = parseInt(agoMatch[1]);
      const unit = agoMatch[2];
      const date = new Date(refDate);

      switch (unit) {
        case 'day': date.setDate(date.getDate() - amount); break;
        case 'week': date.setDate(date.getDate() - (amount * 7)); break;
        case 'month': date.setMonth(date.getMonth() - amount); break;
        case 'year': date.setFullYear(date.getFullYear() - amount); break;
      }

      return date;
    }

    const inMatch = normalized.match(patterns.in);
    if (inMatch) {
      const amount = parseInt(inMatch[1]);
      const unit = inMatch[2];
      const date = new Date(refDate);

      switch (unit) {
        case 'day': date.setDate(date.getDate() + amount); break;
        case 'week': date.setDate(date.getDate() + (amount * 7)); break;
        case 'month': date.setMonth(date.getMonth() + amount); break;
        case 'year': date.setFullYear(date.getFullYear() + amount); break;
      }

      return date;
    }

    if (patterns.iso.test(text)) {
      return new Date(text);
    }

    return null;
  },

  parse(text: string, refDate: Date = new Date()): ParsedDate[] {
    const results: ParsedDate[] = [];
    const date = this.parseDate(text, refDate);

    if (date) {
      results.push({
        text: text,
        start: date,
        index: 0
      });
    }

    return results;
  }
};

export default chrono;

if (import.meta.url.includes("elide-chrono-node.ts")) {
  console.log("✅ chrono-node - Natural Language Date Parser (POLYGLOT!)\n");

  const tomorrow = chrono.parseDate("tomorrow");
  const yesterday = chrono.parseDate("yesterday");
  const threeDaysAgo = chrono.parseDate("3 days ago");
  const inOneWeek = chrono.parseDate("in 1 week");

  console.log('Tomorrow:', tomorrow?.toDateString());
  console.log('Yesterday:', yesterday?.toDateString());
  console.log('3 days ago:', threeDaysAgo?.toDateString());
  console.log('In 1 week:', inOneWeek?.toDateString());

  console.log("\n🚀 ~3M downloads/week | Natural language date parsing\n");
}
