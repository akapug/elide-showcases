# Stream Detection (is-stream) - Elide Polyglot Showcase

Reliable Stream detection for Node.js and Web Streams API.

## 🚀 Quick Start

```typescript
import isStream, { isReadableStream, isWritableStream } from './elide-is-stream.ts';

// General stream detection
isStream(new ReadableStream())    // true
isStream(new WritableStream())    // true
isStream({})                      // false

// Type-specific detection
isReadableStream(new ReadableStream())  // true
isWritableStream(new WritableStream())  // true
```

## 📝 Package Stats

- **npm downloads**: ~80M/week
- **Elide advantage**: Polyglot consistency

---

**Built with ❤️ for the Elide Polyglot Runtime**
