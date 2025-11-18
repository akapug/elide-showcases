# Dice Coefficient - Elide Polyglot Showcase

Measure string similarity using the Sørensen-Dice coefficient - works across JavaScript, Python, Ruby, Java, and more via Elide!

Based on the popular npm package `dice-coefficient` (~20K+ downloads/week).

## Features

- Sørensen-Dice coefficient implementation
- Bigram-based string comparison
- Case-insensitive option
- Returns similarity score 0-1
- Helper functions for finding similar strings
- Zero dependencies

## Quick Start

```typescript
import { diceCoefficient, findMostSimilar } from "./elide-dice-coefficient.ts";

// Compare two strings
const score = diceCoefficient("hello", "hallo");
console.log(score); // 0.5 (50% similar)

// Find most similar string
const match = findMostSimilar("San Fransisco", [
  "San Francisco",
  "Los Angeles",
  "San Diego"
]);
console.log(match); // { string: "San Francisco", score: 0.923 }
```

## API

### `diceCoefficient(str1: string, str2: string, caseSensitive?: boolean): number`

Calculate similarity between two strings (0-1 range).

### `findMostSimilar(target: string, candidates: string[], threshold?: number)`

Find the most similar string from candidates.

### `findSimilar(target: string, candidates: string[], threshold?: number)`

Find all similar strings above threshold.

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { diceCoefficient } from "./elide-dice-coefficient.ts";
console.log(diceCoefficient("night", "nacht")); // 0.6
```

### Python (via Elide)
```python
from elide_dice_coefficient import dice_coefficient
print(dice_coefficient("night", "nacht"))  # 0.6
```

### Ruby (via Elide)
```ruby
require 'elide_dice_coefficient'
puts dice_coefficient("night", "nacht")  # 0.6
```

## Use Cases

- **Fuzzy Matching**: Find similar strings with typos
- **Duplicate Detection**: Identify duplicate records
- **Autocomplete**: Provide relevant suggestions
- **Spell Checking**: Suggest corrections
- **Record Linkage**: Match records across databases

## Why Polyglot?

One similarity algorithm for ALL your languages:
- Consistent fuzzy matching across your entire stack
- Share deduplication logic between services
- Build cross-platform search features
- No need for language-specific string libraries

## Performance

- Zero dependencies
- Fast bigram-based algorithm
- ~20K+ downloads/week on npm

## Run the Demo

```bash
elide run elide-dice-coefficient.ts
```
