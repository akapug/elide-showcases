# passport-local - Elide Conversion

**Original package:** [`passport-local`](https://www.npmjs.com/package/passport-local)

**Category:** Authentication

**Tier:** B (0.8M downloads/week)

## Description

Local username and password authentication

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
cd converted/utilities/passport-local
elide run elide-passport-local.ts
```

## Usage

See `elide-passport-local.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.8M/week
- Repository: https://www.npmjs.com/package/passport-local
