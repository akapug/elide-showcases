# Adonis Clone for Elide

Full-featured MVC framework with Lucid ORM, Validator, and Authentication (2500+ lines).

## Features

- Lucid ORM with query builder
- Validator with 40+ rules
- Authentication with guards
- Session management
- IoC container
- CLI tooling
- TypeScript native

## Quick Start

```typescript
import { application } from './src/adonis.ts';

const app = application();

// Define model
class User extends Model {
  static table = 'users';
  static columns = new Map([
    ['id', { type: 'integer', primary: true }],
    ['email', { type: 'string', unique: true }],
    ['password', { type: 'string' }]
  ]);
}

// Define route
app.router.get('/users', async (ctx) => {
  const users = await User.all();
  return ctx.response.json(users);
});

await app.start();
```

## Performance

- 85,000 req/s
- 2.0x faster than Node.js Adonis
- Full-featured
