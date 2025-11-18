# Node OS Utils - Operating System Utilities

**Pure TypeScript implementation of OS utilities for Elide.**

Based on [node-os-utils](https://www.npmjs.com/package/node-os-utils) (~30K+ downloads/week)

## Features

- CPU statistics
- Memory information
- Drive information
- Network statistics
- OS information
- Zero dependencies

## Installation

```bash
elide install @elide/node-os-utils
```

## Usage

### CPU

```typescript
import { cpu } from "./elide-node-os-utils.ts";

const usage = await cpu.usage();
const free = await cpu.free();
const info = await cpu.info();
const loadavg = await cpu.loadavg();
```

### Memory

```typescript
import { mem } from "./elide-node-os-utils.ts";

const total = mem.totalMem();
const free = mem.freeMem();
const used = mem.usedMem();
const info = await mem.info();
```

### Drive

```typescript
import { drive } from "./elide-node-os-utils.ts";

const info = await drive.info();
console.log("Capacity:", info.capacity);
console.log("Available:", info.available);
```

### Network

```typescript
import { netstat } from "./elide-node-os-utils.ts";

const stats = await netstat.stats();
const inout = await netstat.inOut(1000);

console.log("Received:", inout.rx, "bytes");
console.log("Transmitted:", inout.tx, "bytes");
```

### OS

```typescript
import { os } from "./elide-node-os-utils.ts";

console.log("Platform:", os.platform());
console.log("Type:", os.type());
console.log("Arch:", os.arch());
console.log("Hostname:", os.hostname());
console.log("Uptime:", os.uptime());
```

## API Reference

### CPU

- `cpu.usage()` - CPU usage percentage
- `cpu.free()` - Free CPU percentage
- `cpu.model()` - CPU model name
- `cpu.count()` - Number of cores
- `cpu.loadavg(time?)` - Load average
- `cpu.info()` - Complete CPU info

### Memory

- `mem.totalMem()` - Total memory (bytes)
- `mem.freeMem()` - Free memory (bytes)
- `mem.usedMem()` - Used memory (bytes)
- `mem.freeMemPercentage()` - Free memory %
- `mem.info()` - Complete memory info

### Drive

- `drive.info()` - Drive information
- `drive.free()` - Free space info
- `drive.used()` - Used space info

### Network

- `netstat.stats()` - Network statistics
- `netstat.inOut(duration?)` - Network I/O

### OS

- `os.platform()` - Platform name
- `os.type()` - OS type
- `os.arch()` - Architecture
- `os.hostname()` - Hostname
- `os.uptime()` - Uptime in seconds

## Polyglot Benefits

Use OS utilities across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One OS API everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Comprehensive** - All major OS metrics
- **Cross-platform** - Works everywhere
- **30K+ downloads/week** - Production ready

## License

MIT
