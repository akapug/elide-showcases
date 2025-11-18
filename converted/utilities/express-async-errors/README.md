# express-async-errors - Elide Polyglot Showcase

> **Async error handling for Express for ALL languages** - TypeScript, Python, Ruby, and Java

## Features

- Automatic async error handling
- No try-catch needed
- Works with async/await
- **~3M downloads/week on npm**

## Quick Start

```typescript
import express from 'express';
import 'express-async-errors'; // Just import it!

const app = express();

// Now async errors are automatically caught
app.get('/users/:id', async (req, res) => {
  const user = await db.users.findById(req.params.id);
  // If this throws, it's automatically caught!
  res.json(user);
});

// Error handler
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```

## Links

- [Original npm package](https://www.npmjs.com/package/express-async-errors)

---

**Built with ❤️ for the Elide Polyglot Runtime**
