# jotai - Elide Conversion

**Original package:** [`jotai`](https://www.npmjs.com/package/jotai)

**Category:** State Management

**Tier:** B (1.5M downloads/week)

## Description

Primitive and flexible state management for React

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
cd converted/utilities/jotai
elide run elide-jotai.ts
```

## Usage

See `elide-jotai.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 1.5M/week
- Repository: https://www.npmjs.com/package/jotai
