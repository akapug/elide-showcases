# classnames - Elide Polyglot Showcase

> **Conditional className utility - ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Conditional classes
- Object notation
- Array support
- **~10M downloads/week on npm**

## Quick Start

```typescript
import classNames from './elide-classnames.ts';

const classes = classNames('foo', { bar: true, baz: false });
// => 'foo bar'

const dynamic = classNames({
  'btn': true,
  'btn-active': isActive,
  'btn-disabled': disabled
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/classnames)

---

**Built with ❤️ for the Elide Polyglot Runtime**
