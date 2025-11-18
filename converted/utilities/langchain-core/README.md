# @langchain/core - Elide Conversion

**Original package:** [`@langchain/core`](https://www.npmjs.com/package/@langchain/core)

**Category:** AI/ML

**Tier:** B (1.5M downloads/week)

## Description

Core LangChain interfaces

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
cd converted/utilities/langchain-core
elide run elide-langchain-core.ts
```

## Usage

See `elide-langchain-core.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 1.5M/week
- Repository: https://www.npmjs.com/package/@langchain/core
