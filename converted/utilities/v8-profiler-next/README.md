# V8 Profiler Next - V8 Engine Profiling

**Pure TypeScript implementation of V8 profiling for Elide.**

Based on [v8-profiler-next](https://www.npmjs.com/package/v8-profiler-next) (~20K+ downloads/week)

## Features

- CPU profiling
- Heap snapshots
- Heap sampling
- Chrome DevTools export
- Profile management
- Zero dependencies (core)

## Installation

```bash
elide install @elide/v8-profiler-next
```

## Usage

### CPU Profiling

```typescript
import { profiler } from "./elide-v8-profiler-next.ts";

// Start profiling
profiler.startProfiling("my-profile");

// Run code
doWork();

// Stop and get profile
const profile = profiler.stopProfiling("my-profile");
```

### Heap Snapshots

```typescript
import { profiler } from "./elide-v8-profiler-next.ts";

const snapshot = profiler.takeSnapshot("snapshot-1");

console.log("Total size:", snapshot.totalSize);
console.log("Total objects:", snapshot.totalCount);
```

### Heap Sampling

```typescript
import { profiler } from "./elide-v8-profiler-next.ts";

// Start sampling
profiler.startSamplingHeapProfiling(512 * 1024, 16);

// Allocate memory...
const data = [];
for (let i = 0; i < 10000; i++) {
  data.push({ value: i });
}

// Stop sampling
const snapshot = profiler.stopSamplingHeapProfiling();
```

### Export to Chrome DevTools

```typescript
const profile = profiler.stopProfiling("my-profile");
const devToolsFormat = profiler.exportToDevTools(profile);

// Save to file for Chrome DevTools
```

## API Reference

### `profiler.startProfiling(name, recsamples?)`

Start CPU profiling with given name.

### `profiler.stopProfiling(name)`

Stop CPU profiling and return profile.

**Returns:** `CPUProfile | undefined`

### `profiler.takeSnapshot(name?)`

Take a heap snapshot.

**Returns:** `HeapSnapshot`

### `profiler.startSamplingHeapProfiling(interval?, depth?)`

Start heap sampling profiling.

### `profiler.stopSamplingHeapProfiling()`

Stop heap sampling and return snapshot.

**Returns:** `HeapSnapshot`

### `profiler.exportToDevTools(profile)`

Export profile to Chrome DevTools format.

**Returns:** JSON string

### `profiler.deleteAllProfiles()`

Delete all profiles and snapshots.

### `profiler.getProfileNames()`, `profiler.getSnapshotNames()`

Get list of profile/snapshot names.

## Polyglot Benefits

Use V8 profiling across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via GraalPy on Elide
- **Ruby**: via TruffleRuby on Elide
- **Java**: via GraalVM on Elide

One profiler everywhere!

## Performance

- **Zero dependencies** - Core functionality
- **V8 integration** - Engine-level profiling
- **Chrome DevTools** - Standard format
- **20K+ downloads/week** - Production ready

## License

MIT
