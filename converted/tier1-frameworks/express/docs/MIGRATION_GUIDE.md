# Migration Guide: Express on Node.js → Express on Elide

> Complete guide to migrating your Express applications from Node.js to Elide

## Table of Contents

- [Quick Migration](#quick-migration)
- [Step-by-Step Guide](#step-by-step-guide)
- [Breaking Changes](#breaking-changes)
- [Common Patterns](#common-patterns)
- [Testing Your Migration](#testing-your-migration)
- [Performance Tuning](#performance-tuning)
- [Troubleshooting](#troubleshooting)

## Quick Migration

For most Express applications, migration is straightforward:

### Before (Node.js)

```javascript
const express = require('express');
const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);
```

### After (Elide)

```typescript
import express from '@elide/express';

const app = express();

app.get('/', (req, res) => {
  res.send('Hello World');
});

app.listen(3000);
```

**That's it!** In most cases, changing the import is all you need.

## Step-by-Step Guide

### Step 1: Install Elide

```bash
# Install GraalVM (if not already installed)
sdk install java 21.0.1-graal

# Or download from https://www.graalvm.org/downloads/

# Install Elide CLI
npm install -g @elide/cli

# Verify installation
elide --version
```

### Step 2: Update Package Dependencies

```json
{
  "dependencies": {
    "express": "^4.18.2"  // Remove
  },
  "devDependencies": {
    "@elide/express": "*"  // Add
  }
}
```

### Step 3: Convert CommonJS to ES Modules

Elide uses ES modules. Convert your code:

**Before:**
```javascript
const express = require('express');
const bodyParser = require('body-parser');
module.exports = app;
```

**After:**
```typescript
import express from '@elide/express';
// body-parser is built-in
export default app;
```

### Step 4: Update Imports

| Node.js Package | Elide Equivalent |
|----------------|------------------|
| `express` | `@elide/express` |
| `body-parser` | Built-in: `express.json()`, `express.urlencoded()` |
| `cors` | `@elide/express/middleware/cors` |
| `compression` | `@elide/express/middleware/compression` |
| `serve-static` | Built-in: `express.static()` |

### Step 5: Run Your App

```bash
# Node.js
node app.js

# Elide
elide run app.ts
```

### Step 6: Test Thoroughly

```bash
# Run your test suite
npm test

# Or with Elide
elide test
```

## Breaking Changes

### None!

Express on Elide maintains 100% API compatibility with Express 4.x.

However, there are **environment differences** to be aware of:

### 1. Native Modules

Some Node.js native modules may not work with GraalVM.

**Common Issues:**

```javascript
// May not work
const bcrypt = require('bcrypt');  // Native C++ module

// Alternative
const bcrypt = require('bcryptjs'); // Pure JS version
```

**Solutions:**
- Use pure JavaScript alternatives when available
- Check GraalVM compatibility: https://www.graalvm.org/latest/reference-manual/js/

### 2. File System Paths

Use absolute paths or `path.resolve()` for cross-platform compatibility:

```typescript
// Don't
app.use(express.static('public'));

// Do
import path from 'path';
app.use(express.static(path.join(__dirname, 'public')));

// Or
app.use(express.static(path.resolve(process.cwd(), 'public')));
```

### 3. Environment Variables

Access them the same way:

```typescript
const PORT = process.env.PORT || 3000;
const DB_URL = process.env.DATABASE_URL;
```

### 4. Async/Await

Works identically:

```typescript
app.get('/users', async (req, res) => {
  try {
    const users = await db.findAll();
    res.json(users);
  } catch (err) {
    next(err);
  }
});
```

## Common Patterns

### REST API Migration

```typescript
// Before (Node.js)
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
app.use(bodyParser.json());

// After (Elide)
import express from '@elide/express';

const app = express();
app.use(express.json()); // Built-in!
```

### Middleware Migration

```typescript
// Before (Node.js)
const cors = require('cors');
const compression = require('compression');

app.use(cors());
app.use(compression());

// After (Elide)
import { cors, compression } from '@elide/express/middleware';

app.use(cors());
app.use(compression());
```

### Error Handling Migration

```typescript
// Same in both!
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});
```

### Database Integration

```typescript
// Works the same way
import mongoose from 'mongoose';

mongoose.connect(process.env.MONGODB_URI);

app.get('/users', async (req, res) => {
  const users = await User.find();
  res.json(users);
});
```

### Authentication

```typescript
// Passport.js works with Elide
import passport from 'passport';

app.use(passport.initialize());
app.use(passport.session());

app.post('/login',
  passport.authenticate('local'),
  (req, res) => {
    res.json({ success: true });
  }
);
```

## Testing Your Migration

### 1. Unit Tests

Your existing tests should work as-is:

```typescript
// test/app.test.ts
import request from 'supertest';
import app from '../src/app';

describe('GET /', () => {
  it('responds with json', async () => {
    const response = await request(app)
      .get('/')
      .expect(200)
      .expect('Content-Type', /json/);

    expect(response.body.message).toBe('Hello');
  });
});
```

### 2. Integration Tests

Run with Elide:

```bash
elide test tests/**/*.test.ts
```

### 3. Load Testing

Compare performance:

```bash
# Node.js
node app.js &
wrk -t4 -c100 -d30s http://localhost:3000/
kill %1

# Elide
elide run app.ts &
wrk -t4 -c100 -d30s http://localhost:3000/
kill %1
```

### 4. Manual Testing

Checklist:
- [ ] All routes respond correctly
- [ ] Middleware executes in order
- [ ] Error handling works
- [ ] Static files serve
- [ ] Database queries work
- [ ] Authentication works
- [ ] File uploads work

## Performance Tuning

### 1. JIT Warm-up

GraalVM JIT needs warm-up for peak performance:

```typescript
// Add warm-up phase in production
if (process.env.NODE_ENV === 'production') {
  // Make 1000 internal requests to warm up JIT
  for (let i = 0; i < 1000; i++) {
    await fetch('http://localhost:3000/health');
  }
  console.log('✓ JIT warm-up complete');
}
```

### 2. Native Image Compilation

For best cold start:

```bash
elide build --native app.ts
./app  # Starts in 10-30ms!
```

### 3. Enable Optimizations

```bash
# Run with optimization flags
elide run --optimize app.ts

# Or set in elide.yaml
optimization:
  level: aggressive
  jit: true
  inlining: true
```

### 4. Profile and Optimize

```bash
# CPU profiling
elide run --profile cpu app.ts

# Memory profiling
elide run --profile memory app.ts

# Generate flame graph
elide run --profile cpu --output flamegraph.html app.ts
```

## Gradual Migration Strategy

### Option 1: Parallel Deployment

Run both versions side-by-side:

```
┌─────────────┐
│   Load      │
│   Balancer  │
└──────┬──────┘
       │
       ├────────────┐
       │            │
  ┌────▼─────┐ ┌───▼─────┐
  │ Node.js  │ │  Elide  │
  │ 90%      │ │  10%    │
  └──────────┘ └─────────┘
```

Gradually increase Elide traffic as confidence grows.

### Option 2: Route-by-Route

Migrate one route at a time:

```typescript
// app.ts
import express from '@elide/express';
import { legacyRoutes } from './legacy-node';  // Proxy to Node.js

const app = express();

// New routes on Elide
app.get('/api/v2/*', newHandlers);

// Old routes proxy to Node.js
app.use('/api/v1/*', legacyRoutes);
```

### Option 3: Service-by-Service

For microservices, migrate one service at a time:

```
Auth Service     → Migrated to Elide ✓
User Service     → Migrated to Elide ✓
Payment Service  → Still on Node.js
Email Service    → Still on Node.js
```

## Common Pitfalls

### 1. Forgetting JIT Warm-up

```typescript
// Don't benchmark immediately
app.listen(3000);
// benchmark(); // ❌ Cold JIT

// Do warm up first
app.listen(3000);
await warmup();
// benchmark(); // ✓ Warm JIT
```

### 2. Using Node.js-specific APIs

```typescript
// Don't use Node.js internals
const v8 = require('v8');  // ❌ Won't work

// Use standard APIs
const memory = process.memoryUsage();  // ✓ Works
```

### 3. Hardcoding Paths

```typescript
// Don't hardcode
app.use(express.static('/Users/me/project/public'));  // ❌

// Use relative paths
app.use(express.static(path.join(__dirname, 'public')));  // ✓
```

## Migration Checklist

- [ ] Install GraalVM and Elide
- [ ] Update package.json dependencies
- [ ] Convert to ES modules
- [ ] Update imports to @elide/express
- [ ] Run tests
- [ ] Check for native module dependencies
- [ ] Test in development
- [ ] Load test
- [ ] Deploy to staging
- [ ] Monitor performance
- [ ] Deploy to production
- [ ] Celebrate! 🎉

## Getting Help

If you encounter issues:

1. Check [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)
2. Review [examples/](../examples/)
3. Read [GraalVM documentation](https://www.graalvm.org/latest/docs/)
4. Open an issue on GitHub

## Summary

Migrating from Express on Node.js to Express on Elide is straightforward:

✅ Change import statement
✅ Convert to ES modules
✅ Update middleware imports
✅ Test thoroughly
✅ Enjoy 2-20x performance boost!

The API is 100% compatible, so your existing Express knowledge transfers directly.
