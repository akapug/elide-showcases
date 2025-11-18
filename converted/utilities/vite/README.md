# vite - Elide Conversion

**Original package:** [`vite`](https://www.npmjs.com/package/vite)

**Category:** Build Tools

**Tier:** A (15.0M downloads/week)

## Description

Next generation frontend tooling

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
cd converted/utilities/vite
elide run elide-vite.ts
```

## Usage

See `elide-vite.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 15.0M/week
- Repository: https://www.npmjs.com/package/vite
