# Composable Middleware - Compose Middleware Functions

Compose multiple middleware functions into a single middleware.

Based on [composable-middleware](https://www.npmjs.com/package/composable-middleware) (~50K+ downloads/week)

## Features

- Compose middleware arrays
- Preserve middleware order
- Error propagation
- Async support
- Type-safe composition
- Zero dependencies

## Quick Start

```typescript
import compose from './elide-composable-middleware.ts';

const logger = (req, res, next) => {
  console.log(req.method, req.url);
  next();
};

const auth = (req, res, next) => {
  if (req.headers.authorization) {
    next();
  } else {
    next(new Error('Unauthorized'));
  }
};

// Compose middleware
const app = compose(logger, auth, handler);
app(req, res, finalHandler);
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const middleware = compose(logger, auth, handler);
```

**Python (via Elide):**
```python
middleware = compose(logger, auth, handler)
```

**Ruby (via Elide):**
```ruby
middleware = compose(logger, auth, handler)
```

## Why Polyglot?

- Same composition pattern across all languages
- Reusable middleware chains
- Consistent execution order
- Share auth/logging patterns
