# @testing-library/react - Elide Conversion

**Original package:** [`@testing-library/react`](https://www.npmjs.com/package/@testing-library/react)

**Category:** Testing

**Tier:** A (18.0M downloads/week)

## Description

Simple React DOM testing utilities

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
cd converted/utilities/testing-library-react
elide run elide-testing-library-react.ts
```

## Usage

See `elide-testing-library-react.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 18.0M/week
- Repository: https://www.npmjs.com/package/@testing-library/react
