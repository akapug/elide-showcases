# Glob for Elide

Match files using shell patterns.

**Downloads**: ~18M/week on npm

## Quick Start

```typescript
import glob from './glob.ts';

const files = glob('**/*.ts');
const srcFiles = glob('src/**/*', { ignore: ['**/*.test.ts'] });
```

## Resources

- Original: https://www.npmjs.com/package/glob
