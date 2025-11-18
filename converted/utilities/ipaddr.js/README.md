# ipaddr.js - IP Address Manipulation - Elide Polyglot Showcase

> **One IP manipulation library for ALL languages** - TypeScript, Python, Ruby, and Java

Parse, validate, and manipulate IPv4 and IPv6 addresses with CIDR matching and range operations.

## ✨ Features

- ✅ IPv4 and IPv6 parsing
- ✅ Address validation
- ✅ CIDR matching
- ✅ Special address detection (private, loopback, etc.)
- ✅ IPv6 notation normalization
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import { IPv4, IPv6, parse, isValid } from './elide-ipaddr.ts';

// Parse IPv4
const ipv4 = IPv4.parse('192.168.1.1');
console.log(ipv4.isPrivate()); // true

// Parse IPv6
const ipv6 = IPv6.parse('2001:db8::1');
console.log(ipv6.toString()); // "2001:db8::1"

// Auto-detect
const addr = parse('192.168.1.1');
console.log(addr instanceof IPv4); // true

// Validate
console.log(isValid('192.168.1.1')); // true
console.log(isValid('invalid')); // false

// CIDR matching
const ip = IPv4.parse('192.168.1.100');
console.log(ip.match([IPv4.parse('192.168.0.0'), 16])); // true
```

## 📖 API Reference

### `IPv4.parse(str: string): IPv4`

Parse IPv4 address string.

### `IPv6.parse(str: string): IPv6`

Parse IPv6 address string.

### `parse(str: string): IPv4 | IPv6`

Auto-detect and parse IP address.

### `isValid(str: string): boolean`

Check if string is valid IP address.

### `IPv4#isPrivate(): boolean`

Check if IPv4 is private.

### `IPv4#isLoopback(): boolean`

Check if IPv4 is loopback.

### `IPv4#match(cidr: [IPv4, number]): boolean`

Check if IP matches CIDR range.

## 💡 Use Cases

```typescript
// HTTP request filtering
function allowRequest(ip: string): boolean {
  const addr = IPv4.parse(ip);
  return !addr.isPrivate();
}

// Rate limiting by subnet
function getRateLimitKey(ip: string): string {
  const addr = IPv4.parse(ip);
  // Use /24 subnet for rate limiting
  const subnet = addr.parts.slice(0, 3).join('.');
  return `ratelimit:${subnet}`;
}
```

---

**Package has ~150M+ downloads/week on npm**
