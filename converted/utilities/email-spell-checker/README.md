# Email Spell Checker - Email Domain Spell Checking

Suggest corrections for misspelled email domains.

Based on https://www.npmjs.com/package/email-spell-checker (~30K+ downloads/week)

## Quick Start

```typescript
import { checkEmail, suggestDomain } from './elide-email-spell-checker.ts';

const result = checkEmail("user@gmial.com");
console.log(result.suggestion); // "user@gmail.com"
```
