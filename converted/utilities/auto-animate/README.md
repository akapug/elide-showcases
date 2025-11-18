# auto-animate - Elide Conversion

**Original package:** [`auto-animate`](https://www.npmjs.com/package/auto-animate)

**Category:** Animation

**Tier:** B (0.3M downloads/week)

## Description

Zero-config, drop-in animation utility

## Why Elide?

This package benefits from Elide's runtime in the following ways:

- **Fast execution** - GraalVM JIT optimizations
- **Zero dependencies** - Instant startup
- **TypeScript native** - No build step required

## Installation

```bash
# Install Elide
curl -sSL --tlsv1.2 https://elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1

# Run this conversion
cd converted/utilities/auto-animate
elide run elide-auto-animate.ts
```

## Usage

See `elide-auto-animate.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.3M/week
- Repository: https://www.npmjs.com/package/auto-animate
