# @testing-library/dom - Elide Conversion

**Original package:** [`@testing-library/dom`](https://www.npmjs.com/package/@testing-library/dom)

**Category:** Testing

**Tier:** A (20.1M downloads/week)

## Description

Simple and complete DOM testing utilities

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
cd converted/utilities/testing-library-dom
elide run elide-testing-library-dom.ts
```

## Usage

See `elide-testing-library-dom.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 20.1M/week
- Repository: https://www.npmjs.com/package/@testing-library/dom
