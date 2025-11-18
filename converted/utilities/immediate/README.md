# Immediate - setImmediate Polyfill

Cross-platform setImmediate implementation.

Based on [immediate](https://www.npmjs.com/package/immediate) (~2M+ downloads/week)

```typescript
import { setImmediate } from './elide-immediate.ts';

setImmediate(() => console.log("Next!"));
```

Run: `elide run elide-immediate.ts`
