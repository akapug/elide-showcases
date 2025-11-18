# JSON-LD - Elide Polyglot Showcase

> **One JSON-LD generator for ALL languages** - TypeScript, Python, Ruby, and Java

Generate JSON-LD structured data with a single implementation that works across your entire polyglot stack.

## Features

- Generate Schema.org JSON-LD
- Support for Article, Product, Organization
- Type-safe API
- **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- Zero dependencies

## Quick Start

```typescript
import { createArticle, toScript } from './elide-json-ld.ts';

const article = createArticle({
  headline: 'Best Practices',
  author: 'John Doe',
  datePublished: '2024-01-01',
});

console.log(toScript(article));
```

## Package Stats

- **npm downloads**: ~50K+/week
- **Use case**: Structured data for SEO
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**
