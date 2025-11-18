# CPU Stat - CPU Statistics

**Pure TypeScript implementation of CPU statistics for Elide.**

Based on [cpu-stat](https://www.npmjs.com/package/cpu-stat) (~10K+ downloads/week)

## Features

- CPU usage percentage
- Per-core statistics
- Average usage calculation
- Continuous monitoring
- CPU information
- Zero dependencies

## Installation

```bash
elide install @elide/cpu-stat
```

## Usage

### CPU Information

```typescript
import cpuStat from "./elide-cpu-stat.ts";

const info = cpuStat.info();
console.log("CPU Cores:", info.cores);
console.log("CPU Speed:", info.speed, "MHz");
```

### Current CPU Usage

```typescript
const usage = await cpuStat.usagePercent();
console.log(`CPU: ${usage}%`);
```

### Per-Core Usage

```typescript
const coreUsages = await cpuStat.perCoreUsage();
coreUsages.forEach((usage, i) => {
  console.log(`Core ${i}: ${usage}%`);
});
```

### Average Usage

```typescript
const avgUsage = await cpuStat.averageUsage(5, 1000);
console.log(`Average CPU: ${avgUsage}%`);
```

### Monitor CPU

```typescript
const stop = cpuStat.monitor(
  (usage) => {
    console.log(`CPU: ${usage.cpu}%`);
    console.log(`Cores:`, usage.cores);
  },
  { interval: 1000 }
);

// Stop monitoring later
stop();
```

## API Reference

### `cpuStat.info()`

Get CPU information.

**Returns:** `CPUInfo`

### `cpuStat.usagePercent(options?)`

Get current CPU usage percentage.

**Options:**
- `sampleMs?: number` - Sampling duration (default: 1000)

**Returns:** `Promise<number>`

### `cpuStat.perCoreUsage(options?)`

Get usage for all CPU cores.

**Returns:** `Promise<number[]>`

### `cpuStat.averageUsage(samples?, intervalMs?)`

Get average CPU usage over multiple samples.

**Returns:** `Promise<number>`

### `cpuStat.monitor(callback, options?)`

Monitor CPU usage continuously.

**Returns:** Function to stop monitoring

## Types

```typescript
interface CPUInfo {
  model: string;
  speed: number;  // MHz
  cores: number;
}

interface CPUUsage {
  cpu: number;      // Overall usage %
  cores: number[];  // Per-core usage %
  timestamp: number;
}
```

## Polyglot Benefits

Use CPU statistics across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One CPU API everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Real-time** - Continuous monitoring
- **Per-core** - Individual core stats
- **10K+ downloads/week** - Reliable tool

## License

MIT
