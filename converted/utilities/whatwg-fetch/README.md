# WHATWG Fetch Polyfill - Elide Polyglot Showcase

> **One fetch implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Standards-compliant Fetch API polyfill with a single implementation that works across your entire polyglot stack.

## 🌟 Why This Matters

In polyglot architectures, having **different HTTP clients** in each language creates:
- ❌ Inconsistent request/response handling across services
- ❌ Multiple HTTP libraries to maintain
- ❌ Different APIs to learn
- ❌ Complex testing requirements

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ Full WHATWG Fetch API compliance
- ✅ Request/Response objects
- ✅ Headers API
- ✅ Promise-based interface
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies
- ✅ Streaming support

## 🚀 Quick Start

### TypeScript

```typescript
import fetch, { Headers, Request, Response } from './elide-whatwg-fetch.ts';

const response = await fetch('https://api.example.com/users');
const data = await response.json();
console.log(data);
```

### Python

```python
from elide import require
fetch_module = require('./elide-whatwg-fetch.ts')

response = await fetch_module.fetch('https://api.example.com/users')
data = await response.json()
print(data)
```

### Ruby

```ruby
fetch_module = Elide.require('./elide-whatwg-fetch.ts')

response = fetch_module.fetch('https://api.example.com/users').await
data = response.json().await
puts data
```

### Java

```java
Value fetchModule = context.eval("js", "require('./elide-whatwg-fetch.ts')");
Value response = fetchModule.getMember("fetch")
    .execute("https://api.example.com/users");
```

## 📖 API Reference

### `fetch(url, options?): Promise<Response>`

Make an HTTP request.

```typescript
const response = await fetch('https://api.example.com/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'Alice' })
});
```

### `Headers`

Manage HTTP headers.

```typescript
const headers = new Headers();
headers.set('Content-Type', 'application/json');
headers.append('X-Custom', 'value');
```

### `Request`

Create request objects.

```typescript
const request = new Request('https://api.example.com', {
  method: 'GET',
  headers: { 'Accept': 'application/json' }
});
```

### `Response`

Handle HTTP responses.

```typescript
const text = await response.text();
const json = await response.json();
const blob = await response.blob();
```

## 💡 Use Cases

### API Client

```typescript
async function getUsers() {
  const response = await fetch('https://api.example.com/users');
  return response.json();
}
```

### POST Request

```typescript
async function createUser(data: any) {
  const response = await fetch('https://api.example.com/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.json();
}
```

### Custom Headers

```typescript
const headers = new Headers({
  'Authorization': 'Bearer token',
  'X-API-Key': 'secret'
});

const response = await fetch('https://api.example.com/secure', {
  headers: Object.fromEntries(headers.entries())
});
```

## 📊 Performance

- **Zero dependencies**: No external packages
- **Standards-compliant**: WHATWG Fetch spec
- **npm downloads**: ~5M/week
- **Polyglot ready**: Works in all languages

---

**Built with ❤️ for the Elide Polyglot Runtime**
