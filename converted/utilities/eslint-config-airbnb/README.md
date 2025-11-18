# ESLint Config Airbnb - Elide Polyglot Showcase

> **One linting configuration for ALL your JavaScript projects** - React, Node.js, TypeScript

Airbnb's ESLint configuration with React, Hooks, and best practices.

## Features

- Airbnb JavaScript Style Guide rules
- React and JSX best practices
- ES6+ modern syntax support
- Import/export validation
- Accessibility (a11y) rules
- Zero dependencies (pure TypeScript)
- **~3M downloads/week on npm**

## Quick Start

```typescript
import airbnbConfig from './elide-eslint-config-airbnb.ts';

// Get the full ESLint configuration
const config = airbnbConfig.getConfig();
console.log(config);

// Validate code against a rule
const result = airbnbConfig.validateRule('no-var', 'var x = 10;');
console.log(result); // { passed: false, message: 'Use let or const instead of var' }

// Get rules by category
const reactRules = airbnbConfig.getRulesByCategory('React');
console.log(reactRules);
```

## Documentation

Run the demo:

```bash
elide run elide-eslint-config-airbnb.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-config-airbnb)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)

---

**Built with ❤️ for the Elide Polyglot Runtime**
