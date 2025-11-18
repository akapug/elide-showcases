# Is WSL - Windows Subsystem for Linux Detection

**Pure TypeScript implementation of WSL detection for Elide.**

Based on [is-wsl](https://www.npmjs.com/package/is-wsl) (~3M+ downloads/week)

## Features

- WSL 1 detection
- WSL 2 detection
- Version detection
- Distribution detection
- Zero dependencies

## Installation

```bash
elide install @elide/is-wsl
```

## Usage

### Check if WSL

```typescript
import isWSL from "./elide-is-wsl.ts";

if (isWSL()) {
  console.log("Running in WSL");
}
```

### Check WSL Version

```typescript
import { isWSL2, getWSLVersion } from "./elide-is-wsl.ts";

if (isWSL2()) {
  console.log("Running in WSL 2");
}

const version = getWSLVersion();
console.log("WSL version:", version); // 1, 2, or null
```

### Get Distribution

```typescript
import { getWSLDistro } from "./elide-is-wsl.ts";

const distro = getWSLDistro();
if (distro) {
  console.log("Distribution:", distro); // e.g., "Ubuntu"
}
```

### Platform-Specific Code

```typescript
import isWSL from "./elide-is-wsl.ts";

if (isWSL()) {
  // WSL-specific code
  // Handle Windows/Linux path conversion
} else if (process.platform === "linux") {
  // Native Linux code
} else {
  // Windows or other platform
}
```

## API Reference

### `isWSL()`

Check if running in WSL (1 or 2).

**Returns:** `boolean`

### `isWSL2()`

Check if running in WSL 2 specifically.

**Returns:** `boolean`

### `getWSLVersion()`

Get WSL version.

**Returns:** `1 | 2 | null`

### `getWSLDistro()`

Get WSL distribution name.

**Returns:** `string | null`

## Detection Method

Checks for:
- `WSL_DISTRO_NAME` environment variable
- `WSL_INTEROP` environment variable (WSL 2)
- `/proc/version` content (in real implementation)
- Kernel version (WSL 2 uses 4.19+)

## WSL Versions

**WSL 1:**
- Translation layer
- System call compatibility
- Detected by `WSL_DISTRO_NAME`

**WSL 2:**
- Full Linux kernel (VM)
- Better performance
- Detected by `WSL_INTEROP`

## Polyglot Benefits

Use WSL detection across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One detector everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Fast** - Instant detection
- **Accurate** - WSL 1 and 2 support
- **3M+ downloads/week** - Industry standard

## License

MIT
