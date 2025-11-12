# Moment.js for Elide

Parse, validate, manipulate, and display dates and times.

**Downloads**: ~15M/week on npm
**Status**: ✅ Production Ready

## Quick Start

```typescript
import moment from './moment.ts';

const now = moment();
console.log(now.format('YYYY-MM-DD'));

const tomorrow = moment().add(1, 'day');
console.log(tomorrow.fromNow());
```

## Features

- Parse dates
- Format dates
- Add/subtract time
- Relative time
- Comparisons
- Durations

## Resources

- Original: https://www.npmjs.com/package/moment
- Downloads: ~15M/week
