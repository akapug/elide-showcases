# apollo-client - Elide Conversion

**Original package:** [`apollo-client`](https://www.npmjs.com/package/apollo-client)

**Category:** Data Fetching

**Tier:** B (4.0M downloads/week)

## Description

A fully-featured caching GraphQL client

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
cd converted/utilities/apollo-client
elide run elide-apollo-client.ts
```

## Usage

See `elide-apollo-client.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 4.0M/week
- Repository: https://www.npmjs.com/package/apollo-client
