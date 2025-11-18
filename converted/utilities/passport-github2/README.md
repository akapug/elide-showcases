# passport-github2 - Elide Conversion

**Original package:** [`passport-github2`](https://www.npmjs.com/package/passport-github2)

**Category:** Authentication

**Tier:** B (0.2M downloads/week)

## Description

GitHub OAuth authentication

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
cd converted/utilities/passport-github2
elide run elide-passport-github2.ts
```

## Usage

See `elide-passport-github2.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.2M/week
- Repository: https://www.npmjs.com/package/passport-github2
