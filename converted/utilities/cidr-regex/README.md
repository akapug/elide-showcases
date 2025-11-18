# cidr-regex - CIDR Notation Matcher - Elide Polyglot Showcase

> **One CIDR regex for ALL languages** - TypeScript, Python, Ruby, and Java

Regular expression for matching and validating CIDR notation (IPv4 and IPv6).

## ✨ Features

- ✅ IPv4 CIDR matching (e.g., 192.168.1.0/24)
- ✅ IPv6 CIDR matching (e.g., 2001:db8::/32)
- ✅ Extract CIDR blocks from text
- ✅ Strict validation
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { test, extract } from './elide-cidr-regex.ts';

// Validate CIDR notation
console.log(test('192.168.1.0/24')); // true
console.log(test('192.168.1.1')); // false (no /prefix)

// Extract CIDR from text
const config = 'Allow from 192.168.1.0/24 and 10.0.0.0/8';
const cidrs = extract(config);
console.log(cidrs); // ['192.168.1.0/24', '10.0.0.0/8']
```

## 📖 API Reference

### `test(str: string, version?: 'v4' | 'v6'): boolean`

Test if string is valid CIDR notation.

### `extract(text: string, version?: 'v4' | 'v6'): string[]`

Extract all CIDR blocks from text.

### `v4(options?: { exact?: boolean }): RegExp`

Get IPv4 CIDR regex pattern.

### `v6(options?: { exact?: boolean }): RegExp`

Get IPv6 CIDR regex pattern.

---

**Package has ~30M+ downloads/week on npm**
