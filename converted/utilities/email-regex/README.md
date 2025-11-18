# Email Regex - Email Regular Expression Patterns

Reliable email validation using regex patterns.

Based on https://www.npmjs.com/package/email-regex (~100K+ downloads/week)

## Quick Start

```typescript
import { emailRegex, isEmail, extractEmails } from './elide-email-regex.ts';

const valid = isEmail("user@example.com");
const emails = extractEmails("Contact support@company.com");
```

## Use Cases

- Email validation
- Text parsing for emails
- Email extraction from documents
