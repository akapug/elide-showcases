# Email Normalization - Email Address Normalization

Normalize email addresses to canonical form.

## Quick Start

```typescript
import { normalize } from './elide-email-normalization.ts';

const normalized = normalize("john.doe+spam@gmail.com");
// Returns: "johndoe@gmail.com"
```
