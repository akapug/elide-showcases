# ESLint Config Next - Elide Polyglot Showcase

> **Next.js ESLint Configuration** - Official linting for Next.js apps

ESLint configuration for Next.js with Core Web Vitals support.

## Features

- Next.js-specific rules (Image, Link, Script)
- React and Hooks validation
- Core Web Vitals optimization
- Accessibility checks
- Performance best practices
- Zero dependencies
- **~2M downloads/week on npm**

## Quick Start

```typescript
import nextConfig from './elide-eslint-config-next.ts';

// Get full configuration
const config = nextConfig.getConfig();

// Get Core Web Vitals config
const cwvConfig = nextConfig.getCoreWebVitalsConfig();

// Validate Next.js code
const result = nextConfig.validate('<a href="/about">About</a>');
console.log(result); // { passed: false, issues: [...] }
```

## Documentation

Run the demo:

```bash
elide run elide-eslint-config-next.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/eslint-config-next)
- [Next.js ESLint](https://nextjs.org/docs/basic-features/eslint)

---

**Built with ❤️ for the Elide Polyglot Runtime**
