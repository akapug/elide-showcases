# Node Screenshots - Elide Polyglot Showcase

> **One screenshot library for ALL languages** - TypeScript, Python, Ruby, and Java

Cross-platform screenshot library with multi-monitor support.

## Features

- Multi-monitor screenshots
- Region capture
- Fast native implementation
- **~10K downloads/week on npm**

## Quick Start

```typescript
import { getDisplays, captureDisplay } from './elide-node-screenshots.ts';

const displays = await getDisplays();
const img = await captureDisplay(0);
```

## Links

- [Original npm package](https://www.npmjs.com/package/node-screenshots)

---

**Built with ❤️ for the Elide Polyglot Runtime**
