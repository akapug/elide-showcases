# sanitize-html - Elide Polyglot Showcase

> **HTML sanitization for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Remove dangerous HTML tags and attributes
- Configurable allowlists for tags and attributes
- Protection against XSS attacks
- URL sanitization
- **~8M downloads/week on npm**

## Quick Start

```typescript
import sanitizeHtml from './elide-sanitize-html.ts';

// Basic sanitization
const clean = sanitizeHtml('<script>alert("XSS")</script><p>Safe content</p>');
// Result: '<p>Safe content</p>'

// Custom options
const result = sanitizeHtml(dirty, {
  allowedTags: ['p', 'br', 'strong', 'a'],
  allowedAttributes: { 'a': ['href'] }
});
```

## Security Benefits

- Removes `<script>` tags
- Strips event handlers (onclick, onerror, etc.)
- Blocks javascript: protocol
- Prevents data: URL XSS
- Configurable tag/attribute allowlists

## Links

- [Original npm package](https://www.npmjs.com/package/sanitize-html)

---

**Built with ❤️ for the Elide Polyglot Runtime**
