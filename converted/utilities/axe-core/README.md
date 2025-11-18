# axe-core - Elide Polyglot Showcase

> **Accessibility testing engine for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- WCAG 2.0/2.1/2.2 compliance checking
- Section 508 testing
- ARIA validation
- Automated rule engine
- **~1M+ downloads/week on npm**

## Quick Start

```typescript
import axe from './elide-axe-core.ts';

const html = '<button></button>';
const results = axe.run(html);
console.log(results.violations);
```

## Links

- [Original npm package](https://www.npmjs.com/package/axe-core)

---

**Built with ❤️ for the Elide Polyglot Runtime**
