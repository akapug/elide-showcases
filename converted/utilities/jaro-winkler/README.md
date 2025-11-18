# Jaro-Winkler - Elide Polyglot Showcase

> **One Jaro-Winkler similarity library for ALL languages** - TypeScript, Python, Ruby, and Java

Calculate string similarity with emphasis on common prefixes.

## Features

- Returns similarity score (0 to 1)
- Optimized for short strings
- Perfect for name matching
- ~1M+ downloads/week on npm

## Quick Start

```typescript
import jaroWinkler from './elide-jaro-winkler.ts';
jaroWinkler("martha", "marhta");   // 0.96
jaroWinkler("dixon", "dicksonx");  // 0.81
```

---

**Built with love for the Elide Polyglot Runtime**
