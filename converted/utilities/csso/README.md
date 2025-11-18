# csso - Elide Polyglot Showcase

> **One csso implementation for ALL languages** - TypeScript, Python, Ruby, and Java

CSS optimization and minification with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different CSS optimizers** in each language creates:
- ❌ Inconsistent CSS output across services
- ❌ Multiple minification tools to maintain
- ❌ Different optimization strategies
- ❌ Build pipeline complexity

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ CSS minification
- ✅ Structural optimizations
- ✅ Merge duplicate rules
- ✅ Remove unused properties
- ✅ Safe transformations
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Fast optimization

## 🚀 Quick Start

### TypeScript

```typescript
import { minify } from './elide-csso.ts';

const result = minify(css, {
  restructure: true,
  comments: false
});
console.log(result.css);
```

### Python

```python
from elide import require
csso = require('./elide-csso.ts')

result = csso.minify(css)
print(result['css'])
```

### Ruby

```ruby
csso = Elide.require('./elide-csso.ts')

result = csso.minify(css)
puts result[:css]
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value csso = context.eval("js", "require('./elide-csso.ts')");

Value result = csso.getMember("minify").execute(css);
System.out.println(result.getMember("css").asString());
```

## 📊 Performance

Advanced CSS optimization with structural transformations - optimized for Elide runtime.

## 🎯 Why Polyglot?

One CSS optimizer for all languages ensures consistent output and simplifies asset pipelines.

## 💡 Use Cases

Perfect for production builds, CSS optimization, and asset minification.

## 📂 Files in This Showcase

- `elide-csso.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

### Run the demo

```bash
elide run elide-csso.ts
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm csso package](https://www.npmjs.com/package/csso)
- [GitHub: elide-showcases](https://github.com/elide-dev/elide-showcases)

## 📝 Package Stats

- **npm downloads**: 500K+/week
- **Use case**: CSS optimization, minification
- **Elide advantage**: Structural optimizations
- **Polyglot score**: High

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Proving that one tool can rule them all.*
