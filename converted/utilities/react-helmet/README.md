# React Helmet - Elide Polyglot Showcase

> **One document head manager for ALL languages** - TypeScript, Python, Ruby, and Java

Manage document head tags (title, meta, link) with a single implementation that works across your entire polyglot stack.

## Features

- Set page title with templates
- Manage meta tags (description, keywords, Open Graph, Twitter)
- Manage link tags (canonical, alternate)
- Server-side rendering support
- **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- Zero dependencies

## Quick Start

```typescript
import { helmet, setTitle, setMeta } from './elide-react-helmet.ts';

setTitle('Home', '%s | My Site');
setMeta([
  { name: 'description', content: 'Best site ever' },
  { property: 'og:title', content: 'My Site' },
]);

const rendered = helmet.renderStatic();
console.log(rendered.title); // <title>Home | My Site</title>
```

## Package Stats

- **npm downloads**: ~2M+/week
- **Use case**: React SEO and meta tag management
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**
