# react-spring - Elide Conversion

**Original package:** [`react-spring`](https://www.npmjs.com/package/react-spring)

**Category:** Animation

**Tier:** B (3.0M downloads/week)

## Description

Spring-physics based animation library

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
cd converted/utilities/react-spring
elide run elide-react-spring.ts
```

## Usage

See `elide-react-spring.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 3.0M/week
- Repository: https://www.npmjs.com/package/react-spring
