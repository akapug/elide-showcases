# Sinon Fake Timers - Fake Timers

Sinon's fake timer implementation.

Based on [@sinonjs/fake-timers](https://www.npmjs.com/package/@sinonjs/fake-timers) (~10M+ downloads/week)

## Features

- ✅ Fake timers
- ✅ Time control
- ✅ Zero dependencies

## Quick Start

```typescript
import { install } from './elide-sinonjs-fake-timers.ts';

const clock = install();
clock.setTimeout(() => console.log('fired'), 1000);
clock.tick(1000);
clock.restore();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
