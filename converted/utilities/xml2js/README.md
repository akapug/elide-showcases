# XML2JS - Elide Polyglot Showcase

> **One XML parser for ALL languages**

## Quick Start

```typescript
import { parseString, Builder } from './elide-xml2js.ts';

// Parse XML to JS
parseString('<root><name>John</name></root>', (err, result) => {
  console.log(result);
});

// Build XML from JS
const builder = new Builder();
const xml = builder.buildObject({ root: { name: 'John' } });
```

## Package Stats

- **npm downloads**: ~10M/week
- **Polyglot score**: 42/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
