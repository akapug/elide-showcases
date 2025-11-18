# @testing-library/user-event - Elide Conversion

**Original package:** [`@testing-library/user-event`](https://www.npmjs.com/package/@testing-library/user-event)

**Category:** Testing

**Tier:** A (14.0M downloads/week)

## Description

Simulate user events for testing

## Why Elide?

This package benefits from Elide's runtime in the following ways:

- **10x faster cold start** (~20ms vs ~200ms) - Critical for serverless and CLI tools
- **Zero dependencies** - No node_modules, instant execution
- **Native performance** - GraalVM optimizations

## Installation

```bash
# Install Elide
curl -sSL --tlsv1.2 https://elide.sh | bash -s - --install-rev=1.0.0-beta11-rc1

# Run this conversion
cd converted/utilities/testing-library-user-event
elide run elide-testing-library-user-event.ts
```

## Usage

See `elide-testing-library-user-event.ts` for implementation examples.

## Performance

Expected **significant** performance improvement with Elide.

## Original Package

- Downloads: 14.0M/week
- Repository: https://www.npmjs.com/package/@testing-library/user-event
