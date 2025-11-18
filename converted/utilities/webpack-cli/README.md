# webpack-cli - Elide Polyglot Showcase

> **One webpack-cli implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Command line interface for webpack with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different webpack-cli implementations** in each language creates:
- ❌ Inconsistent behavior across services
- ❌ Multiple tools to maintain
- ❌ Complex configuration management
- ❌ Build reproducibility issues

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Core webpack cli functionality
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies (core logic)
- ✅ High performance
- ✅ Consistent behavior across all languages

## 🚀 Quick Start

### TypeScript

```typescript
import { process } from './elide-webpack-cli.ts';

const result = process(input);
console.log(result);
```

### Python

```python
from elide import require
tool = require('./elide-webpack-cli.ts')

result = tool.process(input)
print(result)
```

### Ruby

```ruby
tool = Elide.require('./elide-webpack-cli.ts')

result = tool.process(input)
puts result
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value tool = context.eval("js", "require('./elide-webpack-cli.ts')");

Value result = tool.getMember("process").execute(input);
System.out.println(result);
```

## 📊 Performance

Build tool performance optimized for Elide runtime.

## 🎯 Why Polyglot?

One webpack-cli implementation for all languages eliminates inconsistencies and reduces maintenance overhead.

## 💡 Use Cases

Perfect for build automation, code transformation, asset optimization, and development workflows.

## 📂 Files in This Showcase

- `elide-webpack-cli.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

### Run the demo

```bash
elide run elide-webpack-cli.ts
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm webpack-cli package](https://www.npmjs.com/package/webpack-cli)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: 20M+/week
- **Use case**: Build tool, code transformation
- **Elide advantage**: One implementation for all languages
- **Polyglot score**: High

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Proving that one tool can rule them all.*
