# react-aria - Elide Conversion

**Original package:** [`react-aria`](https://www.npmjs.com/package/react-aria)

**Category:** UI Components

**Tier:** B (1.5M downloads/week)

## Description

React Hooks for accessible design systems

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
cd converted/utilities/react-aria
elide run elide-react-aria.ts
```

## Usage

See `elide-react-aria.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 1.5M/week
- Repository: https://www.npmjs.com/package/react-aria
