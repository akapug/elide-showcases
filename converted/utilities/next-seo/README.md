# Next SEO - Elide Polyglot Showcase

> **One SEO manager for ALL languages** - TypeScript, Python, Ruby, and Java

Manage SEO in Next.js applications with a single implementation that works across your entire polyglot stack.

## Features

- Configure page SEO (title, description)
- Open Graph support
- Twitter Card support
- Canonical URLs
- **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- Zero dependencies

## Quick Start

```typescript
import { generateSEO } from './elide-next-seo.ts';

const seo = generateSEO({
  title: 'My Page',
  description: 'Best page ever',
  openGraph: {
    title: 'My Page',
    type: 'website',
    images: [{ url: 'https://example.com/og.jpg' }],
  },
});

console.log(seo);
```

## Package Stats

- **npm downloads**: ~500K+/week
- **Use case**: Next.js SEO management
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**
