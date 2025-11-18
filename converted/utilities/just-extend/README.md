# Just Extend - Object Extension

Deep merge objects safely.

Based on [just-extend](https://www.npmjs.com/package/just-extend) (~30K+ downloads/week)

```typescript
import extend from './elide-just-extend.ts';

const defaults = { host: 'localhost', port: 3000 };
const config = { port: 8080 };
extend({}, defaults, config); // { host: 'localhost', port: 8080 }
```

Run: `elide run elide-just-extend.ts`
