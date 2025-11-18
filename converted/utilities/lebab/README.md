# lebab - Elide Polyglot Showcase

> **One lebab implementation for ALL languages** - TypeScript, Python, Ruby, and Java

ES5 to ES6+ code modernization with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different code modernization tools** in each language creates:
- ❌ Inconsistent code styles across services
- ❌ Multiple refactoring tools to maintain
- ❌ Manual modernization work
- ❌ Technical debt accumulation

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ var to let/const conversion
- ✅ Function to arrow function
- ✅ String concat to template literals
- ✅ Object shorthand properties
- ✅ Destructuring transformation
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Safe transformations

## 🚀 Quick Start

### TypeScript

```typescript
import { transform } from './elide-lebab.ts';

const result = transform(oldCode, {
  transforms: ['let', 'arrow', 'template']
});
console.log(result.code);
```

### Python

```python
from elide import require
lebab = require('./elide-lebab.ts')

result = lebab.transform(old_code)
print(result['code'])
```

### Ruby

```ruby
lebab = Elide.require('./elide-lebab.ts')

result = lebab.transform(old_code)
puts result[:code]
```

### Java

```java
Context context = Context.newBuilder("js").allowAllAccess(true).build();
Value lebab = context.eval("js", "require('./elide-lebab.ts')");

Value result = lebab.getMember("transform").execute(oldCode);
System.out.println(result.getMember("code").asString());
```

## 📊 Performance

Fast code modernization optimized for Elide runtime - process thousands of files quickly.

## 🎯 Why Polyglot?

One modernization tool for all languages ensures consistent code style and reduces refactoring overhead.

## 💡 Use Cases

Perfect for legacy code modernization, codebase upgrades, and automatic refactoring.

## 📂 Files in This Showcase

- `elide-lebab.ts` - Main TypeScript implementation
- `README.md` - This file

## 🧪 Testing

### Run the demo

```bash
elide run elide-lebab.ts
```

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm lebab package](https://www.npmjs.com/package/lebab)
- [GitHub: elide-showcases](https://github.com/elide-dev/elide-showcases)

## 📝 Package Stats

- **npm downloads**: 30K+/week
- **Use case**: Code modernization, refactoring
- **Elide advantage**: Automated ES6+ conversion
- **Polyglot score**: High

---

**Built with ❤️ for the Elide Polyglot Runtime**

*Proving that one tool can rule them all.*
