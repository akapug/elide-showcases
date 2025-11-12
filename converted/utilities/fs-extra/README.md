# fs-extra for Elide

Extra file system methods that aren't included in the native fs module.

**Downloads**: ~17M/week on npm

## Quick Start

```typescript
import fs from './fs-extra.ts';

await fs.copy('/source', '/destination');
await fs.ensureDir('/path/to/dir');
await fs.remove('/path/to/remove');
const data = await fs.readJson('/config.json');
await fs.writeJson('/config.json', { key: 'value' });
```

## Resources

- Original: https://www.npmjs.com/package/fs-extra
