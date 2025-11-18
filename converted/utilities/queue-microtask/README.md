# Queue Microtask - Microtask Scheduling

Schedule microtasks for next tick execution.

Based on [queue-microtask](https://www.npmjs.com/package/queue-microtask) (~10M+ downloads/week)

```typescript
import queueMicrotask from './elide-queue-microtask.ts';

console.log("1");
queueMicrotask(() => console.log("2"));
console.log("3");
// Output: 1, 3, 2
```

Run: `elide run elide-queue-microtask.ts`
