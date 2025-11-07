/**
 * Cron Expression Parser
 * Parse and validate cron expressions
 */

export interface CronParts {
  minute: string;
  hour: string;
  dayOfMonth: string;
  month: string;
  dayOfWeek: string;
}

export function parse(expression: string): CronParts {
  const parts = expression.trim().split(/\s+/);

  if (parts.length !== 5) {
    throw new Error('Cron expression must have exactly 5 fields');
  }

  return {
    minute: parts[0],
    hour: parts[1],
    dayOfMonth: parts[2],
    month: parts[3],
    dayOfWeek: parts[4]
  };
}

export function describe(expression: string): string {
  const parts = parse(expression);
  const descriptions: string[] = [];

  // Minute
  if (parts.minute === '*') descriptions.push('every minute');
  else if (parts.minute.includes('/')) {
    const [_, interval] = parts.minute.split('/');
    descriptions.push(`every ${interval} minutes`);
  } else descriptions.push(`at minute ${parts.minute}`);

  // Hour
  if (parts.hour !== '*') {
    if (parts.hour.includes('/')) {
      const [_, interval] = parts.hour.split('/');
      descriptions.push(`every ${interval} hours`);
    } else descriptions.push(`at hour ${parts.hour}`);
  }

  // Day
  if (parts.dayOfMonth !== '*') {
    descriptions.push(`on day ${parts.dayOfMonth}`);
  }

  // Month
  if (parts.month !== '*') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthNum = parseInt(parts.month) - 1;
    descriptions.push(`in ${months[monthNum]}`);
  }

  // Day of week
  if (parts.dayOfWeek !== '*') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const dayNum = parseInt(parts.dayOfWeek);
    descriptions.push(`on ${days[dayNum]}`);
  }

  return descriptions.join(', ');
}

export function isValid(expression: string): boolean {
  try {
    parse(expression);
    return true;
  } catch {
    return false;
  }
}

// CLI demo
if (import.meta.url.includes("cron-parser.ts")) {
  console.log("Cron Parser Demo\n");

  const examples = [
    "* * * * *",           // Every minute
    "0 * * * *",           // Every hour
    "0 0 * * *",           // Daily at midnight
    "0 0 * * 0",           // Weekly on Sunday
    "0 0 1 * *",           // Monthly on 1st
    "*/5 * * * *",         // Every 5 minutes
    "0 */2 * * *",         // Every 2 hours
    "0 9 * * 1-5",         // Weekdays at 9am
    "0 0 1 1 *"            // Yearly on Jan 1st
  ];

  examples.forEach(expr => {
    console.log(`${expr}`);
    console.log(`  → ${describe(expr)}\n`);
  });

  console.log("Validation:");
  console.log("  Valid?", isValid("0 0 * * *"));
  console.log("  Invalid?", !isValid("invalid"));

  console.log("✅ Cron parser test passed");
}
