# ip-regex - IP Address Matcher - Elide Polyglot Showcase

> **One IP regex for ALL languages** - TypeScript, Python, Ruby, and Java

Regular expression for matching and extracting IPv4 and IPv6 addresses from text.

## ✨ Features

- ✅ IPv4 address matching
- ✅ IPv6 address matching
- ✅ Extract IPs from text
- ✅ Strict validation
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { test, extract } from './elide-ip-regex.ts';

// Validate IP
console.log(test('192.168.1.1')); // true
console.log(test('256.1.1.1')); // false

// Extract IPs from text
const log = 'Request from 192.168.1.100 to 10.0.0.5';
const ips = extract(log);
console.log(ips); // ['192.168.1.100', '10.0.0.5']
```

---

**Package has ~40M+ downloads/week on npm**
