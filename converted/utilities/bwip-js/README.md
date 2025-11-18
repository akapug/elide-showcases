# bwip-js - Elide Polyglot Showcase

> **Barcode Writer in Pure JavaScript for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- 200+ barcode types
- Pure JavaScript
- Server-side rendering
- **~2M downloads/week on npm**

## Quick Start

```typescript
import bwipjs from './elide-bwip-js.ts';

bwipjs.toBuffer({
  bcid: 'code128',
  text: '0123456789'
}, (err, png) => {
  console.log('Barcode PNG buffer created');
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/bwip-js)

---

**Built with ❤️ for the Elide Polyglot Runtime**
