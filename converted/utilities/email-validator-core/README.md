# Email Validator Core - Core Email Validation Library

Core email validation with multiple strategies.

## Quick Start

```typescript
import { isValid, validate } from './elide-email-validator-core.ts';

const valid = isValid("user@example.com");
const unicodeValid = validate("用户@例え.jp", { allowUnicode: true });
```
