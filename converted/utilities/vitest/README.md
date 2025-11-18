# vitest - Elide Conversion

**Original package:** [`vitest`](https://www.npmjs.com/package/vitest)

**Category:** Testing

**Tier:** A (5.0M downloads/week)

## Description

Blazing fast unit test framework

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
cd converted/utilities/vitest
elide run elide-vitest.ts
```

## Usage

See `elide-vitest.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 5.0M/week
- Repository: https://www.npmjs.com/package/vitest
