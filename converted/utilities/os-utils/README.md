# os-utils - OS Utilities - Elide Polyglot Showcase

Get OS-level information like CPU, memory, and load.

## 🚀 Quick Start

```typescript
import { cpuCount, freemem, totalmem, cpuUsage } from './elide-os-utils.ts';

console.log(`CPUs: ${cpuCount()}`);
console.log(`Memory: ${(freemem() / 1024 / 1024 / 1024).toFixed(2)} GB free`);

cpuUsage((usage) => {
  console.log(`CPU: ${(usage * 100).toFixed(1)}%`);
});
```

**Package has ~1M+ downloads/week on npm**
