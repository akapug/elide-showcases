# micromatch - Elide Conversion

**Original package:** [`micromatch`](https://www.npmjs.com/package/micromatch)

**Category:** File System

**Tier:** A (81.5M downloads/week)

## Description

Highly optimized glob matching

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
cd converted/utilities/micromatch
elide run elide-micromatch.ts
```

## Usage

See `elide-micromatch.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 81.5M/week
- Repository: https://www.npmjs.com/package/micromatch
