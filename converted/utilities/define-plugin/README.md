# define-plugin - Elide Polyglot Showcase

> **Compile-time constants for ALL build systems** - TypeScript, Python, Ruby, and Java

## Features

- Define global constants
- Environment variables
- Feature flags
- **~100K+ projects/week**

## Quick Start

```typescript
import DefinePlugin from './elide-define-plugin.ts';

const plugin = new DefinePlugin({
  'process.env.NODE_ENV': 'production',
  'API_URL': 'https://api.example.com'
});

const code = plugin.replace('fetch(API_URL)');
```

## Links

- [Webpack DefinePlugin](https://webpack.js.org/plugins/define-plugin/)

---

**Built with ❤️ for the Elide Polyglot Runtime**
