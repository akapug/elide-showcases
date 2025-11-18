# ky - Elide Conversion

**Original package:** [`ky`](https://www.npmjs.com/package/ky)

**Category:** HTTP

**Tier:** B (3.0M downloads/week)

## Description

Tiny and elegant HTTP client based on Fetch API

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
cd converted/utilities/ky
elide run elide-ky.ts
```

## Usage

See `elide-ky.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 3.0M/week
- Repository: https://www.npmjs.com/package/ky
