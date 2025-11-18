# jest-snapshot - Elide Polyglot Showcase

> **One snapshot testing library for ALL languages** - TypeScript, Python, Ruby, and Java

Jest's snapshot testing utilities.

## Features

- Snapshot testing
- Inline snapshots
- Update snapshots
- Snapshot serializers
- Zero dependencies
- **~5M downloads/week on npm**

## Quick Start

```typescript
import { toMatchSnapshot } from './elide-jest-snapshot.ts';

const result = toMatchSnapshot({ name: 'Alice' }, 'test-1');
expect(result.pass).toBeTruthy();
```

## Links

- [Original npm package](https://www.npmjs.com/package/jest-snapshot)

---

**Built with ❤️ for the Elide Polyglot Runtime**
