# netmask - Network Mask Manipulation - Elide Polyglot Showcase

> **One netmask library for ALL languages** - TypeScript, Python, Ruby, and Java

Parse and work with network masks, blocks, and subnets.

## ✨ Features

- ✅ Network block parsing
- ✅ IP range operations
- ✅ Subnet calculations
- ✅ Contains checks
- ✅ Iterate over IPs
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java

## 🚀 Quick Start

```typescript
import { Netmask } from './elide-netmask.ts';

const net = new Netmask('192.168.1.0/24');
console.log(net.base); // "192.168.1.0"
console.log(net.mask); // "255.255.255.0"
console.log(net.broadcast); // "192.168.1.255"
console.log(net.size); // 256

// Check if IP is in network
console.log(net.contains('192.168.1.100')); // true

// Get next network
console.log(net.next().toString()); // "192.168.2.0/24"
```

---

**Package has ~15M+ downloads/week on npm**
