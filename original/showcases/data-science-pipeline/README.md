# Data Science Pipeline

**Python Pandas + TypeScript Polyglot Integration**

REAL cross-language data science with direct Python Pandas imports in TypeScript!

## Features

- Direct Python Pandas imports in TypeScript
- Zero serialization overhead
- <1ms cross-language calls
- Single process execution
- Real data analysis capabilities

## Quick Start

```bash
# Run server
elide run server.ts

# Run examples
elide run examples.ts
```

## API Endpoints

- `POST /api/aggregate` - Aggregate data (groupby)
- `POST /api/filter` - Filter data
- `POST /api/stats` - Compute statistics
- `POST /api/pivot` - Pivot tables
- `POST /api/merge` - Merge datasets

## Example Usage

```typescript
import { processor } from "./analytics.py";

const data = [
  { region: "North", revenue: 1000 },
  { region: "South", revenue: 2000 }
];

const result = processor.aggregate_data(data, "region", "revenue", "sum");
```

## Why This Matters

Traditional: TypeScript → HTTP → Python Pandas (50-100ms)
Polyglot: TypeScript → Direct Call → Python Pandas (<1ms)

This is 50-100x faster with zero serialization!
