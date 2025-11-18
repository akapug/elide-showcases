# ip-address - IPv4/IPv6 Parser - Elide Polyglot Showcase

> **One IP address parser for ALL languages** - TypeScript, Python, Ruby, and Java

Full-featured IPv4 and IPv6 address parsing, validation, and manipulation.

## ✨ Features

- ✅ Full IPv4/IPv6 support
- ✅ Address parsing and validation
- ✅ Subnet and CIDR calculations
- ✅ Address normalization
- ✅ Binary and hex conversion
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { Address4, Address6 } from './elide-ip-address.ts';

// Parse IPv4 with CIDR
const ipv4 = new Address4('192.168.1.1/24');
console.log(ipv4.startAddress().address); // "192.168.1.0"
console.log(ipv4.endAddress().address); // "192.168.1.255"

// Parse and normalize IPv6
const ipv6 = new Address6('2001:db8::1');
console.log(ipv6.correctForm()); // "2001:db8::1"

// Validate
console.log(Address4.isValid('192.168.1.1')); // true
console.log(Address6.isValid('2001:db8::1')); // true
```

---

**Package has ~40M+ downloads/week on npm**
