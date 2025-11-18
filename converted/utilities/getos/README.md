# GetOS - Operating System Detection

**Pure TypeScript implementation of OS detection for Elide.**

Based on [getos](https://www.npmjs.com/package/getos) (~500K+ downloads/week)

## Features

- OS detection
- Distribution detection
- Version/release detection
- Platform checks
- Cross-platform support
- Zero dependencies

## Installation

```bash
elide install @elide/getos
```

## Usage

### Detect OS

```typescript
import getos from "./elide-getos.ts";

const os = await getos();
console.log(os);
// {
//   os: 'linux',
//   dist: 'Ubuntu',
//   codename: 'jammy',
//   release: '22.04',
//   platform: 'linux',
//   arch: 'x64'
// }
```

### Platform Checks

```typescript
import getos, { isLinux, isMac, isWindows } from "./elide-getos.ts";

const os = await getos();

if (isLinux(os)) {
  console.log("Running on Linux");
} else if (isMac(os)) {
  console.log("Running on macOS");
} else if (isWindows(os)) {
  console.log("Running on Windows");
}
```

### Display Name

```typescript
import getos, { getDisplayName } from "./elide-getos.ts";

const os = await getos();
console.log(getDisplayName(os));
// "Ubuntu 22.04"
```

### Platform-Specific Code

```typescript
const os = await getos();

if (os.dist === "Ubuntu") {
  // Ubuntu-specific code
} else if (os.dist === "CentOS") {
  // CentOS-specific code
}
```

## API Reference

### `getos()`

Detect operating system.

**Returns:** `Promise<OSInfo>`

### `isLinux(os)`, `isMac(os)`, `isWindows(os)`

Platform check utilities.

**Returns:** `boolean`

### `getDisplayName(os)`

Get human-readable OS name.

**Returns:** `string`

## Types

```typescript
interface OSInfo {
  os: string;          // OS type: linux, darwin, win32
  dist?: string;       // Distribution name
  codename?: string;   // Release codename
  release?: string;    // Version number
  platform?: string;   // Platform name
  arch?: string;       // Architecture
}
```

## Supported Platforms

- **Linux**: Ubuntu, Debian, CentOS, Fedora, etc.
- **macOS**: All versions
- **Windows**: Windows 10, 11

## Polyglot Benefits

Use OS detection across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One OS detector everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Fast** - Instant detection
- **Cross-platform** - All major OS
- **500K+ downloads/week** - Industry standard

## License

MIT
