# Next Tick - Next Tick Scheduling

Schedule callbacks for next event loop tick.

Based on [next-tick](https://www.npmjs.com/package/next-tick) (~100K+ downloads/week)

```typescript
import nextTick from './elide-next-tick.ts';

console.log("1");
nextTick(() => console.log("2"));
console.log("3");
// Output: 1, 3, 2
```

Run: `elide run elide-next-tick.ts`
