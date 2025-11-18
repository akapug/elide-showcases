# Jest Fetch Mock - Jest Fetch Mocking

Mock fetch for Jest tests.

Based on [jest-fetch-mock](https://www.npmjs.com/package/jest-fetch-mock) (~300K+ downloads/week)

## Features

- ✅ Jest-compatible fetch mocking
- ✅ Simple API
- ✅ Zero dependencies

## Quick Start

```typescript
import fetchMock from './elide-jest-fetch-mock.ts';

fetchMock.mockResponseOnce(JSON.stringify({ data: 'test' }));
const response = await fetch('/api');
fetchMock.resetMocks();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
