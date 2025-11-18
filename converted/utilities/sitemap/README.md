# Sitemap - Elide Polyglot Showcase

> **One XML sitemap generator for ALL languages** - TypeScript, Python, Ruby, and Java

Generate XML sitemaps for SEO with a single implementation that works across your entire polyglot stack.

## Features

- Generate XML sitemaps
- Support for lastmod, changefreq, priority
- Automatic URL escaping
- **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- Zero dependencies

## Quick Start

```typescript
import { Sitemap } from './elide-sitemap.ts';

const sitemap = new Sitemap();
sitemap.add({
  url: 'https://example.com/',
  changefreq: 'daily',
  priority: 1.0,
});

console.log(sitemap.toString());
```

## Package Stats

- **npm downloads**: ~200K+/week
- **Use case**: SEO sitemap generation
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**
