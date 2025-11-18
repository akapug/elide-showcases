# framer-motion - Elide Conversion

**Original package:** [`framer-motion`](https://www.npmjs.com/package/framer-motion)

**Category:** Animation

**Tier:** B (8.0M downloads/week)

## Description

Production-ready motion library for React

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
cd converted/utilities/framer-motion
elide run elide-framer-motion.ts
```

## Usage

See `elide-framer-motion.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 8.0M/week
- Repository: https://www.npmjs.com/package/framer-motion
