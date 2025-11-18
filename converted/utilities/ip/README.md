# IP Address Utilities - Elide Polyglot Showcase

> **One IP utility library for ALL languages** - TypeScript, Python, Ruby, and Java

Comprehensive IP address manipulation for IPv4 and IPv6 with subnet calculations, CIDR support, and network operations.

## 🌟 Why This Matters

In polyglot network services, having **different IP libraries** in each language creates:
- ❌ Inconsistent subnet calculations
- ❌ Different IP validation logic
- ❌ Complex firewall rule management
- ❌ Debugging nightmares across services

**Elide solves this** with ONE implementation that works in ALL languages.

## ✨ Features

- ✅ IPv4 and IPv6 validation
- ✅ CIDR notation support
- ✅ Subnet calculations
- ✅ IP range operations
- ✅ Address to long conversion
- ✅ Private/public IP detection
- ✅ **Polyglot**: Use from TypeScript, Python, Ruby, and Java
- ✅ Zero dependencies

## 🚀 Quick Start

### TypeScript

```typescript
import { isV4Format, cidrSubnet, isPrivate } from './elide-ip.ts';

// Validate IP
console.log(isV4Format('192.168.1.1')); // true

// Subnet calculations
const subnet = cidrSubnet('192.168.1.0/24');
console.log(subnet.numHosts); // 254

// Check if private
console.log(isPrivate('192.168.1.1')); // true
console.log(isPrivate('8.8.8.8')); // false
```

### Python

```python
from elide import require
ip = require('./elide-ip.ts')

# Validate IP
print(ip.isV4Format('192.168.1.1'))  # True

# Subnet calculations
subnet = ip.cidrSubnet('192.168.1.0/24')
print(subnet.numHosts)  # 254
```

## 📖 API Reference

### `isV4Format(ip: string): boolean`

Validate IPv4 address format.

### `isV6Format(ip: string): boolean`

Validate IPv6 address format.

### `toLong(ip: string): number`

Convert IPv4 to long integer.

### `fromLong(long: number): string`

Convert long integer to IPv4.

### `isPrivate(ip: string): boolean`

Check if IP is in private range (10.x, 172.16.x, 192.168.x, 127.x).

### `isPublic(ip: string): boolean`

Check if IP is public (not private).

### `isLoopback(ip: string): boolean`

Check if IP is loopback (127.x.x.x).

### `cidrSubnet(cidr: string): SubnetInfo`

Parse CIDR notation and get subnet details.

Returns:
- `networkAddress`: Network address
- `firstAddress`: First usable address
- `lastAddress`: Last usable address
- `broadcastAddress`: Broadcast address
- `subnetMask`: Subnet mask
- `numHosts`: Number of usable hosts
- `contains(ip)`: Check if IP is in subnet

### `mask(prefixLength: number): string`

Get subnet mask from prefix length.

### `cidr(ip: string, prefixLength: number): string`

Create CIDR notation.

### `subnet(ip1: string, ip2: string, maskLength: number): boolean`

Check if two IPs are in same subnet.

## 💡 Use Cases

### Firewall Rules

```typescript
const allowedSubnet = cidrSubnet('10.0.0.0/8');

function isAllowed(ip: string): boolean {
  return allowedSubnet.contains(ip);
}

console.log(isAllowed('10.1.1.1')); // true
console.log(isAllowed('192.168.1.1')); // false
```

### Load Balancer

```typescript
// Distribute IPs across subnets
const subnets = [
  cidrSubnet('10.0.1.0/24'),
  cidrSubnet('10.0.2.0/24'),
  cidrSubnet('10.0.3.0/24')
];

function assignSubnet(ip: string) {
  return subnets.find(s => s.contains(ip));
}
```

### Security Filtering

```typescript
function isSecureSource(ip: string): boolean {
  // Block private IPs from external requests
  return isPublic(ip) && !isLoopback(ip);
}
```

## 📊 Performance

- **npm downloads**: ~150M/week
- **Use case**: Universal (network operations in every language)
- **Elide advantage**: One implementation for all languages
- **Zero dependencies**: Pure TypeScript implementation

---

**Built with ❤️ for the Elide Polyglot Runtime**

*One IP library to rule them all.*
