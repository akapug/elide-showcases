# swr - Elide Conversion

**Original package:** [`swr`](https://www.npmjs.com/package/swr)

**Category:** Data Fetching

**Tier:** B (3.0M downloads/week)

## Description

React Hooks for data fetching

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
cd converted/utilities/swr
elide run elide-swr.ts
```

## Usage

See `elide-swr.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 3.0M/week
- Repository: https://www.npmjs.com/package/swr
