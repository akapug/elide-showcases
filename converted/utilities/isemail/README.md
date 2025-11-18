# IsEmail - RFC 5322 Email Validation

Comprehensive email validation following RFC 5322 standard.

**POLYGLOT SHOWCASE**: One RFC validator for ALL languages on Elide!

Based on https://www.npmjs.com/package/isemail (~100K+ downloads/week)

## Features

- RFC 5322 compliant validation
- RFC 5321 address literal support
- Diagnosis codes for failures
- IPv4/IPv6 address support
- Zero dependencies

## Quick Start

```typescript
import { validate, isEmail, getDiagnosisMessage } from './elide-isemail.ts';

// Simple boolean check
const valid = isEmail("user@example.com");

// Detailed validation
const result = validate("user@example.com");
console.log(result.valid);
console.log(result.diagnosis);
console.log(getDiagnosisMessage(result.diagnosis));
```

## Polyglot Examples

### TypeScript
```typescript
const result = validate("user@example.com");
console.log(result.valid);
```

### Python (via Elide)
```python
result = validate("user@example.com")
print(result["valid"])
```

### Ruby (via Elide)
```ruby
result = validate("user@example.com")
puts result[:valid]
```

## Use Cases

- Standards-compliant email validation
- Enterprise email systems
- Email protocol implementations
- High-quality user registration
