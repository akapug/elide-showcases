# Process List - List Running Processes

**Pure TypeScript implementation of process listing for Elide.**

Based on [process-list](https://www.npmjs.com/package/process-list) (~10K+ downloads/week)

## Features

- List all running processes
- Process details (PID, name, CPU, memory)
- Filter by name
- Sort by fields
- Cross-platform support
- Zero dependencies

## Installation

```bash
elide install @elide/process-list
```

## Usage

### List All Processes

```typescript
import processList from "./elide-process-list.ts";

const processes = await processList.list();
console.log("Running processes:", processes.length);
```

### Filter Processes

```typescript
const nodeProcesses = await processList.findByName("node");
console.log("Node processes:", nodeProcesses);
```

### Sort and Limit

```typescript
const topCpu = await processList.list({
  sortBy: "cpu",
  limit: 10
});

const topMemory = await processList.list({
  sortBy: "memory",
  limit: 10
});
```

### Find by PID

```typescript
const process = await processList.findByPid(1234);
if (process) {
  console.log("Found:", process.name);
}
```

### Print Process Table

```typescript
import { ProcessList } from "./elide-process-list.ts";

const processes = await processList.list({ limit: 20 });
ProcessList.print(processes);
```

## API Reference

### `processList.list(options?)`

Get list of running processes.

**Options:**
- `filter?: string` - Filter by process name
- `sortBy?: "pid" | "name" | "cpu" | "memory"` - Sort field
- `limit?: number` - Limit results

**Returns:** `Promise<ProcessInfo[]>`

### `processList.findByPid(pid)`

Find process by PID.

**Returns:** `Promise<ProcessInfo | undefined>`

### `processList.findByName(name)`

Find processes by name (partial match).

**Returns:** `Promise<ProcessInfo[]>`

### `ProcessList.print(processes)`

Print process table to console.

### `ProcessList.formatMemory(bytes)`, `ProcessList.formatUptime(ms)`

Format utilities.

## Types

```typescript
interface ProcessInfo {
  pid: number;
  name: string;
  cpu: number;        // CPU usage percentage
  memory: number;     // Memory in bytes
  startTime: number;  // Start timestamp
}
```

## Polyglot Benefits

Use process listing across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One process API everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Cross-platform** - Works everywhere
- **Flexible** - Filter, sort, limit
- **10K+ downloads/week** - Reliable tool

## License

MIT
