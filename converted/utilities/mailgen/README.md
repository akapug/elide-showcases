# mailgen - Elide Polyglot Showcase

> **One email generator for ALL languages** - TypeScript, Python, Ruby, and Java

Generate responsive HTML emails programmatically.

## ✨ Features

- ✅ Responsive HTML templates
- ✅ Transaction/receipt emails
- ✅ Customizable themes
- ✅ **Polyglot**: Use from all languages
- ✅ Zero dependencies

## 🚀 Quick Start

```typescript
import Mailgen from './elide-mailgen.ts';

const mailGenerator = new Mailgen({
  product: { name: 'Acme', link: 'https://acme.com' }
});

const html = mailGenerator.generate({
  body: {
    name: 'John',
    intro: 'Welcome!',
    action: {
      instructions: 'Click to confirm:',
      button: { color: '#22BC66', text: 'Confirm', link: 'https://...' }
    }
  }
});
```

## 📝 Package Stats

- **npm downloads**: 100K+/week

---

**Built with ❤️ for the Elide Polyglot Runtime**
