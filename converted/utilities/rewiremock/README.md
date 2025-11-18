# Rewiremock - Mock Rewiring

Advanced module mocking and dependency injection.

Based on [rewiremock](https://www.npmjs.com/package/rewiremock) (~50K+ downloads/week)

## Features

- ✅ Advanced mocking
- ✅ Dependency injection
- ✅ Zero dependencies

## Quick Start

```typescript
import rewiremock from './elide-rewiremock.ts';

rewiremock('fs')
  .with({ readFileSync: () => 'mocked' })
  .enable();
```

## Polyglot Benefits

Works across JavaScript, Python, Ruby, and Java via Elide!
