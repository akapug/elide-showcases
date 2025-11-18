# sharp - Elide Conversion

**Original package:** [`sharp`](https://www.npmjs.com/package/sharp)

**Category:** AI/ML

**Tier:** B (10.0M downloads/week)

## Description

High performance Node.js image processing

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
cd converted/utilities/sharp
elide run elide-sharp.ts
```

## Usage

See `elide-sharp.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 10.0M/week
- Repository: https://www.npmjs.com/package/sharp
