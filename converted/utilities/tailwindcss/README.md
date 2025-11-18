# tailwindcss - Elide Conversion

**Original package:** [`tailwindcss`](https://www.npmjs.com/package/tailwindcss)

**Category:** UI/CSS

**Tier:** B (19.5M downloads/week)

## Description

Utility-first CSS framework

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
cd converted/utilities/tailwindcss
elide run elide-tailwindcss.ts
```

## Usage

See `elide-tailwindcss.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 19.5M/week
- Repository: https://www.npmjs.com/package/tailwindcss
