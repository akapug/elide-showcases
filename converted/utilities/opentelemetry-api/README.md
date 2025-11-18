# @opentelemetry/api - Elide Conversion

**Original package:** [`@opentelemetry/api`](https://www.npmjs.com/package/@opentelemetry/api)

**Category:** Observability

**Tier:** B (15.0M downloads/week)

## Description

OpenTelemetry API

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
cd converted/utilities/opentelemetry-api
elide run elide-opentelemetry-api.ts
```

## Usage

See `elide-opentelemetry-api.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 15.0M/week
- Repository: https://www.npmjs.com/package/@opentelemetry/api
