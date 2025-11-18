# astro - Elide Conversion

**Original package:** [`astro`](https://www.npmjs.com/package/astro)

**Category:** Frameworks

**Tier:** B (0.85M downloads/week)

## Description

Build faster websites with less client-side JavaScript

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
cd converted/utilities/astro
elide run elide-astro.ts
```

## Usage

See `elide-astro.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.85M/week
- Repository: https://www.npmjs.com/package/astro
