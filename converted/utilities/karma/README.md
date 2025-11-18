# karma - Elide Polyglot Showcase

> **One test runner for ALL languages** - TypeScript, Python, Ruby, and Java

Spectacular Test Runner for JavaScript.

## Features

- Real browser testing
- Remote control
- Framework agnostic
- CI integration
- Plugin system
- Zero dependencies
- **~1M downloads/week on npm**

## Quick Start

```typescript
import { config, Server } from './elide-karma.ts';

config((cfg) => {
  cfg.set({
    frameworks: ['jasmine'],
    browsers: ['Chrome'],
    files: ['test/**/*.spec.ts']
  });
});

const server = new Server({});
server.start();
```

## Links

- [Original npm package](https://www.npmjs.com/package/karma)

---

**Built with ❤️ for the Elide Polyglot Runtime**
