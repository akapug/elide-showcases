# mobx - Elide Conversion

**Original package:** [`mobx`](https://www.npmjs.com/package/mobx)

**Category:** State Management

**Tier:** B (2.5M downloads/week)

## Description

Simple, scalable state management

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
cd converted/utilities/mobx
elide run elide-mobx.ts
```

## Usage

See `elide-mobx.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 2.5M/week
- Repository: https://www.npmjs.com/package/mobx
