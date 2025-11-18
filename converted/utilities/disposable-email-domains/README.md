# Disposable Email Domains - Comprehensive Disposable Domain List

Extensive list of disposable/temporary email domains.

**POLYGLOT SHOWCASE**: One domain list for ALL languages on Elide!

Based on https://www.npmjs.com/package/disposable-email-domains (~50K+ downloads/week)

## Features

- 2000+ disposable domain list
- Fast Set-based lookup
- JSON export capability
- Email filtering utilities
- Zero dependencies

## Quick Start

```typescript
import {
  isDisposable,
  isDisposableEmail,
  filterDisposable,
  getCount
} from './elide-disposable-email-domains.ts';

// Check domain
const disposable = isDisposable("tempmail.com"); // true

// Check email
const emailDisposable = isDisposableEmail("test@tempmail.com"); // true

// Filter email list
const valid = filterDisposable([
  "user@gmail.com",
  "fake@tempmail.com"
]);

// Get database size
console.log(getCount()); // 2000+
```

## Polyglot Examples

### TypeScript
```typescript
const disposable = isDisposable("tempmail.com");
```

### Python (via Elide)
```python
disposable = isDisposable("tempmail.com")
```

### Ruby (via Elide)
```ruby
disposable = isDisposable("tempmail.com")
```

## Use Cases

- Email validation systems
- User registration systems
- Anti-spam filters
- Email quality scoring
