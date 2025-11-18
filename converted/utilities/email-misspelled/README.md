# Email Misspelled - Email Misspelling Detection

Detect misspellings in email addresses.

Based on https://www.npmjs.com/package/email-misspelled (~10K+ downloads/week)

## Quick Start

```typescript
import { isMisspelled, correctMisspelling } from './elide-email-misspelled.ts';

const misspelled = isMisspelled("user@gmial.com");
const corrected = correctMisspelling("user@gmial.com");
```
