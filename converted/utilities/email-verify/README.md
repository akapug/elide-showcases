# Email Verify - Email Address Verification

Verify email addresses with DNS, SMTP, and syntax validation.

**POLYGLOT SHOWCASE**: One email verification library for ALL languages on Elide!

Based on https://www.npmjs.com/package/email-verify (~30K+ downloads/week)

## Features

- DNS MX record validation
- SMTP verification (simulated)
- Syntax validation (RFC 5322)
- Disposable email detection
- Role account detection
- Zero dependencies

## Quick Start

```typescript
import { verify, verifySync, isDisposable } from './elide-email-verify.ts';

// Synchronous validation
const isValid = verifySync("user@gmail.com");

// Comprehensive verification
const result = await verify("user@gmail.com", {
  checkDNS: true,
  checkSMTP: false,
  checkDisposable: true,
  checkRole: true
});

// Check if disposable
const disposable = isDisposable("test@tempmail.com");
```

## Polyglot Examples

### TypeScript
```typescript
const result = await verify("user@example.com");
console.log(result.valid);
```

### Python (via Elide)
```python
result = verify("user@example.com")
print(result["valid"])
```

### Ruby (via Elide)
```ruby
result = verify("user@example.com")
puts result[:valid]
```

### Java (via Elide)
```java
var result = verify("user@example.com");
System.out.println(result.get("valid"));
```

## Use Cases

- User registration validation
- Email list cleaning
- Form validation
- Newsletter signup verification
