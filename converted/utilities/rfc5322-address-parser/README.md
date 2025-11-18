# RFC5322 Address Parser - RFC 5322 Email Address Parser

Parse email addresses according to RFC 5322.

## Quick Start

```typescript
import { parse, parseList } from './elide-rfc5322-address-parser.ts';

const parsed = parse('John Doe <john@example.com>');
console.log(parsed.name); // "John Doe"
console.log(parsed.email); // "john@example.com"
```
