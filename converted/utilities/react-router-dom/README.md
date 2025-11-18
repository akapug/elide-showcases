# react-router-dom - Elide Conversion

**Original package:** [`react-router-dom`](https://www.npmjs.com/package/react-router-dom)

**Category:** Routing

**Tier:** B (14.0M downloads/week)

## Description

DOM bindings for React Router

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
cd converted/utilities/react-router-dom
elide run elide-react-router-dom.ts
```

## Usage

See `elide-react-router-dom.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 14.0M/week
- Repository: https://www.npmjs.com/package/react-router-dom
