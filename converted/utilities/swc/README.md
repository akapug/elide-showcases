# swc - Elide Conversion

**Original package:** [`swc`](https://www.npmjs.com/package/swc)

**Category:** Build Tools

**Tier:** A (8.0M downloads/week)

## Description

Super-fast TypeScript/JavaScript compiler

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
cd converted/utilities/swc
elide run elide-swc.ts
```

## Usage

See `elide-swc.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 8.0M/week
- Repository: https://www.npmjs.com/package/swc
