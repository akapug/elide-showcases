# @tensorflow/tfjs - Elide Conversion

**Original package:** [`@tensorflow/tfjs`](https://www.npmjs.com/package/@tensorflow/tfjs)

**Category:** AI/ML

**Tier:** B (2.0M downloads/week)

## Description

TensorFlow.js - ML for JavaScript

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
cd converted/utilities/tensorflow-tfjs
elide run elide-tensorflow-tfjs.ts
```

## Usage

See `elide-tensorflow-tfjs.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 2.0M/week
- Repository: https://www.npmjs.com/package/@tensorflow/tfjs
