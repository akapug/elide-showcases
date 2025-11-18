# ESLint Plugin JSX A11y - Elide Polyglot Showcase

> **Accessibility linting for JSX** - Make your apps accessible to everyone

Static AST checker for accessibility rules on JSX elements.

## Features

- ARIA role validation
- Alt text checking
- Keyboard accessibility
- Focus management
- Semantic HTML enforcement
- **~5M downloads/week on npm**

## Quick Start

```typescript
import a11yPlugin from './elide-eslint-plugin-jsx-a11y.ts';

const result = a11yPlugin.validate('<img src="logo.png" />');
console.log(result); // { passed: false, violations: ['Image missing alt text'] }
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-plugin-jsx-a11y)

---

**Built with ❤️ for the Elide Polyglot Runtime**
