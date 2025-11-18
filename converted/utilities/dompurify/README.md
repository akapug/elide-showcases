# DOMPurify - Elide Polyglot Showcase

> **Industry-standard XSS sanitizer for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- DOM-based XSS sanitizer
- Protection against XSS, DOM clobbering, prototype pollution
- Configurable hooks and transforms
- Safe HTML, SVG, and MathML sanitization
- **~15M downloads/week on npm**

## Quick Start

```typescript
import DOMPurify from './elide-dompurify.ts';

// Basic sanitization
const clean = DOMPurify.sanitize('<img src=x onerror="alert(1)">');
// Result: '<img src=x>'

// Custom configuration
const safe = DOMPurify.sanitize(dirty, {
  ALLOWED_TAGS: ['p', 'br', 'strong'],
  ALLOWED_ATTR: ['class'],
  SAFE_FOR_TEMPLATES: true
});
```

## Security Features

- Removes XSS vectors (script, iframe, object, embed)
- Strips all event handlers
- Blocks dangerous protocols (javascript:, vbscript:, data:)
- Template injection protection
- Configurable allowlists and denylists

## Links

- [Original npm package](https://www.npmjs.com/package/dompurify)

---

**Built with ❤️ for the Elide Polyglot Runtime**
