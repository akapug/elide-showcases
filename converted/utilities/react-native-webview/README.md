# React Native WebView - Elide Polyglot Showcase

> **One WebView component for ALL languages** - TypeScript, Python, Ruby, and Java

React Native WebView for rendering web content.

## Features

- Load web pages and HTML
- JavaScript injection
- Message passing
- Navigation control
- Cookie management
- **~2M downloads/week on npm**

## Quick Start

```typescript
import { WebView } from './elide-react-native-webview.ts';

const webview = new WebView({
  source: { uri: 'https://example.com' },
  onLoad: () => console.log('Loaded!'),
});
```

## Documentation

Run the demo:

```bash
elide run elide-react-native-webview.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-native-webview)

---

**Built with ❤️ for the Elide Polyglot Runtime**
