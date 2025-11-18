# clsx - Elide Conversion

**Original package:** [`clsx`](https://www.npmjs.com/package/clsx)

**Category:** Utilities

**Tier:** A (34.3M downloads/week)

## Description

Tiny utility for constructing className strings

## Why Elide?

This package benefits from Elide's runtime in the following ways:

- **10x faster cold start** (~20ms vs ~200ms) - Critical for serverless and CLI tools
- **Zero dependencies** - No node_modules, instant execution
- **Native performance** - GraalVM optimizations

## Installation

```bash
# Install Elide
curl -sSL --tlsv1.2 https://elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1

# Run this conversion
cd converted/utilities/clsx
elide run elide-clsx.ts
```

## Usage

See `elide-clsx.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 34.3M/week
- Repository: https://www.npmjs.com/package/clsx
