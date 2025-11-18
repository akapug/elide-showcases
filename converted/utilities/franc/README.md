# Franc - Elide Polyglot Showcase

> **One language detection library for ALL languages** - TypeScript, Python, Ruby, and Java

Detect the natural language of text using trigram analysis.

## Features

- Detects major world languages
- Fast trigram-based analysis
- Lightweight and zero dependencies
- ~500K+ downloads/week on npm

## Quick Start

```typescript
import franc from './elide-franc.ts';

franc("Hello world");        // "eng"
franc("Hola mundo");         // "spa"
franc("Bonjour le monde");   // "fra"
```

---

**Built with love for the Elide Polyglot Runtime**
