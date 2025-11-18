# dotenv-webpack - Elide Polyglot Showcase

> **Environment management for ALL build systems**

## Features

- Load .env files
- Environment variable injection
- Multiple .env files
- **~500K+ downloads/week on npm**

## Quick Start

```typescript
import DotenvWebpackPlugin from './elide-dotenv-webpack.ts';

const plugin = new DotenvWebpackPlugin({ path: '.env' });
const apiKey = plugin.get('API_KEY');
const definitions = plugin.toDefinePlugin();
```

## Links

- [Original npm package](https://www.npmjs.com/package/dotenv-webpack)

---

**Built with ❤️ for the Elide Polyglot Runtime**
