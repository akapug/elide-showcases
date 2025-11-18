# Inspector API - Node.js Inspector Integration

**Pure TypeScript implementation of Inspector API for Elide.**

Based on [inspector-api](https://www.npmjs.com/package/inspector-api) (~10K+ downloads/week)

## Features

- Inspector session management
- Profiler control
- Heap profiler access
- Runtime evaluation
- Debugger control
- Zero dependencies

## Installation

```bash
elide install @elide/inspector-api
```

## Usage

### Open Inspector

```typescript
import inspector from "./elide-inspector-api.ts";

inspector.open(9229, "127.0.0.1");
console.log("Inspector URL:", inspector.url());
```

### Create Session

```typescript
import inspector from "./elide-inspector-api.ts";

const session = new inspector.Session(inspector);
session.connect();

session.post("Profiler.enable", {}, (err, result) => {
  console.log("Profiler enabled");
});
```

### CPU Profiling

```typescript
const session = new inspector.Session(inspector);
session.connect();

session.post("Profiler.enable");
session.post("Profiler.start");

// Run code...

session.post("Profiler.stop", {}, (err, result) => {
  console.log("Profile:", result.profile);
});
```

### Heap Profiling

```typescript
session.post("HeapProfiler.enable");
session.post("HeapProfiler.takeHeapSnapshot");
```

### Runtime Evaluation

```typescript
session.post("Runtime.evaluate", { expression: "1 + 1" }, (err, result) => {
  console.log("Result:", result.result.value);
});
```

## API Reference

### `inspector.open(port?, host?, wait?)`

Open inspector on specified port and host.

### `inspector.close()`

Close inspector.

### `inspector.url()`

Get inspector WebSocket URL.

**Returns:** `string | undefined`

### `inspector.waitForDebugger()`

Pause execution until debugger attaches.

### `new inspector.Session()`

Create new inspector session.

### `session.connect()`

Connect session to inspector.

### `session.disconnect()`

Disconnect session.

### `session.post(method, params?, callback?)`

Send command to inspector.

**Parameters:**
- `method: string` - Inspector method (e.g., "Profiler.start")
- `params?: object` - Method parameters
- `callback?: (err, result) => void` - Result callback

## Polyglot Benefits

Use Inspector API across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One inspector everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Programmatic** - Full debugger control
- **Node.js compatible** - Standard API
- **10K+ downloads/week** - Reliable tool

## License

MIT
