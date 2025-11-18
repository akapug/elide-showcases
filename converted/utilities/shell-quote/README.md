# Shell Quote - Elide Polyglot Showcase

> **One shell-quote implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and quote shell commands with a single implementation that works across your entire polyglot stack.

## ✨ Features

- ✅ Quote shell arguments safely
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Parse shell commands
- ✅ Prevent command injection
- ✅ Environment variable expansion

## 🚀 Quick Start

```typescript
import { quote, parse } from './elide-shell-quote.ts';

const cmd = quote(['rm', '-rf', 'my file.txt']);
const parsed = parse('echo "hello world"');
```

## 🌐 Links

- [npm shell-quote package](https://www.npmjs.com/package/shell-quote) (original, ~3M/week downloads)

---

**Built with ❤️ for the Elide Polyglot Runtime**
