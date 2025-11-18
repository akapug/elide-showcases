# Timekeeper - Time Mocking

Mock and control time in tests.

Based on [timekeeper](https://www.npmjs.com/package/timekeeper) (~200K+ downloads/week)

## Features

- ✅ Freeze time
- ✅ Travel through time
- ✅ Zero dependencies

## Quick Start

```typescript
import { freeze, travel, reset } from './elide-timekeeper.ts';

freeze(new Date('2024-01-01'));
console.log(new Date()); // 2024-01-01

travel(new Date('2025-01-01'));
reset();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
