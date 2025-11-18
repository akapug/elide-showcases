# @sentry/react - Elide Conversion

**Original package:** [`@sentry/react`](https://www.npmjs.com/package/@sentry/react)

**Category:** Observability

**Tier:** B (4.0M downloads/week)

## Description

Sentry SDK for React

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
cd converted/utilities/sentry-react
elide run elide-sentry-react.ts
```

## Usage

See `elide-sentry-react.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 4.0M/week
- Repository: https://www.npmjs.com/package/@sentry/react
