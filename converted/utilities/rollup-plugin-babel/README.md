# rollup-plugin-babel - Elide Polyglot Showcase

> **One rollup-plugin-babel implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Integration with Babel with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different rollup-plugin-babel implementations** in each language creates:
- ❌ Inconsistent behavior across services
- ❌ Multiple tools to maintain
- ❌ Complex configuration management
- ❌ Build reproducibility issues

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Core babel plugin functionality
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies (core logic)
- ✅ High performance
- ✅ Consistent behavior across all languages

## 🚀 Quick Start

### TypeScript

```typescript
import { process } from './elide-rollup-plugin-babel.ts';

const result = process(input);
console.log(result);
```

### Python

```python
from elide import require
tool = require('./elide-rollup-plugin-babel.ts')

result = tool.process(input)
print(result)
```

### Ruby

```ruby
tool = Elide.require('./elide-rollup-plugin-babel.ts')

result = tool.process(input)
puts result
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value tool = context.eval("js", "require('./elide-rollup-plugin-babel.ts')");

Value result = tool.getMember("process").execute(input);
System.out.println(result);
```

## 📊 Performance

Build tool performance optimized for Elide runtime.

## 🎯 Why Polyglot?

One rollup-plugin-babel implementation for all languages eliminates inconsistencies and reduces maintenance overhead.

## 💡 Use Cases

Perfect for build automation, code transformation, asset optimization, and development workflows.

## 📂 Files in This Showcase

- `elide-rollup-plugin-babel.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

### Run the demo

```bash
elide run elide-rollup-plugin-babel.ts
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm rollup-plugin-babel package](https://www.npmjs.com/package/rollup-plugin-babel)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: 5M+/week
- **Use case**: Build tool, code transformation
- **Elide advantage**: One implementation for all languages
- **Polyglot score**: High

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Proving that one tool can rule them all.*
