# network - Network Information - Elide Polyglot Showcase

Get network interface information and configuration.

## 🚀 Quick Start

```typescript
import { get_active_interface } from './elide-network.ts';

const iface = get_active_interface();
console.log(`IP: ${iface.ip_address}`);
console.log(`Gateway: ${iface.gateway_ip}`);
```

**Package has ~1M+ downloads/week on npm**
