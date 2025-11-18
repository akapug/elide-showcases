# Detect Libc - C Library Detection

**Pure TypeScript implementation of libc detection for Elide.**

Based on [detect-libc](https://www.npmjs.com/package/detect-libc) (~10M+ downloads/week)

## Features

- Detect glibc
- Detect musl
- Version detection
- Family detection
- Binary compatibility checking
- Zero dependencies

## Installation

```bash
elide install @elide/detect-libc
```

## Usage

### Detect Libc Family

```typescript
import { family, GLIBC, MUSL } from "./elide-detect-libc.ts";

const libc = family();

if (libc === GLIBC) {
  console.log("Using glibc");
} else if (libc === MUSL) {
  console.log("Using musl");
} else {
  console.log("Not on Linux");
}
```

### Get Version

```typescript
import { version } from "./elide-detect-libc.ts";

const ver = version();
console.log("Libc version:", ver);
```

### Check Musl

```typescript
import { isMusl } from "./elide-detect-libc.ts";

if (isMusl()) {
  console.log("Running on musl-based system (Alpine, etc.)");
}
```

### Get Full Info

```typescript
import { info } from "./elide-detect-libc.ts";

const libcInfo = info();
console.log(libcInfo);
// {
//   family: "glibc",
//   version: "2.31",
//   method: "detect-libc"
// }
```

### Native Module Selection

```typescript
import { family, GLIBC, MUSL } from "./elide-detect-libc.ts";

function getNativeModule(): string {
  const libc = family();

  if (libc === GLIBC) {
    return "./native/glibc/module.node";
  } else if (libc === MUSL) {
    return "./native/musl/module.node";
  } else {
    return "./native/fallback/module.node";
  }
}
```

## API Reference

### `family()`

Get libc family.

**Returns:** `"glibc" | "musl" | null`

### `familySync()`

Synchronous version of `family()`.

**Returns:** `"glibc" | "musl" | null`

### `version()`

Get libc version.

**Returns:** `string | null`

### `versionSync()`

Synchronous version of `version()`.

**Returns:** `string | null`

### `info()`

Get detailed libc information.

**Returns:** `LibcInfo`

### `isMusl()`

Check if using musl libc.

**Returns:** `boolean`

### `isNonGlibcLinux()`

Check if Linux but not glibc.

**Returns:** `boolean`

## Constants

- `GLIBC` - "glibc"
- `MUSL` - "musl"

## Types

```typescript
type LibcFamily = "glibc" | "musl" | null;

interface LibcInfo {
  family: LibcFamily;
  version?: string;
  method?: string;
}
```

## Libc Families

**glibc (GNU C Library):**
- Used by: Ubuntu, Debian, Fedora, CentOS, RHEL
- Most common on Linux
- Larger, feature-rich

**musl:**
- Used by: Alpine Linux, Void Linux
- Lightweight, fast
- Popular in containers

## Polyglot Benefits

Use libc detection across all languages on Elide:

- **JavaScript/TypeScript**: Native support
- **Python**: via Elide polyglot runtime
- **Ruby**: via Elide polyglot runtime
- **Java**: via Elide polyglot runtime

One detector everywhere!

## Performance

- **Zero dependencies** - Pure TypeScript
- **Fast** - Instant detection
- **Accurate** - glibc and musl support
- **10M+ downloads/week** - Critical infrastructure

## License

MIT
