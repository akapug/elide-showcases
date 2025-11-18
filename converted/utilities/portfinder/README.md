# portfinder - Find Open Ports - Elide Polyglot Showcase

Find available network ports automatically.

## 🚀 Quick Start

```typescript
import { getPort } from './elide-portfinder.ts';

const port = await getPort();
console.log(`Available port: ${port}`);

// Start from specific port
const customPort = await getPort({ startPort: 8000 });
```

**Package has ~80M+ downloads/week on npm**
