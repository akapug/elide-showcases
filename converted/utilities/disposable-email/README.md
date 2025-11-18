# Disposable Email - Disposable Email Detection

Detect and block disposable/temporary email addresses.

**POLYGLOT SHOWCASE**: One disposable detector for ALL languages on Elide!

Based on https://www.npmjs.com/package/disposable-email (~30K+ downloads/week)

## Features

- 200+ disposable domains database
- Fast synchronous detection
- Domain pattern matching
- Custom domain list support
- Zero dependencies

## Quick Start

```typescript
import { isDisposable, validate, addDomain } from './elide-disposable-email.ts';

// Check if email is disposable
const disposable = isDisposable("test@tempmail.com"); // true

// Validate email
const result = validate("user@10minutemail.com");
console.log(result.disposable); // true

// Add custom domain
addDomain("my-temp-mail.com");
```

## Polyglot Examples

### TypeScript
```typescript
const disposable = isDisposable("test@tempmail.com");
```

### Python (via Elide)
```python
disposable = isDisposable("test@tempmail.com")
```

### Ruby (via Elide)
```ruby
disposable = isDisposable("test@tempmail.com")
```

## Use Cases

- User registration filtering
- Anti-spam protection
- Quality user acquisition
- Newsletter signup validation
