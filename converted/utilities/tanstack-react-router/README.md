# @tanstack/react-router - Elide Conversion

**Original package:** [`@tanstack/react-router`](https://www.npmjs.com/package/@tanstack/react-router)

**Category:** Routing

**Tier:** B (0.2M downloads/week)

## Description

Modern and scalable routing for React

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
cd converted/utilities/tanstack-react-router
elide run elide-tanstack-react-router.ts
```

## Usage

See `elide-tanstack-react-router.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 0.2M/week
- Repository: https://www.npmjs.com/package/@tanstack/react-router
