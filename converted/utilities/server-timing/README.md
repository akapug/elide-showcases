# server-timing - Elide Polyglot Showcase

> **Server-Timing header for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Server-Timing header generation
- Performance metrics
- Multiple timing entries
- Browser DevTools integration
- **~50K downloads/week on npm**

## Quick Start

```typescript
import serverTiming from './elide-server-timing.ts';

app.use(serverTiming());

app.get('/api/users', (req, res) => {
  res.serverTiming.add('db', 'Database query', 45.23);
  res.send({ users: [] });
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/server-timing)

---

**Built with ❤️ for the Elide Polyglot Runtime**
