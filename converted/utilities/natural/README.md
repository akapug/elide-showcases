# Natural - Elide Polyglot Showcase

> **One NLP library for ALL languages** - TypeScript, Python, Ruby, and Java

Natural Language Processing utilities for text analysis.

## Features

- Tokenization
- Stemming (Porter Stemmer)
- N-grams generation
- String distance
- ~3M+ downloads/week on npm

## Quick Start

```typescript
import { tokenize, stem, ngrams } from './elide-natural.ts';

tokenize("Hello world!");        // ["hello", "world"]
stem("running");                 // "run"
ngrams(["a", "b", "c"], 2);      // [["a","b"], ["b","c"]]
```

---

**Built with love for the Elide Polyglot Runtime**
