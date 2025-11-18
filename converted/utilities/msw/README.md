# msw - Elide Conversion

**Original package:** [`msw`](https://www.npmjs.com/package/msw)

**Category:** Testing

**Tier:** A (8.0M downloads/week)

## Description

Mock Service Worker for API mocking

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
cd converted/utilities/msw
elide run elide-msw.ts
```

## Usage

See `elide-msw.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 8.0M/week
- Repository: https://www.npmjs.com/package/msw
