# Finalhandler - Final HTTP Request Handler

Node.js function to invoke as the final step to respond to HTTP request.

Based on [finalhandler](https://www.npmjs.com/package/finalhandler) (~5M+ downloads/week)

## Features

- Final middleware handler
- Error formatting
- 404 handling
- Status code management
- Response cleanup
- Environment-aware error details

## Quick Start

```typescript
import finalhandler from './elide-finalhandler.ts';

const done = finalhandler(req, res, {
  env: 'production',
  onerror: (err, req, res) => {
    console.error(err);
  }
});

// Call when no middleware handled request
done(); // Sends 404

// Call when error occurred
done(new Error('Something failed'));
```

## Polyglot Examples

**JavaScript/TypeScript:**
```typescript
const done = finalhandler(req, res);
done(err); // Handle error
```

**Python (via Elide):**
```python
done = finalhandler(req, res)
done(err)
```

**Ruby (via Elide):**
```ruby
done = finalhandler(req, res)
done.call(err)
```

## Why Polyglot?

- Consistent error responses across all languages
- Universal HTTP error handling
- Share error formatting logic
- Environment-aware (dev vs prod)
