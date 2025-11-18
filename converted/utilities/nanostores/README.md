# nanostores - Elide Conversion

**Original package:** [`nanostores`](https://www.npmjs.com/package/nanostores)

**Category:** State Management

**Tier:** B (0.5M downloads/week)

## Description

Tiny state manager for React/Preact/Vue/Svelte

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
cd converted/utilities/nanostores
elide run elide-nanostores.ts
```

## Usage

See `elide-nanostores.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.5M/week
- Repository: https://www.npmjs.com/package/nanostores
