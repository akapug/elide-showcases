# Email Obfuscate - Email Address Obfuscation

Obfuscate email addresses to prevent scraping.

## Quick Start

```typescript
import { obfuscate, obfuscateSimple } from './elide-email-obfuscate.ts';

const hidden = obfuscate("user@example.com");
const simple = obfuscateSimple("user@example.com");
```
