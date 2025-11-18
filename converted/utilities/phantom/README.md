# phantom - Elide Polyglot Showcase

> **PhantomJS integration for ALL languages** - TypeScript, Python, Ruby, and Java

Headless WebKit scriptable with JavaScript.

## Features

- Headless browsing
- Page rendering
- Screenshot capture
- PDF generation
- Network monitoring
- **Polyglot**: Use from TypeScript, Python, Ruby, Java
- Zero dependencies

## Quick Start

```typescript
import phantom from './elide-phantom.ts';

const instance = await phantom.create();
const page = await instance.createPage();
await page.open('https://example.com');
await page.render('screenshot.png');
await instance.exit();
```

## Use Cases

- Web scraping
- Automated testing
- Screenshot generation
- PDF generation

## Stats

- **npm downloads**: ~100K+/week
- **Use case**: Headless browsing
- **Elide advantage**: Consistent automation across all languages
