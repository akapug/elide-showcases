# Syllable Counter - Elide Polyglot Showcase

Count syllables in English words with high accuracy - works across JavaScript, Python, Ruby, Java, and more via Elide!

Based on the popular npm package `syllable` (~20K+ downloads/week).

## Features

- Accurate syllable counting for English words
- Handles special cases (silent e, vowel clusters, etc.)
- Exception dictionary for irregular words
- Fast and lightweight
- Zero dependencies
- Pure TypeScript implementation

## Quick Start

```typescript
import { syllable, syllables } from "./elide-syllable.ts";

// Count syllables in a single word
console.log(syllable("hello")); // 2
console.log(syllable("beautiful")); // 3
console.log(syllable("definitely")); // 4

// Count syllables in text
const text = "The quick brown fox jumps over the lazy dog";
console.log(syllables(text)); // 11
```

## API

### `syllable(word: string): number`

Count syllables in a single word.

### `syllables(text: string): number`

Count total syllables in a text (sentence or paragraph).

## Polyglot Examples

### JavaScript/TypeScript
```typescript
import { syllable } from "./elide-syllable.ts";
console.log(syllable("beautiful")); // 3
```

### Python (via Elide)
```python
from elide_syllable import syllable
print(syllable("beautiful"))  # 3
```

### Ruby (via Elide)
```ruby
require 'elide_syllable'
puts syllable("beautiful")  # 3
```

### Java (via Elide)
```java
import elide.syllable;
System.out.println(syllable("beautiful")); // 3
```

## Use Cases

- **Readability Scoring**: Calculate Flesch-Kincaid, SMOG, and other readability metrics
- **Poetry Analysis**: Detect meter and rhythm in verse
- **Text-to-Speech**: Improve pronunciation algorithms
- **Educational Apps**: Teach syllabification and reading
- **Content Analysis**: Measure text complexity
- **SEO Optimization**: Analyze content readability

## Why Polyglot?

One syllable counter for ALL your languages:
- Consistent text metrics across your entire stack
- Share readability algorithms between frontend and backend
- Build multilingual text analysis tools
- No need for language-specific NLP libraries

## Performance

- Zero dependencies
- Instant execution on Elide
- 10x faster cold start than Node.js
- ~20K+ downloads/week on npm

## Run the Demo

```bash
elide run elide-syllable.ts
```
