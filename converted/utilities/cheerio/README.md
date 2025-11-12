# Cheerio - Elide Polyglot Showcase

> **One HTML parser for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and manipulate HTML with jQuery-like syntax using a single implementation across your entire polyglot stack.

## Why This Matters

- ✅ jQuery-like API for HTML parsing
- ✅ Extract data from HTML
- ✅ Web scraping
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## Quick Start

```typescript
import { load } from './elide-cheerio.ts';

const $ = load('<h1 class="title">Hello</h1>');
console.log($('.title').text()); // "Hello"
```

## Package Stats

- **npm downloads**: ~16M/week (cheerio)
- **Use case**: HTML parsing, web scraping
- **Polyglot score**: 43/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
