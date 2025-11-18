# unique-slug - Generate Unique Slugs - Elide Polyglot Showcase

> **One slug generator for ALL languages**

Generate unique URL-safe slugs with random or hash-based generation.

## 🚀 Quick Start

```typescript
import uniqueSlug from './elide-unique-slug.ts';

// Random slug
const random = uniqueSlug();
// 'a3f2b1c4'

// Hash from string (deterministic)
const slug1 = uniqueSlug('hello');
const slug2 = uniqueSlug('hello');
// Both are 'a3f2b1c4' (same input = same slug)

// URL generation
const articleSlug = uniqueSlug('10 Tips for Better Code');
const url = `https://blog.example.com/posts/${articleSlug}`;
```

## 📝 Stats

- **npm downloads**: ~5M+/week
- **URL-safe characters**
- **Deterministic hashing**

---

**Built with ❤️ for the Elide Polyglot Runtime**
