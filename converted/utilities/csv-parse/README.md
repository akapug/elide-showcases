# CSV Parse - Elide Polyglot Showcase

> **One CSV parser for ALL languages**

## Quick Start

```typescript
import { parse } from './elide-csv-parse.ts';

const csv = 'name,age\nJohn,30\nJane,25';
const data = parse(csv, { columns: true });
console.log(data);
// [{ name: 'John', age: '30' }, { name: 'Jane', age: '25' }]
```

## Package Stats

- **npm downloads**: ~6M/week
- **Polyglot score**: 41/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
