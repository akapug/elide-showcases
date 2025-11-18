# recoil - Elide Conversion

**Original package:** [`recoil`](https://www.npmjs.com/package/recoil)

**Category:** State Management

**Tier:** B (1.0M downloads/week)

## Description

State management library for React

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
cd converted/utilities/recoil
elide run elide-recoil.ts
```

## Usage

See `elide-recoil.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 1.0M/week
- Repository: https://www.npmjs.com/package/recoil
