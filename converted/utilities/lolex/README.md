# Lolex - Timer Mocking

Mock timers and time functions.

Based on [lolex](https://www.npmjs.com/package/lolex) (~1M+ downloads/week)

## Features

- ✅ Mock setTimeout/setInterval
- ✅ Control time flow
- ✅ Zero dependencies

## Quick Start

```typescript
import { install } from './elide-lolex.ts';

const clock = install();
clock.setTimeout(() => console.log('fired'), 1000);
clock.tick(1000);
clock.reset();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
