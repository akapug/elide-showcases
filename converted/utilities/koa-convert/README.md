# Koa Convert - Convert Legacy Koa Middleware

Convert legacy Koa middleware (generator-based) to modern async/await.

Based on [koa-convert](https://www.npmjs.com/package/koa-convert) (~500K+ downloads/week)

## Features

- Convert generator middleware
- Support modern async/await
- Backward compatibility
- Automatic detection
- Type preservation
- Zero dependencies

## Quick Start

```typescript
import convert from './elide-koa-convert.ts';

// Convert legacy middleware
const modernMiddleware = convert(legacyMiddleware);

// Auto-detect and convert
app.use(convert(possiblyLegacyMiddleware));

// Compose with auto-conversion
import { compose } from './elide-koa-convert.ts';
const app = compose([mw1, mw2, mw3]);
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const modern = convert(legacy);
```

**Python (via Elide):**
```python
modern = convert(legacy)
```

**Ruby (via Elide):**
```ruby
modern = convert(legacy)
```

## Why Polyglot?

- Same conversion pattern across all languages
- Migrate legacy code gradually
- Support old and new together
- Consistent modernization path
