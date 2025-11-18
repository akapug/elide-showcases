/**
 * Chrono - Natural Language Date Parser for Elide
 * NPM: 500K+ downloads/week
 */

export function parseDate(text: string, refDate?: Date): Date | null {
  const ref = refDate || new Date();
  const lowerText = text.toLowerCase().trim();

  // Today
  if (lowerText === 'today') return new Date(ref);

  // Tomorrow
  if (lowerText === 'tomorrow') {
    const tomorrow = new Date(ref);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }

  // Yesterday
  if (lowerText === 'yesterday') {
    const yesterday = new Date(ref);
    yesterday.setDate(yesterday.getDate() - 1);
    return yesterday;
  }

  // Next week
  if (lowerText === 'next week') {
    const next = new Date(ref);
    next.setDate(next.getDate() + 7);
    return next;
  }

  // ISO date
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) {
    return new Date(text);
  }

  // Try standard Date parsing
  const parsed = new Date(text);
  if (!isNaN(parsed.getTime())) return parsed;

  return null;
}

export function parse(text: string, refDate?: Date): Date[] {
  const result = parseDate(text, refDate);
  return result ? [result] : [];
}

if (import.meta.url.includes("chrono")) {
  console.log("🎯 Chrono for Elide - Natural Language Date Parser\n");
  console.log("Parse 'today':", parseDate('today'));
  console.log("Parse 'tomorrow':", parseDate('tomorrow'));
  console.log("Parse 'next week':", parseDate('next week'));
  console.log("Parse '2024-12-25':", parseDate('2024-12-25'));
}

export default { parseDate, parse };
