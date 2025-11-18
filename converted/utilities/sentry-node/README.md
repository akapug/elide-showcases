# @sentry/node - Elide Conversion

**Original package:** [`@sentry/node`](https://www.npmjs.com/package/@sentry/node)

**Category:** Observability

**Tier:** B (5.0M downloads/week)

## Description

Sentry SDK for Node.js

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
cd converted/utilities/sentry-node
elide run elide-sentry-node.ts
```

## Usage

See `elide-sentry-node.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 5.0M/week
- Repository: https://www.npmjs.com/package/@sentry/node
