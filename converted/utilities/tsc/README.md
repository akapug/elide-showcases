# tsc - Elide Polyglot Showcase

> **TypeScript compiler for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Compile TypeScript to JavaScript
- Type checking and validation
- Declaration file generation
- **50M+ downloads/week on npm**
- Source map support
- Watch mode and incremental builds

## Quick Start

```typescript
import { TypeScriptCompiler } from './elide-tsc.ts';

const compiler = new TypeScriptCompiler({
  compilerOptions: {
    target: 'ES2020',
    strict: true,
    sourceMap: true,
  },
});

const result = compiler.compile(tsCode, 'app.ts');
console.log(result.outputText);
console.log(result.diagnostics);
```

## Links

- [Original npm package](https://www.npmjs.com/package/typescript)

---

**Built with ❤️ for the Elide Polyglot Runtime**
