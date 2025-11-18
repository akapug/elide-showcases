# @tensorflow/tfjs-node - Elide Conversion

**Original package:** [`@tensorflow/tfjs-node`](https://www.npmjs.com/package/@tensorflow/tfjs-node)

**Category:** AI/ML

**Tier:** B (0.8M downloads/week)

## Description

TensorFlow.js for Node.js

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
cd converted/utilities/tensorflow-tfjs-node
elide run elide-tensorflow-tfjs-node.ts
```

## Usage

See `elide-tensorflow-tfjs-node.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.8M/week
- Repository: https://www.npmjs.com/package/@tensorflow/tfjs-node
