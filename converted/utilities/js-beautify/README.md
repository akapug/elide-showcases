# js-beautify - Elide Polyglot Showcase

> **JavaScript/HTML/CSS beautifier for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Beautify JavaScript, JSON, HTML, and CSS
- Highly configurable formatting options
- Handle minified code gracefully
- **8M+ downloads/week on npm**
- CLI and programmatic API
- Preserve formatting hints

## Quick Start

```typescript
import { js_beautify, css_beautify, html_beautify } from './elide-js-beautify.ts';

// Simple beautification
const pretty = js_beautify('function test(){return 42;}', {
  indent_size: 2,
  brace_style: 'collapse',
});

// Advanced usage
import { JSBeautify } from './elide-js-beautify.ts';
const beautifier = new JSBeautify({ indent_size: 4 });
const code = beautifier.js(minifiedCode);
```

## Links

- [Original npm package](https://www.npmjs.com/package/js-beautify)

---

**Built with ❤️ for the Elide Polyglot Runtime**
