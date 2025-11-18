# pa11y - Elide Polyglot Showcase

> **Automated accessibility testing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automated page scanning
- WCAG 2.0/2.1 testing
- HTML CodeSniffer integration
- CI/CD integration
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import Pa11y from './elide-pa11y.ts';

const pa11y = new Pa11y();
const results = await pa11y.test('https://example.com');
console.log(results.issues);
```

## Links

- [Original npm package](https://www.npmjs.com/package/pa11y)

---

**Built with ❤️ for the Elide Polyglot Runtime**
