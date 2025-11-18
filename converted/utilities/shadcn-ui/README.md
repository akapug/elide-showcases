# shadcn-ui - Elide Conversion

**Original package:** [`shadcn-ui`](https://www.npmjs.com/package/shadcn-ui)

**Category:** UI Components

**Tier:** B (0.3M downloads/week)

## Description

Re-usable components built with Radix UI and Tailwind

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
cd converted/utilities/shadcn-ui
elide run elide-shadcn-ui.ts
```

## Usage

See `elide-shadcn-ui.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.3M/week
- Repository: https://www.npmjs.com/package/shadcn-ui
