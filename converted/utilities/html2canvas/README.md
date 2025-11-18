# html2canvas - Elide Polyglot Showcase

> **One html2canvas for ALL languages** - TypeScript, Python, Ruby, and Java

Take screenshots of web pages or DOM elements.

## Features

- HTML to canvas rendering
- Screenshot generation
- DOM element capture
- CSS rendering
- Image export
- **~8M downloads/week on npm**

## Quick Start

```typescript
import html2canvas from './elide-html2canvas.ts';

const element = document.querySelector('#app');

const canvas = await html2canvas(element, {
  backgroundColor: '#ffffff',
  scale: 2
});

// Export as image
const dataURL = canvas.toDataURL('image/png');
const link = document.createElement('a');
link.download = 'screenshot.png';
link.href = dataURL;
link.click();
```

## Links

- [Original npm package](https://www.npmjs.com/package/html2canvas)

---

**Built with ❤️ for the Elide Polyglot Runtime**
