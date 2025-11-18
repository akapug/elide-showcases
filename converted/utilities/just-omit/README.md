# Just Omit - Object Property Omission

Omit specific properties from objects.

Based on [just-omit](https://www.npmjs.com/package/just-omit) (~30K+ downloads/week)

## Quick Start

```typescript
import omit from './elide-just-omit.ts';

const user = { id: 1, name: "Alice", password: "secret" };
const safe = omit(user, ["password"]); // { id: 1, name: "Alice" }
```

Run: `elide run elide-just-omit.ts`
