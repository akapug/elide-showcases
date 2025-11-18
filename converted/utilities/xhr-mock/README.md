# XHR Mock - XMLHttpRequest Mocking

Mock XMLHttpRequest for testing.

Based on [xhr-mock](https://www.npmjs.com/package/xhr-mock) (~50K+ downloads/week)

## Features

- ✅ Mock XHR requests
- ✅ Request/response matching
- ✅ Zero dependencies

## Quick Start

```typescript
import xhrMock from './elide-xhr-mock.ts';

xhrMock.setup();
xhrMock.get('/api/data', (req, res) => {
  return res.status(200).body({ data: 'test' });
});

xhrMock.teardown();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
