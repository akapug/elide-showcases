# next - Elide Conversion

**Original package:** [`next`](https://www.npmjs.com/package/next)

**Category:** Frameworks

**Tier:** B (17.9M downloads/week)

## Description

The React Framework for production

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
cd converted/utilities/next
elide run elide-next.ts
```

## Usage

See `elide-next.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 17.9M/week
- Repository: https://www.npmjs.com/package/next
