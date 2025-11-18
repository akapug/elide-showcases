# llamaindex - Elide Conversion

**Original package:** [`llamaindex`](https://www.npmjs.com/package/llamaindex)

**Category:** AI/ML

**Tier:** B (0.5M downloads/week)

## Description

Data framework for LLM applications

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
cd converted/utilities/llamaindex
elide run elide-llamaindex.ts
```

## Usage

See `elide-llamaindex.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.5M/week
- Repository: https://www.npmjs.com/package/llamaindex
