# rrule - Elide Polyglot Showcase

> **Recurrence rules for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- iCalendar recurrence rules (RFC 5545)
- Daily, weekly, monthly, yearly recurrence
- **~3M downloads/week on npm**

## Quick Start

```typescript
import RRule from './elide-rrule.ts';

const rule = new RRule({ freq: RRule.DAILY, count: 5 });
rule.all(); // Get all occurrences

const weeklyRule = new RRule({ freq: RRule.WEEKLY, interval: 2 });
weeklyRule.between(startDate, endDate);
```

## Links

- [Original npm package](https://www.npmjs.com/package/rrule)

---

**Built with ❤️ for the Elide Polyglot Runtime**
