# juice - Elide Polyglot Showcase

> **One CSS inliner for ALL languages** - TypeScript, Python, Ruby, and Java

Inline CSS stylesheets into HTML for email compatibility.

## ✨ Features

- ✅ Inline CSS styles
- ✅ Email client compatibility
- ✅ Remove unused styles
- ✅ **Polyglot**: Use from all languages
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import juice from './elide-juice.ts';

const html = `<style>.btn { color: blue; }</style><a class="btn">Click</a>`;
const inlined = juice(html);
// <a class="btn" style="color: blue;">Click</a>
```

## 📝 Package Stats

- **npm downloads**: 100K+/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
