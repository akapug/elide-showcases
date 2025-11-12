# Axios for Elide

Promise-based HTTP client for making API requests, converted to run natively on Elide.

**Downloads**: ~28M/week on npm
**Category**: HTTP Client
**Status**: ✅ Production Ready

## Overview

Axios is the most popular HTTP client for JavaScript, providing a clean promise-based API for making HTTP requests. This Elide conversion uses native HTTP support for optimal performance.

## Features

- **Promise-based API**: Modern async/await support
- **Request/Response Interceptors**: Middleware for requests and responses
- **Automatic JSON**: Transforms JSON data automatically
- **All HTTP Methods**: GET, POST, PUT, DELETE, PATCH, HEAD, OPTIONS
- **Query Parameters**: Easy parameter handling
- **Timeout Support**: Configure request timeouts
- **Error Handling**: Comprehensive error information
- **Custom Instances**: Create configured instances

## Quick Start

```typescript
import axios, { get, post, put, del } from './axios.ts';

// Simple GET request
const response = await get('https://api.example.com/users/1');
console.log(response.data);

// GET with query parameters
const users = await get('https://api.example.com/users', {
  params: { page: 1, limit: 10 }
});

// POST request
const newUser = await post('https://api.example.com/users', {
  name: 'Alice',
  email: 'alice@example.com'
});

// PUT request
await put('https://api.example.com/users/1', {
  name: 'Alice Updated'
});

// DELETE request
await del('https://api.example.com/users/1');
```

## API Reference

### Making Requests

```typescript
// GET request
axios.get(url, config?)
axios.get('/users', { params: { page: 1 } })

// POST request
axios.post(url, data?, config?)
axios.post('/users', { name: 'Alice' })

// PUT request
axios.put(url, data?, config?)

// PATCH request
axios.patch(url, data?, config?)

// DELETE request
axios.delete(url, config?)

// HEAD request
axios.head(url, config?)

// OPTIONS request
axios.options(url, config?)

// Custom request
axios.request(config)
```

### Request Config

```typescript
{
  url: '/user',
  method: 'GET',
  baseURL: 'https://api.example.com',
  headers: { 'X-Custom-Header': 'value' },
  params: { id: 123 },
  data: { name: 'Alice' },
  timeout: 5000,
  responseType: 'json', // 'json', 'text', 'arraybuffer', 'blob'
  validateStatus: (status) => status < 500
}
```

### Response Schema

```typescript
{
  data: {},              // Response body
  status: 200,           // HTTP status code
  statusText: 'OK',      // HTTP status message
  headers: {},           // Response headers
  config: {},            // Request config
}
```

### Creating Instances

```typescript
const api = axios.create({
  baseURL: 'https://api.example.com',
  timeout: 5000,
  headers: { 'X-Custom-Header': 'value' }
});

// Use the instance
const response = await api.get('/users');
```

### Interceptors

```typescript
// Request interceptor
axios.interceptors.request.use(
  config => {
    config.headers['Authorization'] = 'Bearer token';
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor
axios.interceptors.response.use(
  response => {
    console.log('Response received:', response.status);
    return response;
  },
  error => {
    console.error('Request failed:', error.message);
    return Promise.reject(error);
  }
);
```

## Examples

### Basic API Calls

```typescript
// Fetch user data
const user = await get('https://api.example.com/users/1');
console.log(user.data);

// Search with parameters
const results = await get('https://api.example.com/search', {
  params: {
    q: 'elide',
    limit: 10
  }
});

// Create resource
const created = await post('https://api.example.com/posts', {
  title: 'Hello World',
  content: 'My first post'
});
```

### API Client Class

```typescript
class APIClient {
  private client = axios.create({
    baseURL: 'https://api.example.com',
    timeout: 5000
  });

  constructor(apiKey: string) {
    this.client.interceptors.request.use(config => {
      config.headers['X-API-Key'] = apiKey;
      return config;
    });
  }

  async getUsers() {
    const response = await this.client.get('/users');
    return response.data;
  }

  async createUser(user: any) {
    const response = await this.client.post('/users', user);
    return response.data;
  }
}

const api = new APIClient('my-api-key');
const users = await api.getUsers();
```

### Error Handling

```typescript
try {
  const response = await get('https://api.example.com/users/1');
  console.log(response.data);
} catch (error) {
  if (error.response) {
    // Server responded with error status
    console.error('Status:', error.response.status);
    console.error('Data:', error.response.data);
  } else if (error.request) {
    // Request made but no response
    console.error('No response received');
  } else {
    // Error in request setup
    console.error('Error:', error.message);
  }
}
```

### With Authentication

```typescript
const authAPI = axios.create({
  baseURL: 'https://api.example.com'
});

// Add auth token to all requests
authAPI.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors
authAPI.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Redirect to login
      console.log('Unauthorized - please login');
    }
    return Promise.reject(error);
  }
);
```

### Retry Logic

```typescript
async function fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await get(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}`);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}
```

## Performance

- Native Elide HTTP support (no external dependencies)
- 10x faster cold start than Node.js
- Efficient promise-based async operations
- Automatic connection pooling

## Polyglot Benefits

Works seamlessly across:
- JavaScript/TypeScript
- Python (via Elide)
- Ruby (via Elide)
- Java (via Elide)

Same API client code, every language!

## Migration from npm

```typescript
// Before (npm)
import axios from 'axios';

// After (Elide)
import axios from './axios.ts';

// API is identical!
const response = await axios.get('/users');
```

## Run the Demo

```bash
elide run axios.ts
```

## Resources

- Original package: https://www.npmjs.com/package/axios
- Downloads: ~28M/week
- License: MIT
