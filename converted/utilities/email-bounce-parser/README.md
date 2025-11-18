# Email Bounce Parser - Email Bounce Message Parser

Parse bounce messages to extract failure reasons.

## Quick Start

```typescript
import { parseBounce } from './elide-email-bounce-parser.ts';

const bounce = "550 User unknown: user@example.com";
const result = parseBounce(bounce);
console.log(result.bounceType);
```
