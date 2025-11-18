# buble - Elide Polyglot Showcase

> **One buble implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Blazing fast ES2015 compiler with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different ES2015 compilers** in each language creates:
- ❌ Inconsistent transpilation across services
- ❌ Multiple tools to maintain
- ❌ Complex build configuration
- ❌ Slow compilation times

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Arrow functions transformation
- ✅ Template literals conversion
- ✅ Class transformation
- ✅ Destructuring support
- ✅ Default parameters
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Blazing fast compilation

## 🚀 Quick Start

### TypeScript

```typescript
import { transform } from './elide-buble.ts';

const result = transform(code, {
  transforms: { arrow: true, classes: true }
});
console.log(result.code);
```

### Python

```python
from elide import require
buble = require('./elide-buble.ts')

result = buble.transform(code)
print(result['code'])
```

### Ruby

```ruby
buble = Elide.require('./elide-buble.ts')

result = buble.transform(code)
puts result[:code]
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value buble = context.eval("js", "require('./elide-buble.ts')");

Value result = buble.getMember("transform").execute(code);
System.out.println(result.getMember("code").asString());
```

## 📊 Performance

Faster than Babel for simple ES2015 transformations - optimized for Elide runtime.

## 🎯 Why Polyglot?

One compiler for all languages ensures consistent ES5 output and reduces build complexity.

## 💡 Use Cases

Perfect for legacy browser support, library distribution, and fast modern JavaScript compilation.

## 📂 Files in This Showcase

- `elide-buble.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

### Run the demo

```bash
elide run elide-buble.ts
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm buble package](https://www.npmjs.com/package/buble)
- [GitHub: elide-showcases](https://github.com/elide-dev/elide-showcases)

## 📝 Package Stats

- **npm downloads**: 200K+/week
- **Use case**: ES2015 to ES5 compilation
- **Elide advantage**: Fast, simple transpilation
- **Polyglot score**: High

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Proving that one tool can rule them all.*
