# Mnemonist - Data Structures

Curated collection of data structures.

Based on [mnemonist](https://www.npmjs.com/package/mnemonist) (~100K+ downloads/week)

```typescript
import { Stack, Heap } from './elide-mnemonist.ts';

const stack = new Stack<number>();
stack.push(1);
stack.pop(); // 1

const heap = new Heap<number>();
heap.push(5);
heap.push(2);
heap.pop(); // 2 (min)
```

Run: `elide run elide-mnemonist.ts`
