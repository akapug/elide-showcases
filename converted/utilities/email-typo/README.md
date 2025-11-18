# Email Typo - Email Typo Detection and Correction

Detect and correct common email typos.

Based on https://www.npmjs.com/package/email-typo (~20K+ downloads/week)

## Quick Start

```typescript
import { detectTypo, correctTypo } from './elide-email-typo.ts';

const result = detectTypo("user@gmial.com");
const corrected = correctTypo("user@gmial.com");
```
