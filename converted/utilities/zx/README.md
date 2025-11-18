# ZX - Elide Polyglot Showcase

> **One zx implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Shell scripting with JavaScript/TypeScript and a single implementation that works across your entire polyglot stack.

## ✨ Features

- ✅ Shell scripting with JS/TS
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Template literal commands
- ✅ Promise-based execution
- ✅ Colorful output
- ✅ Automatic quoting

## 🚀 Quick Start

### TypeScript

```typescript
import { $, cd, sleep } from './elide-zx.ts';

const result = await $`ls -la`;
await sleep(1000);
cd('/tmp');
```

## 💡 Use Cases

Build automation, DevOps scripts, CLI tools, CI/CD

## 🌐 Links

- [npm zx package](https://www.npmjs.com/package/zx) (original, ~300K/week downloads)

---

**Built with ❤️ for the Elide Polyglot Runtime**
