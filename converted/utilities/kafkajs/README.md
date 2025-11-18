# kafkajs - Elide Conversion

**Original package:** [`kafkajs`](https://www.npmjs.com/package/kafkajs)

**Category:** Message Queues

**Tier:** B (2.5M downloads/week)

## Description

Modern Apache Kafka client for Node.js

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
cd converted/utilities/kafkajs
elide run elide-kafkajs.ts
```

## Usage

See `elide-kafkajs.ts` for implementation examples.

## Performance

Expected **moderate** performance improvement with Elide.

## Original Package

- Downloads: 2.5M/week
- Repository: https://www.npmjs.com/package/kafkajs
