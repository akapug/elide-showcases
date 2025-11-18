# ESLint Plugin React - Elide Polyglot Showcase

> **React-specific ESLint rules** - Catch React mistakes early

React-specific linting rules for ESLint.

## Features

- JSX syntax validation
- Component best practices
- Prop validation
- Hook usage rules
- Performance optimizations
- Zero dependencies
- **~10M downloads/week on npm**

## Quick Start

```typescript
import reactPlugin from './elide-eslint-plugin-react.ts';

// Get all rules
const rules = reactPlugin.getRules();

// Validate React code
const result = reactPlugin.validate('items.map(item => <div>{item}</div>)');
console.log(result); // { passed: false, violations: ['Missing key...'] }

// Get configuration
const config = reactPlugin.getConfig();
```

## Documentation

Run the demo:

```bash
elide run elide-eslint-plugin-react.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-plugin-react)
- [Documentation](https://github.com/jsx-eslint/eslint-plugin-react)

---

**Built with ❤️ for the Elide Polyglot Runtime**
