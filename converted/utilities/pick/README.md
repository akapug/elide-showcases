# Pick - Elide Polyglot Showcase

> **One data projection implementation for ALL languages** - TypeScript, Python, Ruby, and Java

Select object properties with a single implementation that works across your entire polyglot stack.

## Features

- ✅ Pick multiple properties at once
- ✅ Deep pick for nested properties (dot notation)
- ✅ Pick by predicate function
- ✅ Pick defined/truthy values
- ✅ Pattern matching support
- ✅ **Polyglot**: Works across all languages
- ✅ Zero dependencies

## Quick Start

```typescript
import pick, { pickDeep } from './elide-pick.ts';

// Create DTO
const userDTO = pick(user, 'id', 'username', 'email');

// Deep pick
const selected = pickDeep(data, 'user.profile.name', 'user.settings.theme');
```

## Use Cases

- ✅ Create DTOs (Data Transfer Objects)
- ✅ API response projection
- ✅ Database column selection
- ✅ GraphQL field selection
- ✅ Form data extraction

## Files

- `elide-pick.ts` - Main implementation
- `elide-pick.py` - Python integration
- `elide-pick.rb` - Ruby integration
- `ElidePickExample.java` - Java integration
- `benchmark.ts` - Performance comparison
- `CASE_STUDY.md` - Real-world story
- `README.md` - This file

## Package Stats

- **npm downloads**: ~12M/week
- **Use case**: DTOs, API projection
- **Polyglot score**: 30/50 (C-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
