# ESLint Config Google - Elide Polyglot Showcase

> **Google's JavaScript Style Guide** - Enterprise-grade coding standards

Google's JavaScript style guide as an ESLint configuration.

## Features

- 2 space indentation
- Single quotes for strings
- Require semicolons
- Max line length 80 characters
- Google's naming conventions
- Zero dependencies
- **~200K downloads/week on npm**

## Quick Start

```typescript
import googleConfig from './elide-eslint-config-google.ts';

// Get configuration
const config = googleConfig.getConfig();

// Validate a line of code
const result = googleConfig.validateLine('const x = "test"');
console.log(result);

// Get rules by category
const styleRules = googleConfig.getRulesByCategory('Style');
```

## Documentation

Run the demo:

```bash
elide run elide-eslint-config-google.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-config-google)
- [Google JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html)

---

**Built with ❤️ for the Elide Polyglot Runtime**
