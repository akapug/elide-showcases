# Just Pick - Object Property Picking

Pick specific properties from objects for clean data extraction.

Based on [just-pick](https://www.npmjs.com/package/just-pick) (~30K+ downloads/week)

## Quick Start

```typescript
import pick from './elide-just-pick.ts';

const user = {
  id: 1,
  name: "Alice",
  email: "alice@example.com",
  password: "secret",
  role: "admin"
};

const publicUser = pick(user, ["id", "name", "email"]);
// { id: 1, name: "Alice", email: "alice@example.com" }
```

## Why Elide?

🌐 **Polyglot** - One implementation for all languages
⚡ **Fast** - Native performance
📦 **Zero dependencies**

Run: `elide run elide-just-pick.ts`
