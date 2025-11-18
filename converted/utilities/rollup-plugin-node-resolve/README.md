# rollup-plugin-node-resolve - Elide Polyglot Showcase

> **One rollup-plugin-node-resolve implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Locate third-party dependencies with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different rollup-plugin-node-resolve implementations** in each language creates:
- ❌ Inconsistent behavior across services
- ❌ Multiple tools to maintain
- ❌ Complex configuration management
- ❌ Build reproducibility issues

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Core resolver functionality
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies (core logic)
- ✅ High performance
- ✅ Consistent behavior across all languages

## 🚀 Quick Start

### TypeScript

```typescript
import { process } from './elide-rollup-plugin-node-resolve.ts';

const result = process(input);
console.log(result);
```

### Python

```python
from elide import require
tool = require('./elide-rollup-plugin-node-resolve.ts')

result = tool.process(input)
print(result)
```

### Ruby

```ruby
tool = Elide.require('./elide-rollup-plugin-node-resolve.ts')

result = tool.process(input)
puts result
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value tool = context.eval("js", "require('./elide-rollup-plugin-node-resolve.ts')");

Value result = tool.getMember("process").execute(input);
System.out.println(result);
```

## 📊 Performance

Build tool performance optimized for Elide runtime.

## 🎯 Why Polyglot?

One rollup-plugin-node-resolve implementation for all languages eliminates inconsistencies and reduces maintenance overhead.

## 💡 Use Cases

Perfect for build automation, code transformation, asset optimization, and development workflows.

## 📂 Files in This Showcase

- `elide-rollup-plugin-node-resolve.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

### Run the demo

```bash
elide run elide-rollup-plugin-node-resolve.ts
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm @rollup/plugin-node-resolve package](https://www.npmjs.com/package/@rollup/plugin-node-resolve)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: 10M+/week
- **Use case**: Build tool, code transformation
- **Elide advantage**: One implementation for all languages
- **Polyglot score**: High

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Proving that one tool can rule them all.*
