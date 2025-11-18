# HTML to Text - Elide Polyglot Showcase

> **One HTML-to-text converter for ALL languages** - TypeScript, Python, Ruby, and Java

Advanced HTML to plain text converter with formatting options.

## Features

- HTML to plain text conversion
- Preserve formatting
- Link extraction
- Table conversion
- List formatting
- **~8M downloads/week on npm**

## Quick Start

```typescript
import { convert } from './elide-html-to-text.ts';

const html = `
  <h1>Title</h1>
  <p>This is a <strong>paragraph</strong> with a <a href="https://example.com">link</a>.</p>
  <ul>
    <li>Item 1</li>
    <li>Item 2</li>
  </ul>
`;

const text = convert(html, {
  wordwrap: 80,
  uppercaseHeadings: true
});

console.log(text);
```

## Links

- [Original npm package](https://www.npmjs.com/package/html-to-text)

---

**Built with ❤️ for the Elide Polyglot Runtime**
