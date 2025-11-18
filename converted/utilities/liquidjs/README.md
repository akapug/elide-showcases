# LiquidJS - Elide Polyglot Showcase

> **One Liquid template engine for ALL languages** - TypeScript, Python, Ruby, and Java

JavaScript implementation of Liquid templating, perfect for e-commerce and static sites.

## Features

- Liquid template syntax
- Filters and tags
- Template inheritance
- Async rendering
- Shopify/Jekyll compatibility
- Extensible
- **~2M downloads/week on npm**

## Quick Start

```typescript
import Liquid from './elide-liquidjs.ts';

const liquid = new Liquid();

const template = "Hello {{ name | upcase }}!";
console.log(liquid.parseAndRender(template, { name: "world" }));
```

## Documentation

Run the demo:

```bash
elide run elide-liquidjs.ts
```

## Links

- [Original npm package](https://www.npmjs.com/package/liquidjs)

---

**Built with ❤️ for the Elide Polyglot Runtime**
