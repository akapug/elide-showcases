# MockDate - Date Mocking

Mock JavaScript Date object.

Based on [mockdate](https://www.npmjs.com/package/mockdate) (~500K+ downloads/week)

## Features

- ✅ Mock Date constructor
- ✅ Freeze time
- ✅ Zero dependencies

## Quick Start

```typescript
import MockDate from './elide-mockdate.ts';

MockDate.set('2024-01-01');
console.log(new Date()); // 2024-01-01

MockDate.reset();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
