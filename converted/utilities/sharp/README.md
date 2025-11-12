# Sharp - Elide Polyglot Showcase

> **One image processor for ALL languages**

## Quick Start

```typescript
import sharp from './elide-sharp.ts';

// Resize image
await sharp('input.jpg')
  .resize(800, 600)
  .jpeg({ quality: 90 })
  .toFile('output.jpg');

// Create thumbnail
await sharp('input.jpg')
  .resize(200, 200, { fit: 'cover' })
  .toFile('thumbnail.jpg');
```

## Package Stats

- **npm downloads**: ~11M/week
- **Polyglot score**: 39/50 (B-Tier)

---

**Built with ❤️ for the Elide Polyglot Runtime**
