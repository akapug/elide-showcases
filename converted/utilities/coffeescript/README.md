# coffeescript - Elide Polyglot Showcase

> **One coffeescript implementation for ALL languages** - TypeScript, Python, Ruby, and Java

CoffeeScript compiler with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different CoffeeScript compilers** in each language creates:
- ❌ Inconsistent compilation across services
- ❌ Multiple compiler versions to maintain
- ❌ Complex build pipelines
- ❌ Platform-specific issues

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Clean syntax compilation
- ✅ Class and comprehension support
- ✅ Destructuring and splats
- ✅ String interpolation
- ✅ Source map support
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Fast compilation

## 🚀 Quick Start

### TypeScript

```typescript
import { compile } from './elide-coffeescript.ts';

const js = compile(coffeeCode, {
  bare: true,
  sourceMap: true
});
console.log(js);
```

### Python

```python
from elide import require
coffee = require('./elide-coffeescript.ts')

js = coffee.compile(coffee_code)
print(js)
```

### Ruby

```ruby
coffee = Elide.require('./elide-coffeescript.ts')

js = coffee.compile(coffee_code)
puts js
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value coffee = context.eval("js", "require('./elide-coffeescript.ts')");

String js = coffee.getMember("compile").execute(coffeeCode).asString();
System.out.println(js);
```

## 📊 Performance

Fast CoffeeScript compilation optimized for Elide runtime.

## 🎯 Why Polyglot?

One CoffeeScript compiler for all languages ensures consistent output and simplifies builds.

## 💡 Use Cases

Perfect for CoffeeScript projects, legacy code maintenance, and clean syntax compilation.

## 📂 Files in This Showcase

- `elide-coffeescript.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

### Run the demo

```bash
elide run elide-coffeescript.ts
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm coffeescript package](https://www.npmjs.com/package/coffeescript)
- [GitHub: elide-showcases](https://github.com/elide-dev/elide-showcases)

## 📝 Package Stats

- **npm downloads**: 300K+/week
- **Use case**: CoffeeScript compilation
- **Elide advantage**: Unified compiler
- **Polyglot score**: High

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Proving that one tool can rule them all.*
