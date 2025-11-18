# systeminformation - System Information - Elide Polyglot Showcase

Comprehensive system and hardware information library.

## 🚀 Quick Start

```typescript
import { cpu, mem, osInfo } from './elide-systeminformation.ts';

const cpuInfo = await cpu();
console.log(`CPU: ${cpuInfo.brand} (${cpuInfo.cores} cores)`);

const memInfo = await mem();
console.log(`Memory: ${(memInfo.total / 1024 / 1024 / 1024).toFixed(2)} GB`);

const os = await osInfo();
console.log(`OS: ${os.distro} ${os.release}`);
```

**Package has ~5M+ downloads/week on npm**
