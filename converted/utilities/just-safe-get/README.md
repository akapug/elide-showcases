# Just Safe Get - Safe Property Access

Safely get nested object properties without errors.

Based on just-* utilities pattern

## Features

- 🔒 Null-safe property access
- 🎯 Dot notation support
- 📊 Array indexing support
- 🛡️ Default value support
- 📦 Zero dependencies

## Quick Start

```typescript
import safeGet from './elide-just-safe-get.ts';

const user = {
  address: {
    city: "New York"
  }
};

safeGet(user, 'address.city'); // "New York"
safeGet(user, 'address.country', 'USA'); // "USA" (default)
safeGet(null, 'any.path', 'default'); // "default"
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const city = safeGet(user, 'address.city', 'Unknown');
```

### Python (via Elide)
```python
from elide_just_safe_get import safe_get

city = safe_get(user, 'address.city', 'Unknown')
```

### Ruby (via Elide)
```ruby
require 'elide/just_safe_get'

city = SafeGet.get(user, 'address.city', 'Unknown')
```

### Java (via Elide)
```java
import elide.justsafeget.SafeGet;

var city = SafeGet.get(user, "address.city", "Unknown");
```

## Use Cases

- **API parsing** - Safely parse API responses
- **Config access** - Access configuration values
- **Optional chaining** - Alternative to ?.
- **Deep traversal** - Navigate nested objects
- **Error prevention** - Avoid null pointer errors

## Why Elide?

- 🌐 **Polyglot** - One implementation for all languages
- ⚡ **Fast** - Native performance
- 📦 **Zero dependencies** - Pure TypeScript
- 🔄 **Consistent** - Same API everywhere
- 🚀 **Production-ready** - Battle-tested pattern

Run the demo: `elide run elide-just-safe-get.ts`
