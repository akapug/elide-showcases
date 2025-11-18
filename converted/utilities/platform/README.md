# Platform - Platform Detection Library

**Pure TypeScript implementation of platform detection for Elide.**

Based on [platform](https://www.npmjs.com/package/platform) (~1M+ downloads/week)

## Features

- OS detection
- Browser detection
- Engine detection
- Architecture detection
- User agent parsing
- Zero dependencies

## Installation

```bash
elide install @elide/platform
```

## Usage

### Detect Platform

```typescript
import platform from "./elide-platform.ts";

console.log(platform.description);  // "Elide on Linux"
console.log(platform.name);         // "Elide"
console.log(platform.os.family);    // "Linux"
console.log(platform.os.architecture); // 64
```

### Parse User Agent

```typescript
import { parse } from "./elide-platform.ts";

const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/96.0";
const info = parse(ua);

console.log(info.os.family);  // "Windows"
```

### Platform-Specific Code

```typescript
import platform from "./elide-platform.ts";

if (platform.os.family === "Windows") {
  // Windows-specific code
} else if (platform.os.family === "OS X") {
  // macOS-specific code
} else if (platform.os.family === "Linux") {
  // Linux-specific code
}
```

### Feature Detection

```typescript
const is64Bit = platform.os.architecture === 64;
const isWindows = platform.os.family === "Windows";
const isChrome = platform.name === "Chrome";
```

## API Reference

### `platform`

Global platform object.

**Properties:**
- `description: string` - Full description
- `name: string` - Platform/browser name
- `layout?: string` - Rendering engine
- `os.family: string` - OS family name
- `os.architecture?: number` - Architecture (32 or 64)
- `os.version?: string` - OS version
- `version?: string` - Platform version

### `parse(ua: string)`

Parse user agent string.

**Returns:** `Platform`

### `toString()`

Get platform description string.

**Returns:** `string`

## Types

```typescript
interface Platform {
  description: string;
  layout?: string;
  manufacturer?: string;
  name: string;
  os: {
    architecture?: number;
    family: string;
    version?: string;
  };
  product?: string;
  version?: string;
}
```

## Supported Platforms

- **OS**: Windows, macOS, Linux, and more
- **Browsers**: Chrome, Firefox, Safari, Edge
- **Engines**: Blink, Gecko, WebKit, GraalVM
- **Architecture**: 32-bit, 64-bit

## Polyglot Benefits

Use platform detection across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One detector everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Fast** - Instant detection
- **Universal** - Browser and Node.js
- **1M+ downloads/week** - Industry standard

## License

MIT
