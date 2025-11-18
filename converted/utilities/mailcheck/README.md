# Mailcheck - Email Suggestion Library

Suggest corrections for misspelled email addresses.

Based on https://www.npmjs.com/package/mailcheck (~50K+ downloads/week)

## Quick Start

```typescript
import { suggest } from './elide-mailcheck.ts';

const result = suggest("user@gmial.com");
console.log(result.full); // "user@gmail.com"
```
