# Moxios - Axios Mock Helper

Simple axios mocking for testing.

Based on [moxios](https://www.npmjs.com/package/moxios) (~100K+ downloads/week)

## Features

- ✅ Simple axios mocking
- ✅ Request stubbing
- ✅ Zero dependencies

## Quick Start

```typescript
import moxios from './elide-moxios.ts';

moxios.install();
moxios.stubRequest('/users', {
  status: 200,
  response: [{ id: 1 }]
});

moxios.uninstall();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
