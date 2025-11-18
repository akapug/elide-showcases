# Fetch Mock - Fetch API Mocking

Mock fetch() calls for testing.

Based on [fetch-mock](https://www.npmjs.com/package/fetch-mock) (~200K+ downloads/week)

## Features

- ✅ Mock fetch() calls
- ✅ Request matching
- ✅ Response customization
- ✅ Zero dependencies

## Quick Start

```typescript
import fetchMock from './elide-fetch-mock.ts';

fetchMock.get('https://api.example.com/users', [
  { id: 1, name: 'Alice' }
]);

const response = await fetch('https://api.example.com/users');
fetchMock.restore();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
