# bun - Elide Conversion

**Original package:** [`bun`](https://www.npmjs.com/package/bun)

**Category:** Build Tools

**Tier:** A (0.5M downloads/week)

## Description

Fast all-in-one JavaScript runtime

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
cd converted/utilities/bun
elide run elide-bun.ts
```

## Usage

See `elide-bun.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 0.5M/week
- Repository: https://www.npmjs.com/package/bun
