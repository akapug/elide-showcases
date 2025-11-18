# Mail MIME Parser - MIME Email Parser

Parse MIME formatted emails.

Based on https://www.npmjs.com/package/mail-mime-parser (~20K+ downloads/week)

## Quick Start

```typescript
import { parse } from './elide-mail-mime-parser.ts';

const mime = `Subject: Test
From: sender@example.com

Body content`;

const parsed = parse(mime);
console.log(parsed.subject);
```
