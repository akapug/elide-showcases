# @opentelemetry/sdk-node - Elide Conversion

**Original package:** [`@opentelemetry/sdk-node`](https://www.npmjs.com/package/@opentelemetry/sdk-node)

**Category:** Observability

**Tier:** B (2.0M downloads/week)

## Description

OpenTelemetry SDK for Node.js

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
cd converted/utilities/opentelemetry-sdk-node
elide run elide-opentelemetry-sdk-node.ts
```

## Usage

See `elide-opentelemetry-sdk-node.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 2.0M/week
- Repository: https://www.npmjs.com/package/@opentelemetry/sdk-node
