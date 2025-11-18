# Email Formatter - Email Formatting Library

Format and normalize email addresses.

Based on https://www.npmjs.com/package/email-formatter (~10K+ downloads/week)

## Quick Start

```typescript
import { normalize, format, parse } from './elide-email-formatter.ts';

const normalized = normalize("  USER@EXAMPLE.COM  ");
const formatted = format("user@example.com", "John Doe");
const parsed = parse("John Doe <user@example.com>");
```
