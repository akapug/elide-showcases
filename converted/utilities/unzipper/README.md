# Unzipper - Elide Polyglot Showcase

> **One zip extractor for ALL languages**

## Quick Start

```typescript
import { Open, Extract } from './elide-unzipper.ts';

// Extract zip file
const directory = await Open('archive.zip');
await directory.extract({ path: './output' });
```

## Package Stats

- **npm downloads**: ~4M/week
- **Polyglot score**: 35/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
