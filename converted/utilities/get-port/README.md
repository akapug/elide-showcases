# get-port - Get Available Port - Elide Polyglot Showcase

Get an available TCP port.

## 🚀 Quick Start

```typescript
import getPort from './elide-get-port.ts';

const port = await getPort();
console.log(`Port: ${port}`);

// Preferred port
const preferredPort = await getPort({ port: 8080 });

// Fallback ports
const fallbackPort = await getPort({ port: [8080, 8081, 8082] });
```

**Package has ~40M+ downloads/week on npm**
