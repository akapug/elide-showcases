# Redis - Elide Polyglot Showcase

> **One Redis client for ALL languages**

## Quick Start

```typescript
import { createClient } from './elide-redis.ts';

const client = createClient();
await client.connect();
await client.set('key', 'value');
const value = await client.get('key');
```

## Package Stats

- **npm downloads**: ~6M/week
- **Polyglot score**: 45/50 (A-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
