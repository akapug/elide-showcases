# joi - Elide Conversion

**Original package:** [`joi`](https://www.npmjs.com/package/joi)

**Category:** Validation

**Tier:** B (14.5M downloads/week)

## Description

Object schema description and validation

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
cd converted/utilities/joi
elide run elide-joi.ts
```

## Usage

See `elide-joi.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 14.5M/week
- Repository: https://www.npmjs.com/package/joi
