# Compromise - Elide Polyglot Showcase

> **One modest NLP library for ALL languages** - TypeScript, Python, Ruby, and Java

Lightweight Natural Language Processing for text analysis.

## Features

- Basic part-of-speech tagging
- Sentence detection
- Text normalization
- Extract nouns and verbs
- ~1M+ downloads/week on npm

## Quick Start

```typescript
import { tag, sentences, normalize } from './elide-compromise.ts';

tag("The cat is big");                      // [{text: "the", pos: "..."}, ...]
sentences("Hello. How are you?");           // ["Hello", "How are you"]
normalize("Hello,  World!");                // "hello world"
```

---

**Built with love for the Elide Polyglot Runtime**
