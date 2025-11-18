# react-axe - Elide Polyglot Showcase

> **React accessibility testing for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Real-time React testing
- Development mode warnings
- Component-level audits
- Integration with axe-core
- **~100K+ downloads/week on npm**

## Quick Start

```typescript
import reactAxe from './elide-react-axe.ts';

await reactAxe.init();
const violations = await reactAxe.audit(component);
reactAxe.reportToConsole(violations);
```

## Links

- [Original npm package](https://www.npmjs.com/package/react-axe)

---

**Built with ❤️ for the Elide Polyglot Runtime**
