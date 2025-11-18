# Jaro-Winkler - Elide Polyglot Showcase

String similarity using Jaro-Winkler distance - works across JavaScript, Python, Ruby, Java via Elide!

Based on npm package `jaro-winkler` (~10K+ downloads/week).

## Features

- Jaro and Jaro-Winkler distance algorithms
- Optimized for short strings (especially names)
- Prefix boost for better matching
- Returns similarity score 0-1
- Zero dependencies

## Quick Start

```typescript
import { jaroWinkler, jaro } from "./elide-jaro-winkler.ts";

// Jaro-Winkler (with prefix boost)
console.log(jaroWinkler("MARTHA", "MARHTA")); // 0.961

// Basic Jaro (without prefix boost)
console.log(jaro("MARTHA", "MARHTA")); // 0.944
```

## Use Cases

- Name matching (people, companies, places)
- Record linkage and deduplication
- Fuzzy search in databases
- Spell checking and autocorrect
- Address matching
- Entity resolution

## Run the Demo

```bash
elide run elide-jaro-winkler.ts
```
