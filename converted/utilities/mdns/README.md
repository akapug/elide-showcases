# mdns - mDNS Service Discovery - Elide Polyglot Showcase

Advertise and discover services on the local network using mDNS.

## 🚀 Quick Start

```typescript
import { createAdvertisement } from './elide-mdns.ts';

const ad = createAdvertisement({
  name: 'My Service',
  type: '_http._tcp',
  port: 8080
});

ad.start();
```

**Package has ~1M+ downloads/week on npm**
