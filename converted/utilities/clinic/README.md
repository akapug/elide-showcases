# Clinic - Performance Profiler

**Pure TypeScript implementation of Clinic profiling toolkit for Elide.**

Based on [clinic](https://www.npmjs.com/package/clinic) (~30K+ downloads/week)

## Features

- CPU profiling
- Memory profiling
- Event loop monitoring
- Performance reports
- Statistical analysis
- Zero dependencies (core functionality)

## Installation

```bash
elide install @elide/clinic
```

## Usage

### Basic Profiling

```typescript
import { Clinic } from "./elide-clinic.ts";

const clinic = new Clinic({
  sampleInterval: 100,  // Sample every 100ms
  duration: 10000,      // Profile for 10 seconds
  includeMemory: true,  // Include memory stats
});

clinic.start();
// Your application code runs here...
```

### Profile a Function

```typescript
import { profile } from "./elide-clinic.ts";

const report = await profile(
  async () => {
    // CPU-intensive work
    for (let i = 0; i < 1000000; i++) {
      Math.sqrt(i);
    }
  },
  { duration: 5000, sampleInterval: 50 }
);

console.log("Profile report:", report);
```

### Custom Options

```typescript
import { Clinic } from "./elide-clinic.ts";

const clinic = new Clinic({
  sampleInterval: 50,     // More frequent sampling
  duration: 30000,        // Longer profiling session
  includeMemory: true,    // Track memory usage
});

clinic.start();
```

### Manual Control

```typescript
import { Clinic } from "./elide-clinic.ts";

const clinic = new Clinic();

// Start profiling
clinic.start();

// Do work...
await runApplication();

// Stop and get report
const report = clinic.stop();
console.log("Stats:", report.stats);
```

## Profile Report

The profiler generates comprehensive reports:

```typescript
interface ProfileReport {
  startTime: number;
  endTime: number;
  duration: number;
  samples: ProfileSample[];
  stats: {
    avgCpu: number;       // Average CPU usage %
    maxCpu: number;       // Peak CPU usage %
    avgMemory?: number;   // Average heap usage (bytes)
    maxMemory?: number;   // Peak heap usage (bytes)
    avgEventLoop?: number; // Average event loop lag (ms)
    maxEventLoop?: number; // Peak event loop lag (ms)
  };
}
```

## API Reference

### `new Clinic(options?)`

Create a new profiler instance.

**Options:**
- `sampleInterval?: number` - Sampling interval in ms (default: 100)
- `duration?: number` - Auto-stop duration in ms (default: 10000)
- `includeMemory?: boolean` - Include memory stats (default: true)

### `clinic.start()`

Start profiling.

### `clinic.stop()`

Stop profiling and return report.

**Returns:** `ProfileReport`

### `profile(fn, options?)`

Quick profile helper function.

**Parameters:**
- `fn: () => void | Promise<void>` - Function to profile
- `options?: ProfileOptions` - Profiling options

**Returns:** `Promise<ProfileReport>`

## Output Example

```
🔬 Clinic profiler started
  Sample interval: 100ms
  Duration: 10000ms

📊 Clinic Profile Report
============================================================
Duration: 10.00s
Samples collected: 100

CPU Usage:
  Average: 45.23%
  Peak: 87.65%

Memory Usage:
  Average: 125.45 MB
  Peak: 256.78 MB

Event Loop Lag:
  Average: 2.34ms
  Peak: 15.67ms
============================================================
```

## Polyglot Benefits

Use the same profiling tool across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One profiler everywhere!

## Performance

- **Zero dependencies** - Core functionality is standalone
- **Low overhead** - Minimal impact on performance
- **Real-time** - Live performance monitoring
- **30K+ downloads/week** - Trusted by developers

## License

MIT
