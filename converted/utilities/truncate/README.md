# Truncate - Elide Polyglot Showcase

> **One text truncation engine for ALL languages** - TypeScript, Python, Ruby, Java

Smart string truncation with word boundary preservation that works across your entire polyglot stack.

## Features

- ✅ Truncate to character or word boundaries
- ✅ Custom ellipsis/suffix
- ✅ Preserve complete words option
- ✅ Tweet-length helper (280 chars)
- ✅ **Polyglot**: TypeScript, Python, Ruby, Java
- ✅ Zero dependencies

## Quick Start

```typescript
import truncate from './elide-truncate.ts';

truncate("Hello World!", 10);                    // "Hello W..."
truncate("The quick brown fox", 20, '…');        // "The quick brown …"
truncateWords("The quick brown fox", 20);        // "The quick brown…"
truncateToTweet(longText);                       // Max 280 chars
```

## Performance

~1.5M ops/sec - Ideal for high-volume content platforms.

## Use Cases

- Article previews
- Mobile UI text
- Meta descriptions
- Search snippets
- Email summaries

## Files

- `elide-truncate.ts` - Main implementation (205 lines)
- Language examples (Python, Ruby, Java)
- `benchmark.ts`, `CASE_STUDY.md`, `README.md`

**Total**: ~700 lines

## Package Stats

- **Use case**: Content platforms, mobile apps
- **Polyglot score**: 31/50 (C-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
