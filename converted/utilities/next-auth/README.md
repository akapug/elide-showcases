# next-auth - Elide Conversion

**Original package:** [`next-auth`](https://www.npmjs.com/package/next-auth)

**Category:** Authentication

**Tier:** B (3.0M downloads/week)

## Description

Authentication for Next.js

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
cd converted/utilities/next-auth
elide run elide-next-auth.ts
```

## Usage

See `elide-next-auth.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 3.0M/week
- Repository: https://www.npmjs.com/package/next-auth
