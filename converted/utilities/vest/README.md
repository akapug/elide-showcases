# vest - Elide Conversion

**Original package:** [`vest`](https://www.npmjs.com/package/vest)

**Category:** Forms

**Tier:** B (0.2M downloads/week)

## Description

Declarative validations framework

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
cd converted/utilities/vest
elide run elide-vest.ts
```

## Usage

See `elide-vest.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.2M/week
- Repository: https://www.npmjs.com/package/vest
