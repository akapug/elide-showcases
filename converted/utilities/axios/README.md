# Axios - Promise-based HTTP Client - Elide Polyglot Showcase

> **One HTTP client for ALL languages** - TypeScript, Python, Ruby, and Java

A popular promise-based HTTP client with a simple and elegant API for making HTTP requests across your entire polyglot stack.

## 🌟 Why This Matters

Different languages use different HTTP clients with inconsistent APIs:
- `requests` in Python has different API than axios
- `net/http` in Ruby requires verbose setup
- `HttpClient` in Java is complex and ceremonial
- Each language has its own error handling patterns

**Elide solves this** with ONE HTTP client that works in ALL languages with a consistent API.

## ✨ Features

- ✅ Promise-based API
- ✅ Request/response interceptors
- ✅ Automatic JSON transformation
- ✅ Request cancellation & timeout
- ✅ Query parameter serialization
- ✅ Custom headers support
- ✅ Multiple HTTP methods (GET, POST, PUT, DELETE, PATCH)
- ✅ Error handling with detailed responses
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript
```typescript
import axios from './elide-axios.ts';

// GET request
const response = await axios.get('https://api.example.com/users');
console.log(response.data);

// POST request
const newUser = await axios.post('https://api.example.com/users', {
  name: 'John Doe',
  email: 'john@example.com'
});

// With query parameters
const search = await axios.get('https://api.example.com/search', {
  params: { q: 'elide', page: 1 }
});
```

### Python
```python
from elide import require
axios = require('./elide-axios.ts')

# GET request
response = await axios.get('https://api.example.com/users')
print(response['data'])

# POST request
new_user = await axios.post('https://api.example.com/users', {
    'name': 'Alice',
    'email': 'alice@example.com'
})
```

### Ruby
```ruby
axios = Elide.require('./elide-axios.ts')

# GET request
response = axios.get('https://api.example.com/users').await
puts response[:data]

# POST request
new_user = axios.post('https://api.example.com/users', {
  name: 'Bob',
  email: 'bob@example.com'
}).await
```

### Java
```java
Value axios = context.eval("js", "require('./elide-axios.ts')");

// GET request
Value response = axios.invokeMember("get", "https://api.example.com/users").as(Value.class);
System.out.println(response.getMember("data"));

// POST request
Map<String, Object> userData = Map.of("name", "Charlie", "email", "charlie@example.com");
Value newUser = axios.invokeMember("post", "https://api.example.com/users", userData);
```

## 💡 Real-World Use Cases

### Microservice Communication
```typescript
import { create } from './elide-axios.ts';

// Create API client with base config
const apiClient = create({
  baseURL: 'https://api.internal.company.com',
  timeout: 5000,
  headers: {
    'X-API-Key': process.env.API_KEY
  }
});

// Make requests
const users = await apiClient.get('/users');
const product = await apiClient.get('/products/123');
```

### Error Handling
```typescript
try {
  const response = await axios.get('https://api.example.com/data');
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else if (error.code === 'ECONNABORTED') {
    // Request timeout
    console.error('Request timeout');
  } else {
    // Network error
    console.error('Network error:', error.message);
  }
}
```

### REST API Client
```typescript
class UserAPI {
  constructor(private axios: Axios) {}

  async getAll() {
    const response = await this.axios.get('/users');
    return response.data;
  }

  async getById(id: string) {
    const response = await this.axios.get(`/users/${id}`);
    return response.data;
  }

  async create(userData: any) {
    const response = await this.axios.post('/users', userData);
    return response.data;
  }

  async update(id: string, userData: any) {
    const response = await this.axios.put(`/users/${id}`, userData);
    return response.data;
  }

  async delete(id: string) {
    await this.axios.delete(`/users/${id}`);
  }
}
```

## 🎯 Why Polyglot?

### The Problem
**Before**: Each language requires different HTTP libraries

```
Node.js: axios, got, node-fetch
Python: requests, httpx, aiohttp
Ruby: httparty, faraday, rest-client
Java: HttpClient, OkHttp, Apache HttpClient

Result:
❌ Different APIs to learn
❌ Inconsistent error handling
❌ Multiple testing strategies
❌ Duplicated HTTP logic
```

### The Solution
**After**: One Elide HTTP client for all languages

```
┌────────────────────────────────┐
│  Elide Axios (TypeScript)     │
│  elide-axios.ts               │
└────────────────────────────────┘
         ↓           ↓           ↓
    ┌────────┐  ┌────────┐  ┌────────┐
    │ Node.js│  │ Python │  │  Ruby  │
    │  API   │  │ Script │  │Service │
    └────────┘  └────────┘  └────────┘

Benefits:
✅ One HTTP client
✅ One API to learn
✅ Consistent everywhere
```

## 📖 API Reference

### `axios.get(url, config?)`
Make GET request

### `axios.post(url, data?, config?)`
Make POST request

### `axios.put(url, data?, config?)`
Make PUT request

### `axios.delete(url, config?)`
Make DELETE request

### `axios.patch(url, data?, config?)`
Make PATCH request

### `axios.request(config)`
Make custom request

### `create(config)`
Create custom axios instance with default config

## 🧪 Testing

```bash
elide run elide-axios.ts
```

## 📂 Files

- `elide-axios.ts` - Main implementation
- `README.md` - This file

## 🌐 Links

- [Elide Documentation](https://docs.elide.dev)
- [npm axios package](https://www.npmjs.com/package/axios)
- [GitHub: elide-showcases](https://github.com/akapug/elide-showcases)

## 📝 Package Stats

- **npm downloads**: ~100M/week
- **Use case**: HTTP client for REST APIs
- **Elide advantage**: One HTTP client for all languages
- **Polyglot score**: 48/50 (S-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One HTTP client to rule them all.*
