# redaxios - Elide Conversion

**Original package:** [`redaxios`](https://www.npmjs.com/package/redaxios)

**Category:** HTTP

**Tier:** B (0.2M downloads/week)

## Description

Axios API in 800 bytes

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
cd converted/utilities/redaxios
elide run elide-redaxios.ts
```

## Usage

See `elide-redaxios.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.2M/week
- Repository: https://www.npmjs.com/package/redaxios
