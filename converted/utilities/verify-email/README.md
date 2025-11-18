# Verify Email - Email Address Verification Library

Simple and fast email address verification.

**POLYGLOT SHOWCASE**: One verification library for ALL languages on Elide!

Based on https://www.npmjs.com/package/verify-email (~10K+ downloads/week)

## Features

- RFC 5322 compliant validation
- MX record verification
- Mailbox existence check
- Fast synchronous validation
- Batch verification support
- Zero dependencies

## Quick Start

```typescript
import { verifyEmail, verifyEmailSync, isValidFormat } from './elide-verify-email.ts';

// Synchronous format check
const isValid = verifyEmailSync("user@example.com");

// Async verification with MX check
const result = await verifyEmail("user@example.com", {
  checkMX: true,
  checkMailbox: false
});

// Batch verification
const results = await verifyBatch([
  "user1@example.com",
  "user2@example.com"
]);
```

## Polyglot Examples

### TypeScript
```typescript
const result = await verifyEmail("user@example.com");
console.log(result.valid);
```

### Python (via Elide)
```python
result = verifyEmail("user@example.com")
print(result["valid"])
```

### Ruby (via Elide)
```ruby
result = verifyEmail("user@example.com")
puts result[:valid]
```

## Use Cases

- Form validation
- User signup verification
- Email list validation
- Newsletter subscription validation
