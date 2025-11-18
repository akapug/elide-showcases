# Just Safe Set - Safe Property Setting

Safely set nested object properties with automatic creation.

Based on just-* utilities pattern

## Features

- ✏️ Automatic path creation
- 🎯 Dot notation support
- 📊 Array support
- 🔒 Immutable updates
- 📦 Zero dependencies

## Quick Start

```typescript
import safeSet from './elide-just-safe-set.ts';

const user = { name: "Alice" };

// Add new property
safeSet(user, 'age', 25);
// { name: "Alice", age: 25 }

// Create deep path automatically
safeSet({}, 'address.city.name', 'New York');
// { address: { city: { name: "New York" } } }

// Update nested property
const config = { server: { port: 3000 } };
safeSet(config, 'server.port', 8080);
// { server: { port: 8080 } }, original unchanged
```

## Polyglot Examples

### JavaScript/TypeScript
```typescript
const updated = safeSet(user, 'address.city', 'NYC');
```

### Python (via Elide)
```python
from elide_just_safe_set import safe_set

updated = safe_set(user, 'address.city', 'NYC')
```

### Ruby (via Elide)
```ruby
require 'elide/just_safe_set'

updated = SafeSet.set(user, 'address.city', 'NYC')
```

### Java (via Elide)
```java
import elide.justsafeset.SafeSet;

var updated = SafeSet.set(user, "address.city", "NYC");
```

## Use Cases

- **Deep updates** - Update nested properties safely
- **Config building** - Build configuration objects
- **State management** - Manage application state
- **Form handling** - Handle form data structures
- **Immutable updates** - Update without mutation

## Why Elide?

- 🌐 **Polyglot** - One implementation for all languages
- ⚡ **Fast** - Native performance
- 📦 **Zero dependencies** - Pure TypeScript
- 🔄 **Consistent** - Same API everywhere
- 🚀 **Production-ready** - Battle-tested pattern

Run the demo: `elide run elide-just-safe-set.ts`
