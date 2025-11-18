# Consolidate - Elide Polyglot Showcase

> **One unified API for ALL template engines** - TypeScript, Python, Ruby, and Java

Template engine consolidation library with support for 20+ engines.

## Features

- Unified template API
- Support for 20+ engines
- Async rendering
- Promise-based
- **~15M downloads/week on npm**

## Quick Start

```typescript
import Consolidate from './elide-consolidate.ts';

const cons = new Consolidate();
const html = await cons.render('ejs', 'Hello <%= name %>!', { name: 'World' });
```

## Links

- [Original npm package](https://www.npmjs.com/package/consolidate)

---

**Built with ❤️ for the Elide Polyglot Runtime**
