# Just Pluck - Array Property Extraction

Extract property values from array of objects.

Based on [just-pluck](https://www.npmjs.com/package/just-pluck) (~10K+ downloads/week)

```typescript
import pluck from './elide-just-pluck.ts';

const users = [{ name: "Alice" }, { name: "Bob" }];
pluck(users, 'name'); // ["Alice", "Bob"]
```

Run: `elide run elide-just-pluck.ts`
