# Robots Parser - Elide Polyglot Showcase

> **One robots.txt parser for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and query robots.txt files with a single implementation that works across your entire polyglot stack.

## Features

- Parse robots.txt content
- Check if URL is allowed for user-agent
- Extract sitemaps
- **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- Zero dependencies

## Quick Start

```typescript
import { RobotsParser } from './elide-robots-parser.ts';

const parser = new RobotsParser();
parser.parse('User-agent: *\nDisallow: /admin/');

console.log(parser.isAllowed('/admin/')); // false
console.log(parser.isAllowed('/public/')); // true
```

## Package Stats

- **npm downloads**: ~100K+/week
- **Use case**: robots.txt parsing
- **Elide advantage**: One implementation for all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**
