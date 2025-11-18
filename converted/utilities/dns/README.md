# dns - DNS Resolution - Elide Polyglot Showcase

> **One DNS resolver for ALL languages** - TypeScript, Python, Ruby, and Java

DNS lookup and resolution utilities for all record types.

## ✨ Features

- ✅ DNS lookup (A, AAAA, MX, TXT, etc.)
- ✅ Reverse DNS
- ✅ Multiple record types
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { lookup, resolveMx } from './elide-dns.ts';

// Simple lookup
const result = await lookup('example.com');
console.log(result.address); // "93.184.216.34"

// MX records
const mx = await resolveMx('example.com');
console.log(mx[0].exchange); // "mail.example.com"
```

**Package has ~50M+ downloads/week on npm**
